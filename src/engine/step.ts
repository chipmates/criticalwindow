/**
 * The pure fold: step(data, state, action) -> state.
 *
 * Phase order inside a turn (HANDOVER 5.1):
 *   upkeep (on advance) -> allocate -> policy -> event(s) -> world update
 *   (rival -> posture -> society -> election -> evals -> endings) -> report -> advance
 *
 * Everything here is exact integer math over cloned plain state. Illegal
 * actions throw EngineError with a code; the UI renders from legalActions()
 * and never guesses. v0 world rules mirror the paper kit's reference card
 * (Block B4 deepens them; the constants live in data/parameters.json).
 */
import type { EngineData } from './data';
import { clamp, divRound, evalCurve, mulDiv } from './math';
import { drawFromStream, nextInt, nextIntInRange, weightedIndex } from './rng';
import type {
  ChoiceEventData,
  EffectSetData,
  FixedEventData,
  ParametersData,
  PolicyCardData,
  WildcardEventData,
} from './schemas';
import type { Action, ActionType, EffectTarget, EraId, GameState, LogEntry, Phase } from './types';
import { ALLOCATION_TOTAL, SCALE_MAX, SCALE_MIN } from './types';

/** Allocation cap on the capability share during a forced pause (incident fallout). */
export const FORCED_PAUSE_CAPABILITY_MAX = 30;

export class EngineError extends Error {
  readonly code:
    | 'runEnded'
    | 'wrongPhase'
    | 'badAllocation'
    | 'unknownPolicy'
    | 'policyNotInHand'
    | 'policyGated'
    | 'policyUnaffordable'
    | 'wrongEvent'
    | 'badChoice';
  constructor(code: EngineError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Legality
// ---------------------------------------------------------------------------

const LEGAL: Record<Phase, ActionType[]> = {
  allocate: ['allocate'],
  policy: ['playPolicy', 'skipPolicy'],
  event: ['resolveEventChoice'],
  report: ['advance'],
  ended: [],
};

export function legalActions(state: GameState): ActionType[] {
  return LEGAL[state.phase];
}

/** Deep-clone plain JSON state (no classes, no Dates: structuredClone is safe). */
function clone(state: GameState): GameState {
  return structuredClone(state);
}

function pushLog(state: GameState, entry: Omit<LogEntry, 'turn'>): void {
  state.log.push({ turn: state.turn, ...entry });
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

const RESOURCE_TARGETS = new Set([
  'compute',
  'energy',
  'talent',
  'capital',
  'publicTrust',
  'politicalCapital',
  'capability',
  'safetyInsight',
]);

function applyDelta(state: GameState, target: EffectTarget, delta: number): number {
  const apply = (current: number): number => clamp(current + delta, SCALE_MIN, SCALE_MAX);
  if (RESOURCE_TARGETS.has(target)) {
    const key = target as keyof GameState['resources'];
    const before = state.resources[key];
    state.resources[key] = apply(before);
    return state.resources[key] - before;
  }
  switch (target) {
    case 'society.jobDisplacement': {
      const before = state.society.jobDisplacement;
      state.society.jobDisplacement = apply(before);
      return state.society.jobDisplacement - before;
    }
    case 'society.unrest': {
      const before = state.society.unrest;
      state.society.unrest = apply(before);
      return state.society.unrest - before;
    }
    case 'rival.trust': {
      const before = state.rival.trust;
      state.rival.trust = apply(before);
      return state.rival.trust - before;
    }
    case 'rival.capability': {
      const before = state.rival.capability;
      state.rival.capability = apply(before);
      return state.rival.capability - before;
    }
    case 'rival.substitution': {
      const before = state.rival.substitution;
      state.rival.substitution = apply(before);
      return state.rival.substitution - before;
    }
    case 'hidden.trueAlignment': {
      const before = state.hidden.trueAlignment;
      state.hidden.trueAlignment = apply(before);
      return state.hidden.trueAlignment - before;
    }
    case 'hidden.agencyErosion': {
      const before = state.hidden.agencyErosion;
      state.hidden.agencyErosion = apply(before);
      return state.hidden.agencyErosion - before;
    }
    default:
      throw new EngineError('badChoice', `unknown effect target '${target}'`);
  }
}

function setFlag(state: GameState, flag: string): void {
  if (!state.flags.includes(flag)) {
    state.flags = [...state.flags, flag].sort();
  }
}

function applyEffects(
  state: GameState,
  effects: EffectSetData,
  logKind: LogEntry['kind'],
  meta: Record<string, string | number | boolean>,
): void {
  const deltas: Partial<Record<EffectTarget, number>> = {};
  for (const [key, value] of Object.entries(effects)) {
    if (key === 'flags') {
      for (const flag of value as string[]) {
        setFlag(state, flag);
      }
      continue;
    }
    if (key === 'clearFlags') {
      state.flags = state.flags.filter((f) => !(value as string[]).includes(f));
      continue;
    }
    if (typeof value === 'number') {
      const applied = applyDelta(state, key as EffectTarget, value);
      if (applied !== 0) {
        deltas[key as EffectTarget] = applied;
      }
    }
  }
  pushLog(state, { kind: logKind, stringKey: null, deltas, meta });
}

function queueDelayed(
  state: GameState,
  spec: Array<{ inTurns: number; effects: EffectSetData }> | undefined,
  sourceKind: 'event' | 'policy',
  sourceId: string,
  choiceIndex: number | null,
): void {
  for (const delayed of spec ?? []) {
    state.delayed.push({
      dueTurn: state.turn + delayed.inTurns,
      effects: delayed.effects as GameState['delayed'][number]['effects'],
      sourceKind,
      sourceId,
      choiceIndex,
    });
  }
}

// ---------------------------------------------------------------------------
// Era
// ---------------------------------------------------------------------------

export function eraForTurn(parameters: ParametersData, turn: number): EraId {
  let era: EraId = parameters.turnStructure.eras[0]!.id;
  for (const candidate of parameters.turnStructure.eras) {
    if (turn >= candidate.fromTurn) {
      era = candidate.id;
    }
  }
  return era;
}

const ERA_ORDER: Record<EraId, number> = { early: 0, mid: 1, late: 2 };

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function handleAllocate(
  data: EngineData,
  state: GameState,
  action: Extract<Action, { type: 'allocate' }>,
): void {
  const { capability, safety, diffusion } = action;
  if (
    ![capability, safety, diffusion].every((v) => Number.isInteger(v) && v >= 0) ||
    capability + safety + diffusion !== ALLOCATION_TOTAL
  ) {
    throw new EngineError('badAllocation', 'allocation shares must be >=0 and sum to 100');
  }
  const paused = state.flags.includes('forcedPause');
  if (paused) {
    if (capability > FORCED_PAUSE_CAPABILITY_MAX) {
      throw new EngineError(
        'badAllocation',
        `forced pause: capability share is capped at ${FORCED_PAUSE_CAPABILITY_MAX} this turn`,
      );
    }
    state.flags = state.flags.filter((f) => f !== 'forcedPause');
  }
  state.allocation = { capability, safety, diffusion };

  const rndCurve = data.parameters.curves['rndCapacity'];
  const capCurve = data.parameters.curves['capabilityPerRnd'];
  if (!rndCurve || !capCurve) {
    throw new EngineError('badAllocation', 'parameters must define rndCapacity/capabilityPerRnd');
  }
  const rndPoints = evalCurve(rndCurve, state.resources.compute + state.resources.talent);
  const capPts = mulDiv(rndPoints, capability, 100);
  const safetyPts = mulDiv(rndPoints, safety, 100);
  const diffusionPts = mulDiv(rndPoints, diffusion, 100);

  const capabilityGain = evalCurve(capCurve, capPts);
  const before = state.resources.capability;
  state.resources.capability = clamp(before + capabilityGain, SCALE_MIN, SCALE_MAX);
  const insightGain = divRound(safetyPts, 2);
  state.resources.safetyInsight = clamp(
    state.resources.safetyInsight + insightGain,
    SCALE_MIN,
    SCALE_MAX,
  );

  state.turnScratch.capabilityGained = state.resources.capability - before;
  state.turnScratch.diffusionPts = diffusionPts;

  pushLog(state, {
    kind: 'allocation',
    stringKey: null,
    deltas: {
      capability: state.resources.capability - before,
      safetyInsight: insightGain,
    },
    meta: { rndPoints, capPts, safetyPts, diffusionPts },
  });
  state.phase = 'policy';
}

function policyGateFailure(
  parameters: ParametersData,
  state: GameState,
  card: PolicyCardData,
): string | null {
  const gates = card.gates;
  if (!gates) {
    return null;
  }
  if (gates.publicTrustMin !== undefined && state.resources.publicTrust < gates.publicTrustMin) {
    return 'publicTrustMin';
  }
  if (
    gates.politicalCapitalMin !== undefined &&
    state.resources.politicalCapital < gates.politicalCapitalMin
  ) {
    return 'politicalCapitalMin';
  }
  if (gates.capabilityMin !== undefined && state.resources.capability < gates.capabilityMin) {
    return 'capabilityMin';
  }
  if (gates.eraMin !== undefined) {
    const current = eraForTurn(parameters, state.turn);
    if (ERA_ORDER[current] < ERA_ORDER[gates.eraMin]) {
      return 'eraMin';
    }
  }
  if (gates.flagsAll && !gates.flagsAll.every((f) => state.flags.includes(f))) {
    return 'flagsAll';
  }
  if (gates.flagsNone && gates.flagsNone.some((f) => state.flags.includes(f))) {
    return 'flagsNone';
  }
  return null;
}

/** UI helper: which hand cards are playable right now, with lock reasons. */
export function playablePolicies(
  data: EngineData,
  state: GameState,
): Array<{ id: string; playable: boolean; reason: string | null }> {
  return state.policy.hand.map((id) => {
    const card = data.policies.find((p) => p.id === id);
    if (!card) {
      return { id, playable: false, reason: 'unknown' };
    }
    const gate = policyGateFailure(data.parameters, state, card);
    if (gate) {
      return { id, playable: false, reason: gate };
    }
    if (!canAfford(state, card)) {
      return { id, playable: false, reason: 'cost' };
    }
    return { id, playable: true, reason: null };
  });
}

function canAfford(state: GameState, card: PolicyCardData): boolean {
  const costPc = card.cost?.politicalCapital ?? 0;
  const costCap = card.cost?.capital ?? 0;
  return state.resources.politicalCapital >= costPc && state.resources.capital >= costCap;
}

function handlePlayPolicy(
  data: EngineData,
  state: GameState,
  action: Extract<Action, { type: 'playPolicy' }>,
): void {
  const card = data.policies.find((p) => p.id === action.policyId);
  if (!card) {
    throw new EngineError('unknownPolicy', `no policy '${action.policyId}' in the deck`);
  }
  if (!state.policy.hand.includes(card.id)) {
    throw new EngineError('policyNotInHand', `policy '${card.id}' is not in hand`);
  }
  const gate = policyGateFailure(data.parameters, state, card);
  if (gate) {
    throw new EngineError('policyGated', `policy '${card.id}' gated by ${gate}`);
  }
  if (!canAfford(state, card)) {
    throw new EngineError('policyUnaffordable', `cannot afford policy '${card.id}'`);
  }

  state.resources.politicalCapital -= card.cost?.politicalCapital ?? 0;
  state.resources.capital -= card.cost?.capital ?? 0;
  applyEffects(state, card.effects ?? {}, 'policyPlayed', {
    policyId: card.id,
    costPoliticalCapital: card.cost?.politicalCapital ?? 0,
    costCapital: card.cost?.capital ?? 0,
  });
  queueDelayed(state, card.delayedEffects, 'policy', card.id, null);

  // Chosen gamble (the structural coup): outcome is stochastic BY the card's
  // own copy. The only place a decision rolls dice — everything else obeys
  // "randomness changes the situation, not whether your decision works".
  if (card.gamble) {
    const gamble = card.gamble;
    let spiralProb = gamble.baseSpiralPerMille;
    spiralProb += gamble.postureModifiers?.[state.rival.posture] ?? 0;
    for (const mod of gamble.flagModifiers ?? []) {
      if (state.flags.includes(mod.flag)) {
        spiralProb += mod.deltaPerMille;
      }
    }
    spiralProb = clamp(spiralProb, 0, 1000);
    const [roll, nextWild] = nextInt(state.rng.wildcards, 1000);
    state.rng = { ...state.rng, wildcards: [...nextWild] as [number, number, number, number] };
    const spiraled = roll < spiralProb;
    applyEffects(state, spiraled ? gamble.spiral : gamble.deter, 'policyPlayed', {
      policyId: card.id,
      gambleOutcome: spiraled ? 'spiral' : 'deter',
    });
    if (spiraled && gamble.spiralSetsPosture && gamble.spiralSetsPosture !== state.rival.posture) {
      pushLog(state, {
        kind: 'rivalPostureChange',
        stringKey: null,
        deltas: null,
        meta: { from: state.rival.posture, to: gamble.spiralSetsPosture, cause: card.id },
      });
      state.rival.posture = gamble.spiralSetsPosture;
    }
  }

  state.policy.hand = state.policy.hand.filter((id) => id !== card.id);
  state.policy.playedThisTurn = card.id;
  if (card.oncePerRun) {
    state.policy.spent = [...state.policy.spent, card.id].sort();
  } else if (card.cooldown) {
    state.policy.cooldowns[card.id] = state.turn + card.cooldown;
  }
  if (card.tags.includes('diplomacy') || card.tags.includes('treaty')) {
    state.turnScratch.playedDiplomacy = true;
  }

  drawEvent(data, state);
}

function handleSkipPolicy(data: EngineData, state: GameState): void {
  state.policy.playedThisTurn = null;
  drawEvent(data, state);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function eventEligible(
  parameters: ParametersData,
  state: GameState,
  card: ChoiceEventData,
): boolean {
  if (!card.repeatable && state.firedEvents.includes(card.id)) {
    return false;
  }
  const trigger = card.trigger;
  if (trigger.era !== undefined && trigger.era !== eraForTurn(parameters, state.turn)) {
    return false;
  }
  if (trigger.turnMin !== undefined && state.turn < trigger.turnMin) {
    return false;
  }
  if (trigger.turnMax !== undefined && state.turn > trigger.turnMax) {
    return false;
  }
  const conditions = trigger.conditions;
  if (conditions) {
    if (conditions.rivalPosture !== undefined && state.rival.posture !== conditions.rivalPosture) {
      return false;
    }
    if (conditions.flagsAll && !conditions.flagsAll.every((f) => state.flags.includes(f))) {
      return false;
    }
    if (conditions.flagsNone && conditions.flagsNone.some((f) => state.flags.includes(f))) {
      return false;
    }
    for (const [key, min] of Object.entries(conditions.resourceMin ?? {})) {
      if (state.resources[key as keyof GameState['resources']] < (min as number)) {
        return false;
      }
    }
    for (const [key, max] of Object.entries(conditions.resourceMax ?? {})) {
      if (state.resources[key as keyof GameState['resources']] > (max as number)) {
        return false;
      }
    }
    for (const [key, min] of Object.entries(conditions.societyMin ?? {})) {
      if (state.society[key as keyof GameState['society']] < (min as number)) {
        return false;
      }
    }
    for (const [key, max] of Object.entries(conditions.societyMax ?? {})) {
      if (state.society[key as keyof GameState['society']] > (max as number)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * FIXED beats take the memo slot when due (TS-style: the scheduled thing
 * happens, you play around it). Real-past beats fire unconditionally in their
 * window; future beats require their R1 state-condition to hold.
 */
function fixedBeatDue(data: EngineData, state: GameState): FixedEventData | null {
  const beats = data.events
    .filter((card): card is FixedEventData => card.kind === 'fixed')
    .filter((card) => !state.firedEvents.includes(card.id))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const card of beats) {
    if (state.turn < card.fixedTurn.min || state.turn > card.fixedTurn.max) {
      continue;
    }
    if (!card.historical) {
      const cond = card.condition!;
      if (cond.era !== undefined && cond.era !== eraForTurn(data.parameters, state.turn)) {
        continue;
      }
      if (cond.minCapability !== undefined && state.resources.capability < cond.minCapability) {
        continue;
      }
      if (cond.flagsAll && !cond.flagsAll.every((f) => state.flags.includes(f))) {
        continue;
      }
      if (cond.flagsNone && cond.flagsNone.some((f) => state.flags.includes(f))) {
        continue;
      }
      if (cond.diceScaledFireProb !== undefined) {
        // Per-turn fire chance = the hidden die's value in per-mille: steep
        // worlds erupt sooner. Drawn on the events stream (it is scheduling).
        const [roll, nextRng] = nextInt(state.rng.events, 1000);
        state.rng = { ...state.rng, events: [...nextRng] as [number, number, number, number] };
        if (roll >= state.hidden.takeoffSteepness) {
          continue;
        }
      }
    }
    return card;
  }
  return null;
}

function drawEvent(data: EngineData, state: GameState): void {
  const beat = fixedBeatDue(data, state);
  if (beat) {
    state.pendingEvents = [{ eventId: beat.id, drawnOnTurn: state.turn }];
    pushLog(state, {
      kind: 'eventDrawn',
      stringKey: beat.title,
      deltas: null,
      meta: { eventId: beat.id, kind: 'fixed', historical: beat.historical },
    });
    state.phase = 'event';
    return;
  }
  const pool = data.events
    .filter((card): card is ChoiceEventData => card.kind === 'choice')
    .filter((card) => eventEligible(data.parameters, state, card))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  if (pool.length === 0) {
    worldUpdate(data, state);
    return;
  }
  const [index, nextRng] = weightedIndex(
    state.rng.events,
    pool.map((card) => card.trigger.weight),
  );
  state.rng = { ...state.rng, events: [...nextRng] as [number, number, number, number] };
  const drawn = pool[index]!;
  state.pendingEvents = [{ eventId: drawn.id, drawnOnTurn: state.turn }];
  pushLog(state, {
    kind: 'eventDrawn',
    stringKey: drawn.title,
    deltas: null,
    meta: { eventId: drawn.id, kind: 'choice' },
  });
  state.phase = 'event';
}

function handleResolveEvent(
  data: EngineData,
  state: GameState,
  action: Extract<Action, { type: 'resolveEventChoice' }>,
): void {
  const pending = state.pendingEvents[0];
  if (!pending || pending.eventId !== action.eventId) {
    throw new EngineError('wrongEvent', `event '${action.eventId}' is not pending`);
  }
  const card = data.events.find((e) => e.id === pending.eventId)!;
  if (card.kind === 'wildcard') {
    // Unreachable by construction: wildcards never enter pendingEvents.
    throw new EngineError('wrongEvent', `wildcard '${card.id}' cannot be resolved as a memo`);
  }
  const choice = card.choices[action.choiceIndex];
  if (!choice) {
    throw new EngineError('badChoice', `event '${card.id}' has no choice ${action.choiceIndex}`);
  }
  applyEffects(state, choice.effects ?? {}, 'eventResolved', {
    eventId: card.id,
    choiceIndex: action.choiceIndex,
  });
  queueDelayed(state, choice.delayedEffects, 'event', card.id, action.choiceIndex);
  state.firedEvents = [...state.firedEvents, card.id].sort();
  state.pendingEvents = [];
  worldUpdate(data, state);
}

// ---------------------------------------------------------------------------
// World update (v0 rules = the paper reference card, from parameters)
// ---------------------------------------------------------------------------

/**
 * Incident check (misalignment-incident system). Returns true if a rung-3
 * catastrophe ended the run. Damage is reduced by Safety Insight (detection
 * and containment), never to zero and never touching true alignment.
 */
function runIncidentCheck(data: EngineData, state: GameState): boolean {
  const incidents = data.incidents;
  const baseRisk = mulDiv(
    state.resources.capability,
    SCALE_MAX - state.hidden.trueAlignment,
    SCALE_MAX,
  );
  let pressurePct = 100;
  if (state.allocation.capability >= data.parameters.alignmentModel.crashThresholdShare.value) {
    pressurePct += incidents.riskFormula.pressureAllocationPct.value;
  }
  if (state.rival.posture === 'race') {
    pressurePct += incidents.riskFormula.pressureRivalRacePct.value;
  }
  const risk = clamp(mulDiv(baseRisk, pressurePct, 100), 0, SCALE_MAX);

  let rung: (typeof incidents.rungs)[number] | null = null;
  for (const candidate of incidents.rungs) {
    const cooldownUntil = state.incidentCooldowns[candidate.id] ?? 0;
    if (risk > candidate.threshold && state.turn >= cooldownUntil) {
      rung = candidate; // rungs are ladder-ordered: last match = highest
    }
  }
  if (!rung) {
    return false;
  }
  const fireProb = Math.min(500, risk - rung.threshold);
  const [roll, nextIncidents] = nextInt(state.rng.incidents, 1000);
  state.rng = { ...state.rng, incidents: [...nextIncidents] as [number, number, number, number] };
  if (roll >= fireProb) {
    return false;
  }

  const maxReduction = incidents.safetyInsightDamageReductionMaxPerMille.value;
  const reduction = Math.min(
    maxReduction,
    mulDiv(state.resources.safetyInsight, maxReduction, SCALE_MAX),
  );
  const deltas: Partial<Record<EffectTarget, number>> = {};
  for (const [key, value] of Object.entries(rung.baseDamage)) {
    if (key === 'flags') {
      for (const flag of value as string[]) {
        setFlag(state, flag);
      }
      continue;
    }
    if (typeof value === 'number') {
      const reduced = mulDiv(value, 1000 - reduction, 1000);
      const applied = applyDelta(state, key as EffectTarget, reduced);
      if (applied !== 0) {
        deltas[key as EffectTarget] = applied;
      }
    }
  }
  state.incidentCooldowns = {
    ...state.incidentCooldowns,
    [rung.id]: state.turn + rung.cooldownTurns,
  };
  if (rung.forcedPause) {
    setFlag(state, 'forcedPause');
  }
  pushLog(state, {
    kind: 'incident',
    stringKey: rung.title,
    deltas,
    meta: {
      rungId: rung.id,
      ladder: rung.ladder,
      risk,
      reductionPerMille: reduction,
      forcedPause: rung.forcedPause,
    },
  });
  if (
    rung.catastropheBelowTrueAlignment !== undefined &&
    state.hidden.trueAlignment < rung.catastropheBelowTrueAlignment
  ) {
    endRun(state, 'misalignedCatastrophe', {
      trigger: 'labAccident',
      trueAlignment: state.hidden.trueAlignment,
      alignmentDifficulty: state.hidden.alignmentDifficulty,
    });
    return true;
  }
  return false;
}

/** One wildcard check per turn: sorted pool order, first success fires. */
function runWildcardCheck(data: EngineData, state: GameState): void {
  if (state.turn < state.wildcardGlobalUntil) {
    return;
  }
  const pool = data.events
    .filter((card): card is WildcardEventData => card.kind === 'wildcard')
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const card of pool) {
    if (state.turn < (state.wildcardCooldowns[card.id] ?? 0)) {
      continue;
    }
    const eligible = card.fire.eligible;
    if (eligible) {
      if (eligible.turnMin !== undefined && state.turn < eligible.turnMin) {
        continue;
      }
      if (
        eligible.minCapability !== undefined &&
        state.resources.capability < eligible.minCapability
      ) {
        continue;
      }
      if (
        eligible.computeOverEnergyMin !== undefined &&
        state.resources.compute - state.resources.energy < eligible.computeOverEnergyMin
      ) {
        continue;
      }
      if (eligible.flagsAll && !eligible.flagsAll.every((f) => state.flags.includes(f))) {
        continue;
      }
      if (eligible.flagsNone && eligible.flagsNone.some((f) => state.flags.includes(f))) {
        continue;
      }
    }
    let prob = card.fire.probPerMille;
    for (const mod of card.fire.probModifiers ?? []) {
      if (state.flags.includes(mod.flag)) {
        prob += mod.deltaPerMille;
      }
    }
    prob = clamp(prob, 0, 1000);
    if (prob === 0) {
      continue;
    }
    const [roll, nextWild] = nextInt(state.rng.wildcards, 1000);
    state.rng = { ...state.rng, wildcards: [...nextWild] as [number, number, number, number] };
    if (roll >= prob) {
      continue;
    }

    const deltas: Partial<Record<EffectTarget, number>> = {};
    for (const [key, value] of Object.entries(card.effects ?? {})) {
      if (key === 'flags') {
        for (const flag of value as string[]) {
          setFlag(state, flag);
        }
        continue;
      }
      if (key === 'clearFlags') {
        state.flags = state.flags.filter((f) => !(value as string[]).includes(f));
        continue;
      }
      if (typeof value === 'number') {
        const applied = applyDelta(state, key as EffectTarget, value);
        if (applied !== 0) {
          deltas[key as EffectTarget] = applied;
        }
      }
    }
    for (const scaled of card.scaledEffects ?? []) {
      const exposureValue =
        scaled.exposure === 'capability'
          ? state.resources.capability
          : scaled.exposure === 'compute'
            ? state.resources.compute
            : clamp(state.resources.compute - state.resources.energy, 0, SCALE_MAX);
      let delta = scaled.base + mulDiv(scaled.coef, exposureValue, 1000);
      if (scaled.halveIfFlag && state.flags.includes(scaled.halveIfFlag)) {
        delta = divRound(delta, 2);
      }
      const applied = applyDelta(state, scaled.target, delta);
      if (applied !== 0) {
        deltas[scaled.target] = (deltas[scaled.target] ?? 0) + applied;
      }
    }
    queueDelayed(state, card.delayedEffects, 'event', card.id, null);
    state.wildcardCooldowns = {
      ...state.wildcardCooldowns,
      [card.id]: state.turn + card.fire.cooldownTurns,
    };
    state.wildcardGlobalUntil = state.turn + 2;
    pushLog(state, {
      kind: 'wildcard',
      stringKey: card.title,
      deltas,
      meta: { eventId: card.id },
    });
    return;
  }
}

/**
 * Milestone self-acceleration (capability ladder, R1): once a track crosses a
 * rung, each turn grants a passive bonus scaled by the hidden steepness die.
 * Highest crossed rung only — bounded swings, no stacking.
 */
function ladderAccel(
  data: EngineData,
  state: GameState,
  capability: number,
): { milestoneId: string; bonus: number } | null {
  let crossed: { id: string; selfAccel: number } | null = null;
  for (const milestone of data.parameters.capabilityLadder.milestones) {
    if (capability >= milestone.at.value) {
      crossed = { id: milestone.id, selfAccel: milestone.selfAccel.value };
    }
  }
  if (!crossed) {
    return null;
  }
  const bonus = mulDiv(crossed.selfAccel, state.hidden.takeoffSteepness, 1000);
  return bonus > 0 ? { milestoneId: crossed.id, bonus } : null;
}

function worldUpdate(data: EngineData, state: GameState): void {
  const rules = data.parameters.worldRules;
  const thresholds = data.parameters.thresholds;

  // 0. Takeoff self-acceleration (player side): milestones feed themselves.
  const playerAccel = ladderAccel(data, state, state.resources.capability);
  if (playerAccel) {
    const before = state.resources.capability;
    state.resources.capability = clamp(before + playerAccel.bonus, 0, SCALE_MAX);
    const applied = state.resources.capability - before;
    if (applied !== 0) {
      pushLog(state, {
        kind: 'upkeep',
        stringKey: null,
        deltas: { capability: applied },
        meta: { rule: 'selfAcceleration', milestone: playerAccel.milestoneId },
      });
    }
  }

  // 1. Rival acts by current posture.
  const posture = state.rival.posture;
  let rivalCapabilityGain: number;
  let rivalTrustDelta = 0;
  if (posture === 'race') {
    rivalCapabilityGain = rules.rivalMoves.race.capability.value;
    rivalTrustDelta = rules.rivalMoves.race.trust.value;
  } else if (posture === 'mirror') {
    rivalCapabilityGain = rules.rivalMoves.mirror.capability.value;
    if (state.turnScratch.capabilityGained >= rules.rivalMoves.mirror.matchTrigger.value) {
      rivalCapabilityGain += rules.rivalMoves.mirror.matchBonus.value;
    }
    if (state.turnScratch.playedDiplomacy) {
      rivalTrustDelta = rules.rivalMoves.mirror.diplomacyTrust.value;
    }
  } else {
    rivalCapabilityGain = rules.rivalMoves.cautious.capability.value;
    rivalTrustDelta = rules.rivalMoves.cautious.trust.value;
  }
  // Chip substitution pays off late: the long bite of export controls.
  if (state.rival.substitution >= rules.rivalDepth.substitutionBonusMin.value) {
    rivalCapabilityGain += rules.rivalDepth.substitutionBonus.value;
  }
  // The ladder is symmetric: their milestones feed themselves too (one world,
  // one steepness die — the envelope is shared, the seats are not).
  const rivalAccel = ladderAccel(data, state, state.rival.capability);
  if (rivalAccel) {
    rivalCapabilityGain += rivalAccel.bonus;
  }
  // Their progress is foggy too: seeded variance from the rival stream.
  const variance = rules.rivalDepth.progressVariance.value;
  const [wobble, nextRival] = nextIntInRange(state.rng.rival, -variance, variance);
  state.rng = { ...state.rng, rival: [...nextRival] as [number, number, number, number] };
  rivalCapabilityGain = Math.max(0, rivalCapabilityGain + wobble);

  state.rival.capability = clamp(state.rival.capability + rivalCapabilityGain, 0, SCALE_MAX);
  state.rival.trust = clamp(state.rival.trust + rivalTrustDelta, 0, SCALE_MAX);
  pushLog(state, {
    kind: 'rivalAction',
    stringKey: null,
    deltas: { 'rival.capability': rivalCapabilityGain, 'rival.trust': rivalTrustDelta },
    meta: { posture },
  });

  // 2. Posture check (first match wins).
  let nextPosture: GameState['rival']['posture'];
  if (
    state.rival.trust >= rules.postureChecks.cautiousTrustMin.value &&
    state.flags.includes('treatyChannel')
  ) {
    nextPosture = 'cautious';
  } else if (
    state.resources.capability - state.rival.capability >=
    rules.postureChecks.raceGapMin.value
  ) {
    nextPosture = 'race';
  } else if (state.rival.trust <= rules.postureChecks.raceTrustMax.value) {
    nextPosture = 'race';
  } else {
    nextPosture = 'mirror';
  }
  if (nextPosture !== state.rival.posture) {
    pushLog(state, {
      kind: 'rivalPostureChange',
      stringKey: null,
      deltas: null,
      meta: { from: state.rival.posture, to: nextPosture },
    });
    state.rival.posture = nextPosture;
  }

  // 3. Society. Displacement drifts toward the sourced curve's level for the
  // current capability (diffusion-coupled equilibrium, not an instant jump).
  const society = rules.society;
  const displacementCurve = data.parameters.curves['displacementFromCapability'];
  let displacementGain = 0;
  if (displacementCurve) {
    // The exposure curve is shared across worldviews (measured agreement);
    // the LAG divisor is the preset dial (fast-and-painful vs slow-diffusion).
    const lagDivisor =
      data.parameters.worldviewPresets[state.presetId].displacementLagDivisor.value;
    const target = evalCurve(displacementCurve, state.resources.capability);
    displacementGain = divRound(target - state.society.jobDisplacement, Math.max(1, lagDivisor));
  } else {
    if (state.resources.capability >= society.displacementCapabilityMin.value) {
      displacementGain += society.displacementPerTurn.value;
    }
    if (state.resources.capability >= society.displacementSurgeCapability.value) {
      displacementGain += society.displacementPerTurn.value;
    }
  }
  // Diffusion converts: relief against displacement first, trust when covered.
  const reliefUnits = Math.floor(
    state.turnScratch.diffusionPts / Math.max(1, society.diffusionReliefPer.value),
  );
  const reliefApplied = Math.min(
    reliefUnits * 50,
    Math.max(0, state.society.jobDisplacement + displacementGain),
  );
  const trustFromDiffusion = Math.max(0, reliefUnits * 50 - reliefApplied) > 0 ? 50 : 0;
  state.society.jobDisplacement = clamp(
    state.society.jobDisplacement + displacementGain - reliefApplied,
    0,
    SCALE_MAX,
  );
  let unrestGain = 0;
  if (state.society.jobDisplacement > state.resources.publicTrust) {
    unrestGain += society.unrestFromDisplacementGap.value;
  }
  if (state.society.jobDisplacement >= society.unrestSurgeDisplacement.value) {
    unrestGain += society.unrestFromDisplacementGap.value;
  }
  state.society.unrest = clamp(state.society.unrest + unrestGain, 0, SCALE_MAX);
  let trustDelta = trustFromDiffusion;
  const trustCurve = data.parameters.curves['trustFromUnrest'];
  if (trustCurve) {
    trustDelta += divRound(
      evalCurve(trustCurve, state.society.unrest),
      Math.max(1, rules.societyDepth.trustCurveDivisor.value),
    );
  } else if (state.society.unrest >= society.trustErosionUnrestMin.value) {
    trustDelta -= society.trustErosionPerTurn.value;
  }
  state.resources.publicTrust = clamp(state.resources.publicTrust + trustDelta, 0, SCALE_MAX);
  // Unrest is not economically free: sustained disorder drags capital and
  // talent (strikes, flight, risk premia). Takeaway 5 with teeth.
  let economicDrag = 0;
  if (state.society.unrest >= rules.societyDepth.unrestEconomicDragMin.value) {
    economicDrag = rules.societyDepth.unrestEconomicDrag.value;
    state.resources.capital = clamp(state.resources.capital - economicDrag, 0, SCALE_MAX);
    state.resources.talent = clamp(
      state.resources.talent - divRound(economicDrag, 2),
      0,
      SCALE_MAX,
    );
  }
  pushLog(state, {
    kind: 'societyUpdate',
    stringKey: null,
    deltas: {
      'society.jobDisplacement': displacementGain - reliefApplied,
      'society.unrest': unrestGain,
      publicTrust: trustDelta,
      capital: -economicDrag,
    },
    meta: { reliefApplied },
  });

  // 3b. True alignment drift (v0; Block B4 replaces with the real model).
  const safetyPts = mulDiv(
    evalCurve(
      data.parameters.curves['rndCapacity']!,
      state.resources.compute + state.resources.talent,
    ),
    state.allocation.safety,
    100,
  );
  let alignmentDrift = divRound(safetyPts, 2);
  if (state.allocation.capability >= data.parameters.alignmentModel.crashThresholdShare.value) {
    alignmentDrift -= data.parameters.alignmentModel.crashPenalty.value;
  }
  state.hidden.trueAlignment = clamp(state.hidden.trueAlignment + alignmentDrift, 0, SCALE_MAX);

  // 3c. Agency erosion (Gradual Disempowerment hook; accrues silently, no
  // log entry: every visible metric can stay green while this climbs. No P1
  // ending fires from it; the Alpha ending and debrief read it later).
  const erosion = rules.agencyErosion;
  if (state.resources.capability >= erosion.highCapabilityMin.value) {
    const shielded = state.allocation.diffusion >= erosion.diffusionShieldMin.value;
    const accrual = shielded ? divRound(erosion.perTurn.value, 2) : erosion.perTurn.value;
    state.hidden.agencyErosion = clamp(state.hidden.agencyErosion + accrual, 0, SCALE_MAX);
  }

  // 3d. Misalignment incidents: the hidden dice LEAKING. Risk rises with
  // capability x misalignment x pressure; one seeded check per turn against
  // the highest eligible rung. A player who reads their incident history has
  // better data than their evals — that is the design point.
  if (runIncidentCheck(data, state)) {
    return; // rung-3 catastrophe ended the run
  }

  // 3e. Wildcards: the world hits you, no choice. Publicly-listed pool,
  // bounded magnitudes, exposure-scaled damage: dice pick the weather,
  // prior play picks how wet you get.
  runWildcardCheck(data, state);

  // 4. Election.
  if (state.turn === data.parameters.turnStructure.electionTurn.value) {
    const election = rules.election;
    const renewed =
      state.resources.publicTrust >= election.trustMin.value &&
      state.society.unrest <= election.unrestMax.value;
    const swing = renewed ? election.mandateSwing.value : -election.mandateSwing.value;
    state.resources.politicalCapital = clamp(
      state.resources.politicalCapital + swing,
      0,
      SCALE_MAX,
    );
    pushLog(state, {
      kind: 'election',
      stringKey: null,
      deltas: { politicalCapital: swing },
      meta: { renewed },
    });
  }

  // 5. Eval report (band from parameters; center jitters inside the band).
  const evalParams = data.parameters.evalUncertainty;
  const band = Math.max(
    evalParams.floorBandWidth.value,
    evalParams.baseBandWidth.value -
      mulDiv(evalParams.safetyInsightNarrowing.value, state.resources.safetyInsight, 100),
  );
  // Deceptive pass (Sleeper Agents / alignment faking): the worse the true
  // alignment, the further the report reads ABOVE the truth. Interpretability
  // investment (Safety Insight) is the counter. The report never lies
  // downward: bad news you can trust, good news you cannot.
  let deceptionLift = 0;
  if (state.hidden.trueAlignment < 500) {
    const rawLift = mulDiv(
      500 - state.hidden.trueAlignment,
      evalParams.deceptionMaxLift.value,
      500,
    );
    const counter = mulDiv(
      evalParams.deceptionInsightCounter.value,
      state.resources.safetyInsight,
      100,
    );
    deceptionLift = Math.max(0, rawLift - counter);
  }
  const quarter = Math.max(1, divRound(band, 4));
  const [jitter, nextHidden] = nextIntInRange(state.rng.hiddenDice, -quarter, quarter);
  state.rng = { ...state.rng, hiddenDice: [...nextHidden] as [number, number, number, number] };
  const center = clamp(state.hidden.trueAlignment + deceptionLift + jitter, 0, SCALE_MAX);
  const report = {
    turn: state.turn,
    bandLow: clamp(center - divRound(band, 2), 0, SCALE_MAX),
    bandHigh: clamp(center + divRound(band, 2), 0, SCALE_MAX),
  };
  state.evalHistory = [...state.evalHistory, report];
  pushLog(state, {
    kind: 'evalReport',
    stringKey: null,
    deltas: null,
    meta: { bandLow: report.bandLow, bandHigh: report.bandHigh },
  });

  // 6. Ending checks (early endings; turn-limit resolution happens on advance).
  if (state.society.unrest >= thresholds.breakdownUnrest.value) {
    endRun(state, 'societalBreakdown', { trigger: 'unrest' });
    return;
  }
  // The player's crossing resolves first: if you reach the threshold, the
  // story is your gamble, even if the rival crossed the same quarter.
  if (state.resources.capability >= thresholds.capabilityThreshold.value) {
    resolveAlignment(state, { trigger: 'playerThreshold' });
    return;
  }
  if (state.rival.capability >= thresholds.capabilityThreshold.value) {
    endRun(state, 'outpaced', { trigger: 'rivalThreshold' });
    return;
  }
  if (
    state.flags.includes('treatyChannel') &&
    state.rival.trust >= thresholds.treatyTrustMin.value &&
    state.turn >= thresholds.treatySignTurnMin.value &&
    state.policy.playedThisTurn === 'compute_treaty_feeler'
  ) {
    endRun(state, 'negotiatedSlowdown', { trigger: 'treatySigned' });
    return;
  }

  state.phase = 'report';
}

function resolveAlignment(state: GameState, meta: Record<string, string | number | boolean>): void {
  const passed = state.hidden.trueAlignment >= state.hidden.alignmentDifficulty;
  endRun(state, passed ? 'flourishing' : 'misalignedCatastrophe', {
    ...meta,
    trueAlignment: state.hidden.trueAlignment,
    alignmentDifficulty: state.hidden.alignmentDifficulty,
  });
}

function endRun(
  state: GameState,
  endingId: GameState['endingId'] & string,
  meta: Record<string, string | number | boolean>,
): void {
  state.endingId = endingId;
  state.phase = 'ended';
  pushLog(state, { kind: 'ending', stringKey: null, deltas: null, meta: { endingId, ...meta } });
}

// ---------------------------------------------------------------------------
// Advance + upkeep
// ---------------------------------------------------------------------------

function handleAdvance(data: EngineData, state: GameState): void {
  const maxTurns = data.parameters.turnStructure.maxTurns.value;
  if (state.turn >= maxTurns) {
    finalResolution(data, state);
    return;
  }
  state.turn += 1;
  upkeep(data, state);
  state.phase = 'allocate';
}

/** Turn-limit resolution incl. the unresolved-2030 rule (windowStillOpen). */
function finalResolution(data: EngineData, state: GameState): void {
  const thresholds = data.parameters.thresholds;
  if (state.resources.capability >= thresholds.fogZoneStart.value) {
    resolveAlignment(state, { trigger: 'turnLimitInFog' });
    return;
  }
  setFlag(state, 'windowStillOpen');
  // Nearest tendency: score each ending's proximity, highest wins.
  // Ties break in declaration order (documented, deterministic).
  const scores: Array<[GameState['endingId'] & string, number]> = [
    ['outpaced', state.rival.capability - state.resources.capability],
    ['societalBreakdown', state.society.unrest - divRound(thresholds.breakdownUnrest.value, 2)],
    ['negotiatedSlowdown', state.flags.includes('treatyChannel') ? state.rival.trust - 500 : -1000],
    [
      'flourishing',
      divRound(
        state.resources.publicTrust + (1000 - state.society.unrest) + state.resources.safetyInsight,
        3,
      ) - 500,
    ],
  ];
  let best = scores[0]!;
  for (const candidate of scores) {
    if (candidate[1] > best[1]) {
      best = candidate;
    }
  }
  endRun(state, best[0], { trigger: 'turnLimit', windowStillOpen: true, score: best[1] });
}

function upkeep(data: EngineData, state: GameState): void {
  // Capital income from last turn's diffusion (before scratch reset).
  const income = mulDiv(
    state.turnScratch.diffusionPts,
    data.parameters.worldRules.upkeep.capitalIncomePerDiffusion.value,
    100,
  );
  if (income !== 0) {
    state.resources.capital = clamp(state.resources.capital + income, 0, SCALE_MAX);
  }
  const skippedLastTurn = state.policy.playedThisTurn === null;
  state.turnScratch = { capabilityGained: 0, diffusionPts: 0, playedDiplomacy: false };
  state.policy.playedThisTurn = null;

  pushLog(state, {
    kind: 'turnStart',
    stringKey: null,
    deltas: income !== 0 ? { capital: income } : null,
    meta: { era: eraForTurn(data.parameters, state.turn) },
  });

  // Delayed effects due this turn.
  const due = state.delayed.filter((d) => d.dueTurn === state.turn);
  state.delayed = state.delayed.filter((d) => d.dueTurn !== state.turn);
  for (const delayed of due) {
    applyEffects(state, delayed.effects, 'delayedEffect', {
      sourceKind: delayed.sourceKind,
      sourceId: delayed.sourceId,
    });
  }

  // Grid limit: compute cannot outrun energy forever.
  const slack = data.parameters.thresholds.gridSlackBeforeCap.value;
  if (state.resources.compute > state.resources.energy + slack) {
    state.resources.compute = clamp(state.resources.compute - 50, 0, SCALE_MAX);
    pushLog(state, {
      kind: 'upkeep',
      stringKey: null,
      deltas: { compute: -50 },
      meta: { rule: 'gridLimit' },
    });
  }

  // Cooldown expiry + hand refill (deterministic sorted order, no rng).
  for (const [id, availableTurn] of Object.entries(state.policy.cooldowns)) {
    if (state.turn >= availableTurn) {
      delete state.policy.cooldowns[id];
    }
  }
  // The hand ROTATES: skip a turn with a full hand and the longest-held
  // card returns to the pool. No refill deadlock, no infinite hoarding.
  const handSize = data.parameters.turnStructure.handSize.value;
  if (skippedLastTurn && state.policy.hand.length >= handSize) {
    const rotated = state.policy.hand[0]!;
    state.policy.hand = state.policy.hand.slice(1);
    pushLog(state, {
      kind: 'upkeep',
      stringKey: null,
      deltas: null,
      meta: { rule: 'handRotation', policyId: rotated },
    });
  }
  if (state.policy.hand.length < handSize) {
    const unavailable = new Set([
      ...state.policy.hand,
      ...state.policy.spent,
      ...Object.keys(state.policy.cooldowns),
    ]);
    const pool = data.policies
      .map((p) => p.id)
      .filter((id) => !unavailable.has(id))
      .sort();
    while (state.policy.hand.length < handSize && pool.length > 0) {
      // Append in deterministic pool order; hand keeps insertion order so
      // "longest-held" is simply the front.
      state.policy.hand = [...state.policy.hand, pool.shift()!];
    }
  }

  // Ticker draw (flavor selection for the UI; separate stream by design).
  const [, nextRng] = drawFromStream(state.rng, 'ticker', 1000);
  state.rng = nextRng;
}

// ---------------------------------------------------------------------------
// step()
// ---------------------------------------------------------------------------

export function step(data: EngineData, prior: GameState, action: Action): GameState {
  if (prior.phase === 'ended') {
    throw new EngineError('runEnded', 'the run has ended; start a new one or replay');
  }
  if (!legalActions(prior).includes(action.type)) {
    throw new EngineError(
      'wrongPhase',
      `action '${action.type}' is illegal in phase '${prior.phase}'`,
    );
  }
  const state = clone(prior);
  switch (action.type) {
    case 'allocate':
      handleAllocate(data, state, action);
      break;
    case 'playPolicy':
      handlePlayPolicy(data, state, action);
      break;
    case 'skipPolicy':
      handleSkipPolicy(data, state);
      break;
    case 'resolveEventChoice':
      handleResolveEvent(data, state, action);
      break;
    case 'advance':
      handleAdvance(data, state);
      break;
  }
  return state;
}

/** A run is a fold. Convenience for tests, bots and replays. */
export function runActions(data: EngineData, initial: GameState, actions: Action[]): GameState {
  return actions.reduce((state, action) => step(data, state, action), initial);
}
