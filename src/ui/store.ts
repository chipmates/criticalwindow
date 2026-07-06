/**
 * The UI's single store. The engine is the reducer; this is subscription
 * plumbing: dispatch folds step() onto the run, keeps the action log for
 * saves/probes, autosaves each step, and never mutates engine state.
 */
import { create } from 'zustand';
import { scriptedSeatDecide } from '../engine/china-policy';
import { initGame } from '../engine/init';
import { buildSave, loadSave, SaveError } from '../engine/save';
import { step } from '../engine/step';
import type {
  Action,
  GameMode,
  GameState,
  PlayableSeatId,
  WorldviewPresetId,
} from '../engine/types';
import { setMusic } from './audio';
import { loadGameData } from './load-data';
import {
  DEFAULT_SETTINGS,
  readPrologueSeen,
  readSettings,
  readSlot,
  writePrologueSeen,
  writeSettings,
  writeSlot,
  type SaveSlot,
  type Settings,
} from './storage';

export type Screen = 'title' | 'setup' | 'prologue' | 'game' | 'debrief' | 'help' | 'sources';

interface RunMeta {
  seed: string;
  presetId: WorldviewPresetId;
  mode: GameMode;
  playerSeat: PlayableSeatId;
}

interface UiStore {
  screen: Screen;
  /** Where overlay screens (help, sources) return to; a stack so chains reverse cleanly. */
  navStack: Screen[];
  goBack: () => void;
  /** Setup choices survive a detour to sources/help; cleared when a run starts. */
  setupDraft: {
    presetId: WorldviewPresetId;
    seed: string;
    mode: GameMode;
    playerSeat: PlayableSeatId;
  } | null;
  setSetupDraft: (draft: UiStore['setupDraft']) => void;
  run: GameState | null;
  runMeta: RunMeta | null;
  actionsLog: Action[];
  settings: Settings;
  lastError: string | null;
  /** Shock-overlay acknowledgment key (seed:turn); survives screen changes. */
  shockAck: string;
  /** Prefill for the sources search when a chip jumps there; null when unset. */
  sourcesQuery: string | null;
  /** Seed of an autosave refused at boot for a data-version mismatch. */
  staleSaveSeed: string | null;

  goTo: (screen: Screen) => void;
  startRun: (
    seed: string,
    presetId: WorldviewPresetId,
    mode?: GameMode,
    playerSeat?: PlayableSeatId,
  ) => void;
  dispatch: (action: Action) => void;
  saveTo: (slot: SaveSlot) => boolean;
  loadFrom: (slot: SaveSlot) => string | null;
  hasAutosave: () => boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  ackShocks: (key: string) => void;
  markPrologueSeen: () => void;
  clearError: () => void;
  setSourcesQuery: (query: string | null) => void;
}

const data = loadGameData();

export function gameData() {
  return data;
}

/**
 * A data update rewrites the content hash, so an autosave from the old build
 * can no longer resume (replaying it would diverge). We do not delete it
 * silently: read its seed at boot so the title can explain what happened and
 * offer the seed for a fresh run.
 */
function readStaleSaveSeed(): string | null {
  const raw = readSlot('auto') as { dataVersion?: unknown; seed?: unknown } | null;
  if (
    raw &&
    typeof raw === 'object' &&
    typeof raw.dataVersion === 'string' &&
    raw.dataVersion !== data.dataVersion
  ) {
    return typeof raw.seed === 'string' ? raw.seed : null;
  }
  return null;
}

function applyDocumentSettings(settings: Settings): void {
  const root = document.documentElement;
  if (settings.theme === 'auto') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'dark' : 'light';
  } else {
    root.dataset.theme = settings.theme;
  }
  root.dataset.motion = settings.reducedMotion === 'on' ? 'reduced' : 'auto';
  root.dataset.textsize = settings.textSize;
}

export const useStore = create<UiStore>((set, get) => ({
  screen: 'title',
  navStack: [],
  setupDraft: null,
  setSetupDraft(draft) {
    set({ setupDraft: draft });
  },
  run: null,
  runMeta: null,
  actionsLog: [],
  settings: readSettings(),
  lastError: null,
  shockAck: '',
  sourcesQuery: null,
  staleSaveSeed: readStaleSaveSeed(),

  goTo(screen) {
    const { settings } = get();
    const current = get().screen;
    if ((screen === 'help' || screen === 'sources') && screen !== current) {
      set({ navStack: [...get().navStack, current] });
    } else if (screen !== 'help' && screen !== 'sources') {
      // Arriving anywhere else by a normal route invalidates old detour history.
      set({ navStack: [] });
    }
    if (settings.musicOn) {
      setMusic(true);
    }
    set({ screen });
  },

  goBack() {
    const stack = get().navStack;
    const target = stack[stack.length - 1] ?? 'title';
    if (get().settings.musicOn) {
      setMusic(true);
    }
    set({ navStack: stack.slice(0, -1), screen: target });
  },

  startRun(seed, presetId, mode = 'solo', playerSeat = 'usa') {
    const run = initGame(data, { seed, presetId, mode, playerSeat });
    set({
      run,
      runMeta: { seed, presetId, mode, playerSeat },
      actionsLog: [],
      // First run ever: the prologue plays first (skippable). It is the
      // tutorial AND the backstory; after one viewing it stays optional.
      screen: readPrologueSeen() ? 'game' : 'prologue',
      lastError: null,
      shockAck: '',
    });
  },

  dispatch(action) {
    const { run, runMeta, actionsLog } = get();
    if (!run || !runMeta) {
      return;
    }
    // Stamp the player's action with the acting seat: a free engine-level
    // assertion that the UI and the turn machine agree on whose window it is.
    const stamped = action.type === 'advance' ? action : { ...action, seat: run.actingSeat };
    let next = step(data, run, stamped);
    const log = [...actionsLog, stamped];
    // Solo mode: the scripted seat plays its whole window immediately, and
    // every scripted action is RECORDED, so the save replays as one fold.
    if (next.mode === 'solo') {
      let guard = 0;
      while (
        next.phase !== 'ended' &&
        next.phase !== 'report' &&
        next.actingSeat !== next.playerSeat &&
        guard < 20
      ) {
        const scripted = scriptedSeatDecide(data, next);
        next = step(data, next, scripted);
        log.push(scripted);
        guard += 1;
      }
      // The cap should never bind: a hung scripted seat would freeze the run
      // with the human's window never reopening. Log enough to debug the stall.
      if (
        guard >= 20 &&
        next.phase !== 'ended' &&
        next.phase !== 'report' &&
        next.actingSeat !== next.playerSeat
      ) {
        console.error(
          `[criticalwindow] scripted-seat auto-advance did not return the window: ` +
            `phase=${next.phase} actingSeat=${next.actingSeat} playerSeat=${next.playerSeat} turn=${next.turn}`,
        );
      }
    }
    set({ run: next, actionsLog: log });
    writeSlot('auto', buildSave(data, runMeta, log));
  },

  saveTo(slot) {
    const { runMeta, actionsLog } = get();
    if (!runMeta) {
      return false;
    }
    return writeSlot(slot, buildSave(data, runMeta, actionsLog));
  },

  loadFrom(slot) {
    const raw = readSlot(slot);
    if (raw === null) {
      return 'empty';
    }
    try {
      const loaded = loadSave(data, raw);
      const save = raw as {
        seed: string;
        presetId: WorldviewPresetId;
        mode: GameMode;
        playerSeat: PlayableSeatId;
      };
      set({
        run: loaded.state,
        runMeta: {
          seed: save.seed,
          presetId: save.presetId,
          mode: save.mode,
          playerSeat: save.playerSeat,
        },
        actionsLog: loaded.actions,
        screen: loaded.state.phase === 'ended' ? 'debrief' : 'game',
        lastError: null,
      });
      return null;
    } catch (error) {
      if (error instanceof SaveError) {
        return error.code;
      }
      return 'malformed';
    }
  },

  hasAutosave() {
    return readSlot('auto') !== null;
  },

  ackShocks(key) {
    set({ shockAck: key });
  },

  markPrologueSeen() {
    writePrologueSeen();
  },

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    writeSettings(settings);
    applyDocumentSettings(settings);
    if ('musicOn' in patch) {
      setMusic(settings.musicOn);
    }
    set({ settings });
  },

  clearError() {
    set({ lastError: null });
  },

  setSourcesQuery(query) {
    set({ sourcesQuery: query });
  },
}));

/** Apply persisted settings at boot (and keep auto theme live). */
export function bootSettings(): void {
  applyDocumentSettings(readSettings() ?? DEFAULT_SETTINGS);
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => applyDocumentSettings(useStore.getState().settings));
}
