/**
 * The scripted China seat for solo mode. A DRIVER, not part of the fold: it
 * reads the state like a player would and returns its seat's next action,
 * which the driver RECORDS in the save. Deterministic per (seed, state):
 * randomness comes from its own stream derived from the master seed.
 *
 * The v0.1 rival's posture logic survives here as a STANCE: the shared
 * bilateral trust and the capability gap (sourced posture-check thresholds)
 * pick race / mirror / cautious, and the stance picks allocations, policy
 * preferences and memo choices. Balance grids tune the numbers.
 */
import type { EngineData } from './data';
import { hashString } from './hash';
import { FORCED_PAUSE_CAPABILITY_MAX, playablePolicies } from './step';
import type { Action, GameState, RivalPosture } from './types';

function stance(data: EngineData, state: GameState): RivalPosture {
  const checks = data.parameters.worldRules.postureChecks;
  if (
    state.world.flags.includes('treatyChannel') &&
    state.world.bilateralTrust >= checks.cautiousTrustMin.value
  ) {
    return 'cautious';
  }
  const gap = state.seats.usa.resources.capability - state.seats.china.resources.capability;
  if (gap >= checks.raceGapMin.value) {
    return 'race';
  }
  if (state.world.bilateralTrust <= checks.raceTrustMax.value) {
    return 'race';
  }
  return 'mirror';
}

const POLICY_PREFS: Record<RivalPosture, string[]> = {
  race: ['natsec_merge', 'chip_subsidies', 'energy_buildout', 'weights_security_program'],
  mirror: ['energy_buildout', 'chip_subsidies', 'compute_treaty_feeler', 'eval_mandate'],
  cautious: ['compute_treaty_feeler', 'interpretability_moonshot', 'eval_mandate'],
};

const CHOICE_WEIGHTS: Record<RivalPosture, Record<string, number>> = {
  race: { capability: 3, compute: 1, 'rival.capability': -1 },
  mirror: { capability: 2, publicTrust: 1, 'rival.trust': 1, 'society.unrest': -1 },
  cautious: { 'rival.trust': 3, safetyInsight: 2, publicTrust: 1, 'society.unrest': -1 },
};

function bestChoice(
  card: {
    choices: Array<{
      effects?: Record<string, unknown> | undefined;
      delayedEffects?: Array<{ effects: Record<string, unknown> }> | undefined;
    }>;
  },
  weights: Record<string, number>,
): number {
  let best = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  card.choices.forEach((choice, index) => {
    let score = 0;
    const tally = (effects: Record<string, unknown> | undefined): void => {
      for (const [key, value] of Object.entries(effects ?? {})) {
        if (typeof value === 'number' && weights[key] !== undefined) {
          score += value * weights[key];
        }
      }
    };
    tally(choice.effects);
    for (const delayed of choice.delayedEffects ?? []) {
      tally(delayed.effects);
    }
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

/**
 * One decision for whichever scripted seat is acting. STATELESS: any driver
 * (store, bots, replays) gets the identical decision with nothing to persist.
 */
export function scriptedSeatDecide(data: EngineData, state: GameState): Action {
  return state.actingSeat === 'china' ? chinaDecide(data, state) : usaDecide(data, state);
}

/**
 * The scripted USA seat (solo-as-China mode): the same stance logic seen
 * from the other side of the Pacific. Races when China leads by the gap
 * threshold or trust is rock bottom; treaty-grade trust calms it.
 */
export function usaDecide(data: EngineData, state: GameState): Action {
  const seatState = state.seats.usa;
  const checks = data.parameters.worldRules.postureChecks;
  let current: RivalPosture = 'mirror';
  if (
    state.world.flags.includes('treatyChannel') &&
    state.world.bilateralTrust >= checks.cautiousTrustMin.value
  ) {
    current = 'cautious';
  } else if (
    state.seats.china.resources.capability - seatState.resources.capability >=
      checks.raceGapMin.value ||
    state.world.bilateralTrust <= checks.raceTrustMax.value
  ) {
    current = 'race';
  }
  switch (state.phase) {
    case 'allocate': {
      if (seatState.flags.includes('forcedPause')) {
        return {
          type: 'allocate',
          capability: FORCED_PAUSE_CAPABILITY_MAX,
          safety: 40,
          diffusion: 30,
          seat: 'usa',
        };
      }
      const nearFog =
        seatState.resources.capability >= data.parameters.thresholds.fogZoneStart.value - 200;
      const homeworkDone = seatState.resources.safetyInsight >= 300;
      if (nearFog && current !== 'race' && homeworkDone) {
        // Confident push: alignment banked, sprint the window.
        return { type: 'allocate', capability: 60, safety: 25, diffusion: 15, seat: 'usa' };
      }
      if (nearFog && current !== 'race') {
        return { type: 'allocate', capability: 45, safety: 40, diffusion: 15, seat: 'usa' };
      }
      if (current === 'race') {
        return { type: 'allocate', capability: 80, safety: 10, diffusion: 10, seat: 'usa' };
      }
      if (current === 'cautious') {
        return { type: 'allocate', capability: 45, safety: 25, diffusion: 30, seat: 'usa' };
      }
      const wobble = hashString(`${state.seed}::usa-alloc::${state.turn}`) % 3;
      const capability = 45 + wobble * 10;
      return {
        type: 'allocate',
        capability,
        safety: 20,
        diffusion: 100 - capability - 20,
        seat: 'usa',
      };
    }
    case 'policy': {
      const prefs: Record<RivalPosture, string[]> = {
        race: ['export_controls', 'chip_subsidies', 'natsec_merge', 'energy_buildout'],
        mirror: [
          'energy_buildout',
          'interpretability_moonshot',
          'chip_subsidies',
          'compute_treaty_feeler',
        ],
        cautious: ['compute_treaty_feeler', 'interpretability_moonshot', 'eval_mandate'],
      };
      const playable = playablePolicies(data, state, 'usa')
        .filter((p) => p.playable)
        .map((p) => p.id);
      for (const id of prefs[current]) {
        if (playable.includes(id)) {
          return { type: 'playPolicy', policyId: id, seat: 'usa' };
        }
      }
      return { type: 'skipPolicy', seat: 'usa' };
    }
    case 'event': {
      const pending = seatState.pendingEvents[0]!;
      const card = data.events.find((e) => e.id === pending.eventId)!;
      if (card.kind === 'wildcard') {
        throw new Error(`wildcard '${card.id}' cannot be a pending memo`);
      }
      const choiceIndex = bestChoice(card, CHOICE_WEIGHTS[current]);
      return { type: 'resolveEventChoice', eventId: pending.eventId, choiceIndex, seat: 'usa' };
    }
    default:
      return { type: 'advance', seat: 'usa' };
  }
}

/**
 * One decision for the China seat. Call only while state.actingSeat is
 * 'china'. STATELESS: the mirror-stance wobble hashes (seed, turn), so any
 * driver (store, bots, replays) gets the identical decision with no stream
 * to persist.
 */
export function chinaDecide(data: EngineData, state: GameState): Action {
  const seatState = state.seats.china;
  const current = stance(data, state);
  switch (state.phase) {
    case 'allocate': {
      if (seatState.flags.includes('forcedPause')) {
        return {
          type: 'allocate',
          capability: FORCED_PAUSE_CAPABILITY_MAX,
          safety: 40,
          diffusion: 30,
          seat: 'china',
        };
      }
      // Self-preservation near the fog: no state knowingly sprints across
      // the threshold with garbage alignment UNLESS the race is fully on
      // (rock-bottom trust or a big gap keeps the trap reachable).
      const nearFog =
        seatState.resources.capability >= data.parameters.thresholds.fogZoneStart.value - 200;
      const homeworkDone = seatState.resources.safetyInsight >= 300;
      if (nearFog && current !== 'race' && homeworkDone) {
        // Confident push: alignment banked, sprint the window.
        return { type: 'allocate', capability: 60, safety: 25, diffusion: 15, seat: 'china' };
      }
      if (nearFog && current !== 'race') {
        return { type: 'allocate', capability: 45, safety: 40, diffusion: 15, seat: 'china' };
      }
      if (current === 'race') {
        return { type: 'allocate', capability: 80, safety: 10, diffusion: 10, seat: 'china' };
      }
      if (current === 'cautious') {
        return { type: 'allocate', capability: 45, safety: 25, diffusion: 30, seat: 'china' };
      }
      // Mirror: their progress is foggy too. A seeded wobble on the
      // capability share replaces the old rival progressVariance.
      const wobble = hashString(`${state.seed}::china-alloc::${state.turn}`) % 3;
      const capability = 45 + wobble * 10; // 45 | 55 | 65
      return {
        type: 'allocate',
        capability,
        safety: 20,
        diffusion: 100 - capability - 20,
        seat: 'china',
      };
    }
    case 'policy': {
      const playable = playablePolicies(data, state, 'china')
        .filter((p) => p.playable)
        .map((p) => p.id);
      for (const id of POLICY_PREFS[current]) {
        if (playable.includes(id)) {
          return { type: 'playPolicy', policyId: id, seat: 'china' };
        }
      }
      return { type: 'skipPolicy', seat: 'china' };
    }
    case 'event': {
      const pending = seatState.pendingEvents[0]!;
      const card = data.events.find((e) => e.id === pending.eventId)!;
      if (card.kind === 'wildcard') {
        throw new Error(`wildcard '${card.id}' cannot be a pending memo`);
      }
      const choiceIndex = bestChoice(card, CHOICE_WEIGHTS[current]);
      return { type: 'resolveEventChoice', eventId: pending.eventId, choiceIndex, seat: 'china' };
    }
    default:
      return { type: 'advance', seat: 'china' };
  }
}
