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
import { drawFromStream, nextIntInRange, weightedIndex } from './rng';
import type { EventCardData, EffectSetData, ParametersData, PolicyCardData } from './schemas';
import type { Action, ActionType, EffectTarget, EraId, GameState, LogEntry, Phase } from './types';
import { ALLOCATION_TOTAL, SCALE_MAX, SCALE_MIN } from './types';

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

function eventEligible(parameters: ParametersData, state: GameState, card: EventCardData): boolean {
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
  }
  return true;
}

function drawEvent(data: EngineData, state: GameState): void {
  const pool = data.events
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
    meta: { eventId: drawn.id },
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

function worldUpdate(data: EngineData, state: GameState): void {
  const rules = data.parameters.worldRules;
  const thresholds = data.parameters.thresholds;

  // 1. Rival acts by current posture.
  const posture = state.rival.posture;
  let rivalCapabilityGain: number;
  let rivalTrustDelta = 0;
  if (posture === 'race') {
    rivalCapabilityGain = rules.rivalMoves.race.capability.value;
    rivalTrustDelta = rules.rivalMoves.race.trust.value;
  } else if (posture === 'mirror') {
    rivalCapabilityGain = rules.rivalMoves.mirror.capability.value;
    if (state.turnScratch.capabilityGained >= 100) {
      rivalCapabilityGain += rules.rivalMoves.mirror.matchBonus.value;
    }
    if (state.turnScratch.playedDiplomacy) {
      rivalTrustDelta = rules.rivalMoves.mirror.diplomacyTrust.value;
    }
  } else {
    rivalCapabilityGain = rules.rivalMoves.cautious.capability.value;
    rivalTrustDelta = rules.rivalMoves.cautious.trust.value;
  }
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

  // 3. Society.
  const society = rules.society;
  let displacementGain = 0;
  if (state.resources.capability >= society.displacementCapabilityMin.value) {
    displacementGain += society.displacementPerTurn.value;
  }
  if (state.resources.capability >= society.displacementSurgeCapability.value) {
    displacementGain += society.displacementPerTurn.value;
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
  if (state.society.unrest >= society.trustErosionUnrestMin.value) {
    trustDelta -= society.trustErosionPerTurn.value;
  }
  state.resources.publicTrust = clamp(state.resources.publicTrust + trustDelta, 0, SCALE_MAX);
  pushLog(state, {
    kind: 'societyUpdate',
    stringKey: null,
    deltas: {
      'society.jobDisplacement': displacementGain - reliefApplied,
      'society.unrest': unrestGain,
      publicTrust: trustDelta,
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
  if (state.allocation.capability >= 70) {
    alignmentDrift -= 25;
  }
  state.hidden.trueAlignment = clamp(state.hidden.trueAlignment + alignmentDrift, 0, SCALE_MAX);

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
  const quarter = Math.max(1, divRound(band, 4));
  const [jitter, nextHidden] = nextIntInRange(state.rng.hiddenDice, -quarter, quarter);
  state.rng = { ...state.rng, hiddenDice: [...nextHidden] as [number, number, number, number] };
  const center = clamp(state.hidden.trueAlignment + jitter, 0, SCALE_MAX);
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
  if (state.rival.capability >= thresholds.capabilityThreshold.value) {
    endRun(state, 'outpaced', { trigger: 'rivalThreshold' });
    return;
  }
  if (state.resources.capability >= thresholds.capabilityThreshold.value) {
    resolveAlignment(state, { trigger: 'playerThreshold' });
    return;
  }
  if (
    state.flags.includes('treatyChannel') &&
    state.rival.trust >= thresholds.treatyTrustMin.value &&
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
  // Nearest tendency, v0 priority chain (B4 replaces with proximity scoring).
  if (state.rival.capability > state.resources.capability) {
    endRun(state, 'outpaced', { trigger: 'turnLimit', windowStillOpen: true });
  } else if (state.society.unrest >= 500) {
    endRun(state, 'societalBreakdown', { trigger: 'turnLimit', windowStillOpen: true });
  } else if (state.flags.includes('treatyChannel') && state.rival.trust >= 500) {
    endRun(state, 'negotiatedSlowdown', { trigger: 'turnLimit', windowStillOpen: true });
  } else {
    endRun(state, 'flourishing', { trigger: 'turnLimit', windowStillOpen: true });
  }
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
  const handSize = data.parameters.turnStructure.handSize.value;
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
      state.policy.hand = [...state.policy.hand, pool.shift()!].sort();
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
