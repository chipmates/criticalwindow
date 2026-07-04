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
  helpReturn: Screen;
  run: GameState | null;
  runMeta: RunMeta | null;
  actionsLog: Action[];
  settings: Settings;
  lastError: string | null;
  /** Shock-overlay acknowledgment key (seed:turn); survives screen changes. */
  shockAck: string;

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
}

const data = loadGameData();

export function gameData() {
  return data;
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
  helpReturn: 'title',
  run: null,
  runMeta: null,
  actionsLog: [],
  settings: readSettings(),
  lastError: null,
  shockAck: '',

  goTo(screen) {
    const { settings } = get();
    if (screen === 'help') {
      set({ helpReturn: get().screen });
    }
    if (settings.musicOn) {
      setMusic(true);
    }
    set({ screen });
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
}));

/** Apply persisted settings at boot (and keep auto theme live). */
export function bootSettings(): void {
  applyDocumentSettings(readSettings() ?? DEFAULT_SETTINGS);
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => applyDocumentSettings(useStore.getState().settings));
}
