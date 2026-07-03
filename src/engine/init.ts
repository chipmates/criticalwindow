/**
 * Run initialization: scenario + preset + seed -> turn-1 GameState.
 * The hidden dice roll here, once, from the chosen preset's sourced ranges,
 * and are never exposed until the debrief.
 */
import type { EngineData } from './data';
import { initRngState, nextIntInRange } from './rng';
import type { GameState, WorldviewPresetId } from './types';
import { STATE_SCHEMA_VERSION } from './types';

export interface InitOptions {
  seed: string;
  presetId: WorldviewPresetId;
}

export function initGame(data: EngineData, options: InitOptions): GameState {
  const rng = initRngState(options.seed);
  const preset = data.parameters.worldviewPresets[options.presetId];

  // Hidden dice: one roll each from the preset ranges, hiddenDice stream.
  const [difficulty, afterFirst] = nextIntInRange(
    rng.hiddenDice,
    preset.alignmentDifficulty.min,
    preset.alignmentDifficulty.max,
  );
  const [steepness, afterSecond] = nextIntInRange(
    afterFirst,
    preset.takeoffSteepness.min,
    preset.takeoffSteepness.max,
  );
  rng.hiddenDice = [...afterSecond] as [number, number, number, number];

  const scenario = data.scenario;
  const resources = {
    compute: scenario.startResources.compute.value,
    energy: scenario.startResources.energy.value,
    talent: scenario.startResources.talent.value,
    capital: scenario.startResources.capital.value,
    publicTrust: scenario.startResources.publicTrust.value,
    politicalCapital: scenario.startResources.politicalCapital.value,
    capability: scenario.startResources.capability.value,
    safetyInsight: scenario.startResources.safetyInsight.value,
  };

  const state: GameState = {
    schemaVersion: STATE_SCHEMA_VERSION,
    dataVersion: data.dataVersion,
    seed: options.seed,
    presetId: options.presetId,
    seatId: scenario.seat,
    scenarioId: scenario.id,
    turn: 1,
    phase: 'allocate',
    resources,
    society: {
      jobDisplacement: scenario.startSociety.jobDisplacement.value,
      unrest: scenario.startSociety.unrest.value,
    },
    rival: {
      posture: scenario.startRival.posture,
      capability: scenario.startRival.capability.value,
      trust: scenario.startRival.trust.value,
      substitution: scenario.startRival.substitution.value,
    },
    hidden: {
      alignmentDifficulty: difficulty,
      takeoffSteepness: steepness,
      // Alignment is an achievement, not a default: a low start that only
      // safety work raises. Harder worlds start lower still.
      trueAlignment: Math.max(
        0,
        data.parameters.alignmentModel.startBase.value - Math.trunc(difficulty / 2),
      ),
      agencyErosion: 0,
    },
    evalHistory: [],
    allocation: {
      capability: scenario.startAllocation.capability,
      safety: scenario.startAllocation.safety,
      diffusion: scenario.startAllocation.diffusion,
    },
    policy: {
      hand: [...(scenario.startingHand ?? [])].sort(),
      spent: [],
      cooldowns: {},
      playedThisTurn: null,
    },
    firedEvents: [],
    pendingEvents: [],
    delayed: [],
    flags: [],
    turnScratch: { capabilityGained: 0, diffusionPts: 0, playedDiplomacy: false },
    log: [
      {
        turn: 1,
        kind: 'turnStart',
        stringKey: null,
        deltas: null,
        meta: { seat: scenario.seat, preset: options.presetId },
      },
    ],
    rng,
    endingId: null,
  };
  return state;
}
