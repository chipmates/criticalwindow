/**
 * Run initialization: scenario + preset + seed -> turn-1 GameState.
 * The hidden dice roll here, once, from the chosen preset's sourced ranges:
 * alignment DIFFICULTY and takeoff STEEPNESS are properties of reality,
 * shared by both seats. Each seat's true alignment then walks its own path.
 */
import type { EngineData } from './data';
import { initRngState, nextIntInRange } from './rng';
import { assignEraMandates } from './step';
import type { GameMode, GameState, PlayableSeatId, SeatState, WorldviewPresetId } from './types';
import { PLAYABLE_SEAT_IDS, STATE_SCHEMA_VERSION } from './types';

export interface InitOptions {
  seed: string;
  presetId: WorldviewPresetId;
  mode?: GameMode;
  playerSeat?: PlayableSeatId;
}

function buildSeat(data: EngineData, seat: PlayableSeatId, difficulty: number): SeatState {
  const start = data.scenario.seats[seat];
  return {
    resources: {
      compute: start.resources.compute.value,
      energy: start.resources.energy.value,
      talent: start.resources.talent.value,
      capital: start.resources.capital.value,
      publicTrust: start.resources.publicTrust.value,
      politicalCapital: start.resources.politicalCapital.value,
      capability: start.resources.capability.value,
      safetyInsight: start.resources.safetyInsight.value,
    },
    society: {
      jobDisplacement: start.society.jobDisplacement.value,
      unrest: start.society.unrest.value,
    },
    substitution: start.substitution.value,
    hidden: {
      // Alignment is an achievement, not a default: a low start that only
      // safety work raises. Harder worlds start lower still, for BOTH seats.
      trueAlignment: Math.max(
        0,
        data.parameters.alignmentModel.startBase.value - Math.trunc(difficulty / 2),
      ),
      agencyErosion: 0,
    },
    evalHistory: [],
    allocation: {
      capability: start.allocation.capability,
      safety: start.allocation.safety,
      diffusion: start.allocation.diffusion,
    },
    policy: {
      hand: [...(start.hand ?? [])].sort(),
      spent: [],
      cooldowns: {},
      playedThisTurn: null,
    },
    firedEvents: [],
    pendingEvents: [],
    mandates: [],
    incidentCooldowns: {},
    delayed: [],
    flags: [],
    turnScratch: { capabilityGained: 0, diffusionPts: 0, playedDiplomacy: false },
  };
}

export function initGame(data: EngineData, options: InitOptions): GameState {
  const rng = initRngState(options.seed);
  const preset = data.parameters.worldviewPresets[options.presetId];
  const mode = options.mode ?? 'solo';
  const playerSeat = options.playerSeat ?? 'usa';

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

  const state: GameState = {
    schemaVersion: STATE_SCHEMA_VERSION,
    dataVersion: data.dataVersion,
    seed: options.seed,
    presetId: options.presetId,
    scenarioId: data.scenario.id,
    mode,
    playerSeat,
    turn: 1,
    phase: 'allocate',
    actingSeat: 'usa',
    seats: {
      usa: buildSeat(data, 'usa', difficulty),
      china: buildSeat(data, 'china', difficulty),
    },
    world: {
      alignmentDifficulty: difficulty,
      takeoffSteepness: steepness,
      bilateralTrust: data.scenario.world.bilateralTrust.value,
      flags: [],
      wildcardCooldowns: {},
      wildcardGlobalUntil: 0,
    },
    log: [
      {
        turn: 1,
        seat: null,
        kind: 'turnStart',
        stringKey: null,
        deltas: null,
        meta: { mode, playerSeat, preset: options.presetId },
      },
    ],
    rng,
    endingId: null,
  };
  // Turn 1 is the first era's first turn but has no upkeep: the opening
  // mandates are assigned here, from the same streams the later eras use.
  const firstEra = data.parameters.turnStructure.eras[0]!.id;
  for (const seat of PLAYABLE_SEAT_IDS) {
    assignEraMandates(data, state, seat, firstEra);
  }
  return state;
}
