/**
 * Core simulation types. The engine is a pure fold:
 *
 *   run = actions.reduce(step, init(scenario, seed))
 *
 * GameState is plain JSON data. No classes, no Date, no closures, no undefined
 * (absent-vs-undefined breaks canonical hashing; use null or omit the field
 * from the type entirely). All quantities are scaled integers so replay
 * comparisons are exact across JS engines.
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
export const STATE_SCHEMA_VERSION = 2;

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

export const RIVAL_POSTURES = ['race', 'mirror', 'cautious'] as const;
export type RivalPosture = (typeof RIVAL_POSTURES)[number];

export const SEAT_IDS = ['usa', 'china', 'eu'] as const;
export type SeatId = (typeof SEAT_IDS)[number];

export const WORLDVIEW_PRESET_IDS = ['cautious', 'consensus', 'skeptic'] as const;
export type WorldviewPresetId = (typeof WORLDVIEW_PRESET_IDS)[number];

export const ERA_IDS = ['early', 'mid', 'late'] as const;
export type EraId = (typeof ERA_IDS)[number];

/**
 * Prototype 1 ships the first five. 'gradualDisempowerment' is the hidden
 * sixth ending: its counters accumulate from Milestone B (agencyErosion),
 * but no ending fires until Alpha.
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

export const RNG_STREAM_NAMES = [
  'events',
  'hiddenDice',
  'rival',
  'ticker',
  'wildcards',
  'incidents',
] as const;
export type RngStreamName = (typeof RNG_STREAM_NAMES)[number];

/** Card scheduling classes (v0.2 event layer). */
export const EVENT_KINDS = ['choice', 'wildcard', 'fixed'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** What a wildcard's exposure-scaled damage reads from. */
export const EXPOSURE_KEYS = ['capability', 'compute', 'computeMinusEnergy'] as const;
export type ExposureKey = (typeof EXPOSURE_KEYS)[number];

// ---------------------------------------------------------------------------
// Effects (shared vocabulary of events, policies, subsystems)
// ---------------------------------------------------------------------------

/** Everything a card effect may move, as flat target keys. */
export const EFFECT_TARGETS = [
  ...RESOURCE_KEYS,
  'society.jobDisplacement',
  'society.unrest',
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
 * Strict phase order inside a turn, mirroring the core loop:
 * briefing (log) -> allocate -> policy -> event(s) -> report -> next turn.
 * `legalActions(state)` is derived from this; the UI never guesses.
 */
export const PHASES = ['allocate', 'policy', 'event', 'report', 'ended'] as const;
export type Phase = (typeof PHASES)[number];

export type Action =
  | { type: 'allocate'; capability: number; safety: number; diffusion: number }
  | { type: 'playPolicy'; policyId: string }
  | { type: 'skipPolicy' }
  | { type: 'resolveEventChoice'; eventId: string; choiceIndex: number }
  | { type: 'advance' };

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
 * keep subsystems decoupled: an added ticker draw must never shift event
 * draws, or content patches would break replays within a dataVersion.
 */
export type RngState = Record<RngStreamName, [number, number, number, number]>;

/**
 * Structured, translatable log. `stringKey` references data/strings; the
 * engine never contains English. The debrief and turn report render from
 * this, so anything a player should later understand must be logged.
 */
export interface LogEntry {
  turn: number;
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
    | 'ending';
  stringKey: string | null;
  deltas: Partial<Record<EffectTarget, number>> | null;
  meta: Record<string, string | number | boolean> | null;
}

export interface PendingEvent {
  eventId: string;
  drawnOnTurn: number;
}

export interface GameState {
  schemaVersion: number;
  dataVersion: string;
  seed: string;
  presetId: WorldviewPresetId;
  seatId: SeatId;
  scenarioId: string;

  /** 1-based; one turn is one quarter. */
  turn: number;
  phase: Phase;

  resources: Record<ResourceKey, number>;
  society: Record<SocietyKey, number>;

  rival: {
    posture: RivalPosture;
    capability: number;
    /** Rival trust toward the player, 0..1000. Gates treaty paths. */
    trust: number;
    /** Chip-substitution progress (Huawei/SMIC path), 0..1000. */
    substitution: number;
  };

  /**
   * HIDDEN INFORMATION. The UI must never render anything below.
   * Exposed only through eval reports (banded) and the post-run debrief.
   */
  hidden: {
    /** Rolled once per run from the preset range. 0..1000. */
    alignmentDifficulty: number;
    /** Rolled once per run from the preset range. 0..1000. */
    takeoffSteepness: number;
    /** Evolving true alignment level, 0..1000. Eval reports band around it. */
    trueAlignment: number;
    /** Hidden-ending hook (Gradual Disempowerment). Accumulates; no P1 ending. */
    agencyErosion: number;
  };

  evalHistory: EvalReport[];

  /** Current R&D split, percentages summing to 100. Persists between turns. */
  allocation: { capability: number; safety: number; diffusion: number };

  policy: {
    hand: string[];
    /** Ids no longer available (played, oncePerRun). */
    spent: string[];
    /** Policy id -> turn it becomes playable again. */
    cooldowns: Record<string, number>;
    playedThisTurn: string | null;
  };

  /** Events already fired this run (non-repeatable ones never redraw). */
  firedEvents: string[];
  pendingEvents: PendingEvent[];

  /** Incident rung id -> turn it may fire again (misalignment-incident system). */
  incidentCooldowns: Record<string, number>;
  /** Wildcard card id -> turn it may fire again. */
  wildcardCooldowns: Record<string, number>;
  /** No wildcard fires before this turn (global spacing between shocks). */
  wildcardGlobalUntil: number;

  delayed: DelayedEffect[];

  /** Sorted string set. */
  flags: string[];

  /**
   * Per-turn scratch, reset each upkeep. Lets world-update rules react to
   * what happened THIS turn (tit-for-tat, diffusion conversion) without
   * re-deriving it from the log.
   */
  turnScratch: {
    capabilityGained: number;
    diffusionPts: number;
    playedDiplomacy: boolean;
  };

  log: LogEntry[];
  rng: RngState;

  endingId: EndingId | null;
}

// ---------------------------------------------------------------------------
// Save format (implemented in Block B5; typed here as part of the contract)
// ---------------------------------------------------------------------------

export interface SaveGame {
  schemaVersion: number;
  dataVersion: string;
  seed: string;
  presetId: WorldviewPresetId;
  seatId: SeatId;
  scenarioId: string;
  actions: Action[];
}
