/**
 * Core simulation types. The engine is a pure fold:
 *
 *   run = actions.reduce(step, init(scenario, seed))
 *
 * GameState is plain JSON data. No classes, no Date, no closures, no undefined
 * (absent-vs-undefined breaks canonical hashing; use null or omit the field
 * from the type entirely). All quantities are scaled integers so replay
 * comparisons are exact across JS engines.
 *
 * TWO SEATS, ONE WORLD. Each turn the USA seat acts, then the
 * China seat acts, then the world updates once. In solo mode the other seat's
 * actions come from a scripted policy at the DRIVER level and are recorded in
 * the save like any other actions, so solo and hotseat replay as the same
 * pure fold. Card data stays seat-agnostic: 'rival.*' effect targets resolve
 * relative to the acting seat; 'rival.trust' is the shared bilateral trust.
 */

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

/** All resource-like quantities live on a 0..1000 integer scale. */
export const SCALE_MAX = 1000;
export const SCALE_MIN = 0;

/** Allocation shares are percentages 0..100 summing to exactly 100. */
export const ALLOCATION_TOTAL = 100;

/** Bumped when the shape of GameState / SaveGame changes incompatibly. */
export const STATE_SCHEMA_VERSION = 4;

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

export const RESOURCE_KEYS = [
  'compute',
  'energy',
  'talent',
  'capital',
  'publicTrust',
  'politicalCapital',
  'capability',
  'safetyInsight',
] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export const SOCIETY_KEYS = ['jobDisplacement', 'unrest'] as const;
export type SocietyKey = (typeof SOCIETY_KEYS)[number];

/** Postures survive as the scripted china policy's stances, not engine state. */
export const RIVAL_POSTURES = ['race', 'mirror', 'cautious'] as const;
export type RivalPosture = (typeof RIVAL_POSTURES)[number];

export const SEAT_IDS = ['usa', 'china', 'eu'] as const;
export type SeatId = (typeof SEAT_IDS)[number];

/** The two seats that exist as playable state (EU is a force, ADR-002). */
export const PLAYABLE_SEAT_IDS = ['usa', 'china'] as const;
export type PlayableSeatId = (typeof PLAYABLE_SEAT_IDS)[number];

export function otherSeat(seat: PlayableSeatId): PlayableSeatId {
  return seat === 'usa' ? 'china' : 'usa';
}

export const GAME_MODES = ['solo', 'hotseat'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const WORLDVIEW_PRESET_IDS = ['cautious', 'consensus', 'skeptic'] as const;
export type WorldviewPresetId = (typeof WORLDVIEW_PRESET_IDS)[number];

export const ERA_IDS = ['early', 'mid', 'late'] as const;
export type EraId = (typeof ERA_IDS)[number];

/**
 * Prototype 1 ships the first five. 'gradualDisempowerment' is the hidden
 * sixth ending: its counters accumulate from the first engine build (agencyErosion),
 * but no code path emits this ending yet; it ships when it can be discovered.
 */
export const ENDING_IDS = [
  'flourishing',
  'misalignedCatastrophe',
  'outpaced',
  'negotiatedSlowdown',
  'societalBreakdown',
  'gradualDisempowerment',
] as const;
export type EndingId = (typeof ENDING_IDS)[number];

/**
 * Named rng streams. Per-seat streams keep the two seats' draws independent
 * (symmetric uncertainty: same pools, own dice); world streams are shared.
 */
export const RNG_STREAM_NAMES = [
  'eventsUsa',
  'eventsChina',
  'hiddenDice',
  'ticker',
  'wildcards',
  'incidentsUsa',
  'incidentsChina',
  'mandatesUsa',
  'mandatesChina',
] as const;
export type RngStreamName = (typeof RNG_STREAM_NAMES)[number];

/** Card scheduling classes (v0.2 event layer). */
export const EVENT_KINDS = ['choice', 'wildcard', 'fixed'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** What a wildcard's exposure-scaled damage reads from (per seat, at fire). */
export const EXPOSURE_KEYS = ['capability', 'compute', 'computeMinusEnergy'] as const;
export type ExposureKey = (typeof EXPOSURE_KEYS)[number];

/**
 * Flags that describe the SHARED world (diplomacy, proliferation, escalation)
 * rather than one seat's own programs. setFlag routes on this list; everything
 * not named here is seat-scoped (natsecMerged, weightsSecured, forcedPause...).
 */
export const WORLD_FLAGS = [
  'treatyChannel',
  'openWeightsWorld',
  'exportCrackdown',
  'escalation',
  'moratoriumPush',
  'verificationPilot',
  'evalsPublic',
  'deepfakePolitics',
  'windowStillOpen',
] as const;

// ---------------------------------------------------------------------------
// Effects (shared vocabulary of events, policies, subsystems)
// ---------------------------------------------------------------------------

/**
 * Everything a card effect may move, as flat target keys. SEAT-RELATIVE:
 * plain keys hit the acting seat; 'rival.capability' / 'rival.substitution'
 * hit the other seat; 'rival.trust' hits the shared bilateral trust.
 */
export const EFFECT_TARGETS = [
  ...RESOURCE_KEYS,
  'society.jobDisplacement',
  'society.unrest',
  'substitution',
  'rival.trust',
  'rival.capability',
  'rival.substitution',
  'hidden.trueAlignment',
  'hidden.agencyErosion',
] as const;
export type EffectTarget = (typeof EFFECT_TARGETS)[number];

/** Integer deltas per target, plus run flags to set or clear. */
export type EffectSet = Partial<Record<EffectTarget, number>> & {
  flags?: string[];
  clearFlags?: string[];
};

export interface DelayedEffect {
  /** Absolute turn on which the queued effects apply (during upkeep). */
  dueTurn: number;
  effects: EffectSet;
  /** Where this came from, for the turn log and debrief ("the bite"). */
  sourceKind: 'event' | 'policy';
  sourceId: string;
  choiceIndex: number | null;
}

// ---------------------------------------------------------------------------
// Turn phases and actions
// ---------------------------------------------------------------------------

/**
 * Strict phase order inside a turn: the USA seat walks allocate -> policy ->
 * event, then the China seat does, then ONE world update runs and the report
 * shows. `legalActions(state)` is derived from phase + actingSeat.
 */
export const PHASES = ['allocate', 'policy', 'event', 'report', 'ended'] as const;
export type Phase = (typeof PHASES)[number];

export type Action =
  | {
      type: 'allocate';
      capability: number;
      safety: number;
      diffusion: number;
      seat?: PlayableSeatId | undefined;
    }
  | { type: 'playPolicy'; policyId: string; seat?: PlayableSeatId | undefined }
  | { type: 'skipPolicy'; seat?: PlayableSeatId | undefined }
  | {
      type: 'resolveEventChoice';
      eventId: string;
      choiceIndex: number;
      seat?: PlayableSeatId | undefined;
    }
  | { type: 'advance'; seat?: PlayableSeatId | undefined };

export type ActionType = Action['type'];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface EvalReport {
  turn: number;
  /** Reported alignment band, 0..1000. True value is hidden and may sit outside. */
  bandLow: number;
  bandHigh: number;
}

/**
 * One xoshiro128** state per named stream (4 x uint32). Independent streams
 * keep subsystems decoupled: an added ticker draw must never shift an event
 * draw, or content patches would break replays within a dataVersion.
 */
export type RngState = Record<RngStreamName, [number, number, number, number]>;

/**
 * Structured, translatable log. `stringKey` references data/strings; the
 * engine never contains English. The debrief and turn report render from
 * this, so anything a player should later understand must be logged.
 * `seat` names whose ledger an entry belongs to; null = world-level.
 */
export interface LogEntry {
  turn: number;
  seat: PlayableSeatId | null;
  kind:
    | 'turnStart'
    | 'upkeep'
    | 'delayedEffect'
    | 'allocation'
    | 'policyPlayed'
    | 'eventDrawn'
    | 'eventResolved'
    | 'rivalAction'
    | 'rivalPostureChange'
    | 'societyUpdate'
    | 'election'
    | 'evalReport'
    | 'ticker'
    | 'incident'
    | 'wildcard'
    | 'mandate'
    | 'ending';
  stringKey: string | null;
  deltas: Partial<Record<EffectTarget, number>> | null;
  meta: Record<string, string | number | boolean> | null;
}

export interface PendingEvent {
  eventId: string;
  drawnOnTurn: number;
}

/** Everything one seat owns. Symmetric shape; asymmetry lives in data/seats.json. */
export interface SeatState {
  resources: Record<ResourceKey, number>;
  society: Record<SocietyKey, number>;

  /** Chip-substitution progress (Huawei/SMIC path). Rules-relevant for China. */
  substitution: number;

  /**
   * HIDDEN per-seat information: each seat builds its own systems, so true
   * alignment and agency erosion are per seat. Never rendered before debrief.
   */
  hidden: {
    trueAlignment: number;
    agencyErosion: number;
  };

  evalHistory: EvalReport[];

  /** Current R&D split, percentages summing to 100. Persists between turns. */
  allocation: { capability: number; safety: number; diffusion: number };

  policy: {
    hand: string[];
    spent: string[];
    cooldowns: Record<string, number>;
    playedThisTurn: string | null;
  };

  firedEvents: string[];
  pendingEvents: PendingEvent[];

  mandates: Array<{
    id: string;
    assignedTurn: number;
    deadlineTurn: number;
    status: 'active' | 'met' | 'lapsed';
  }>;

  incidentCooldowns: Record<string, number>;

  delayed: DelayedEffect[];

  /** Seat-scoped flags (sorted). World-scoped flags live in world.flags. */
  flags: string[];

  turnScratch: {
    capabilityGained: number;
    diffusionPts: number;
    playedDiplomacy: boolean;
  };
}

export interface GameState {
  schemaVersion: number;
  dataVersion: string;
  seed: string;
  presetId: WorldviewPresetId;
  scenarioId: string;

  mode: GameMode;
  /** Solo: the human's seat. Hotseat: player one's seat (display framing). */
  playerSeat: PlayableSeatId;

  /** 1-based; one turn is one quarter. */
  turn: number;
  phase: Phase;
  /** Whose action window is open (meaningless in report/ended phases). */
  actingSeat: PlayableSeatId;

  seats: Record<PlayableSeatId, SeatState>;

  /** ONE shared world: reality's dice, the relationship, global shocks. */
  world: {
    /** Rolled once per run from the preset range. 0..1000. Shared. */
    alignmentDifficulty: number;
    /** Rolled once per run from the preset range. 0..1000. Shared. */
    takeoffSteepness: number;
    /** The bilateral relationship, 0..1000. Gates treaty paths. */
    bilateralTrust: number;
    /** World-scoped flags (sorted). */
    flags: string[];
    wildcardCooldowns: Record<string, number>;
    wildcardGlobalUntil: number;
  };

  log: LogEntry[];
  rng: RngState;

  endingId: EndingId | null;
}

// ---------------------------------------------------------------------------
// Save format
// ---------------------------------------------------------------------------

export interface SaveGame {
  schemaVersion: number;
  dataVersion: string;
  seed: string;
  presetId: WorldviewPresetId;
  mode: GameMode;
  playerSeat: PlayableSeatId;
  scenarioId: string;
  /** BOTH seats' actions, in fold order (solo records the scripted seat too). */
  actions: Action[];
}
