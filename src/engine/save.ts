/**
 * Saves, replays and share codes. A run IS its save: {seed, preset, actions}.
 * Loading replays the fold; undo replays minus the last action. ~1KB of JSON
 * carries a complete game. Honesty rule: a save from different content
 * (dataVersion mismatch) is refused with a typed error, never silently
 * replayed into divergence.
 */
import type { EngineData } from './data';
import { initGame } from './init';
import { saveGameSchema, type SaveGameData } from './schemas';
import { runActions } from './step';
import type { Action, GameState, WorldviewPresetId } from './types';
import { STATE_SCHEMA_VERSION } from './types';

export class SaveError extends Error {
  readonly code: 'malformed' | 'dataVersionMismatch' | 'schemaVersionMismatch' | 'replayFailed';
  constructor(code: SaveError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export function buildSave(
  data: EngineData,
  options: { seed: string; presetId: WorldviewPresetId },
  actions: Action[],
): SaveGameData {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    dataVersion: data.dataVersion,
    seed: options.seed,
    presetId: options.presetId,
    seatId: data.scenario.seat,
    scenarioId: data.scenario.id,
    actions,
  };
}

export interface LoadedRun {
  state: GameState;
  actions: Action[];
}

/** Parse + replay a save against the current content. */
export function loadSave(data: EngineData, raw: unknown): LoadedRun {
  const parsed = saveGameSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SaveError('malformed', 'save file does not match the save format');
  }
  const save = parsed.data;
  if (save.schemaVersion !== STATE_SCHEMA_VERSION) {
    throw new SaveError(
      'schemaVersionMismatch',
      `save is engine version ${save.schemaVersion}, this build is ${STATE_SCHEMA_VERSION}`,
    );
  }
  if (save.dataVersion !== data.dataVersion) {
    throw new SaveError(
      'dataVersionMismatch',
      'save was recorded against different game content; replaying it here would diverge',
    );
  }
  try {
    const initial = initGame(data, { seed: save.seed, presetId: save.presetId });
    const state = runActions(data, initial, save.actions as Action[]);
    return { state, actions: save.actions as Action[] };
  } catch (error) {
    throw new SaveError('replayFailed', `replay failed: ${String(error)}`);
  }
}

/** Undo = the same run minus its last action. */
export function undoOnce(data: EngineData, save: SaveGameData): LoadedRun {
  return loadSave(data, { ...save, actions: save.actions.slice(0, -1) });
}

// ---------------------------------------------------------------------------
// Share codes: #s=<seed>&p=<preset>&v=<dataVersion>
// Seed challenges only (same hidden world, your own choices); full action
// replays travel as save files, not URLs.
// ---------------------------------------------------------------------------

export interface ShareCode {
  seed: string;
  presetId: WorldviewPresetId;
  dataVersion: string;
}

export function encodeShare(share: ShareCode): string {
  return `#s=${encodeURIComponent(share.seed)}&p=${encodeURIComponent(share.presetId)}&v=${encodeURIComponent(share.dataVersion)}`;
}

const PRESETS = new Set(['cautious', 'consensus', 'skeptic']);

export function parseShare(hash: string): ShareCode | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new Map<string, string>();
  for (const pair of raw.split('&')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      params.set(pair.slice(0, eq), decodeURIComponent(pair.slice(eq + 1)));
    }
  }
  const seed = params.get('s');
  const presetId = params.get('p');
  const dataVersion = params.get('v');
  if (!seed || !presetId || !dataVersion || !PRESETS.has(presetId)) {
    return null;
  }
  if (seed.length > 64) {
    return null;
  }
  return { seed, presetId: presetId as WorldviewPresetId, dataVersion };
}
