/**
 * The UI's single store. The engine is the reducer; this is subscription
 * plumbing: dispatch folds step() onto the run, keeps the action log for
 * saves/probes, autosaves each step, and never mutates engine state.
 */
import { create } from 'zustand';
import { initGame } from '../engine/init';
import { buildSave, loadSave, SaveError } from '../engine/save';
import { step } from '../engine/step';
import type { Action, GameState, WorldviewPresetId } from '../engine/types';
import { setMusic } from './audio';
import { loadGameData } from './load-data';
import {
  DEFAULT_SETTINGS,
  readSettings,
  readSlot,
  writeSettings,
  writeSlot,
  type SaveSlot,
  type Settings,
} from './storage';

export type Screen = 'title' | 'setup' | 'game' | 'debrief';

interface RunMeta {
  seed: string;
  presetId: WorldviewPresetId;
}

interface UiStore {
  screen: Screen;
  run: GameState | null;
  runMeta: RunMeta | null;
  actionsLog: Action[];
  settings: Settings;
  lastError: string | null;

  goTo: (screen: Screen) => void;
  startRun: (seed: string, presetId: WorldviewPresetId) => void;
  dispatch: (action: Action) => void;
  saveTo: (slot: SaveSlot) => boolean;
  loadFrom: (slot: SaveSlot) => string | null;
  hasAutosave: () => boolean;
  updateSettings: (patch: Partial<Settings>) => void;
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
  run: null,
  runMeta: null,
  actionsLog: [],
  settings: readSettings(),
  lastError: null,

  goTo(screen) {
    const { settings } = get();
    if (settings.musicOn) {
      setMusic(true, screen === 'game' ? 'ambient' : 'reflective');
    }
    set({ screen });
  },

  startRun(seed, presetId) {
    const run = initGame(data, { seed, presetId });
    set({ run, runMeta: { seed, presetId }, actionsLog: [], screen: 'game', lastError: null });
  },

  dispatch(action) {
    const { run, runMeta, actionsLog } = get();
    if (!run || !runMeta) {
      return;
    }
    const next = step(data, run, action);
    const log = [...actionsLog, action];
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
      const save = raw as { seed: string; presetId: WorldviewPresetId };
      set({
        run: loaded.state,
        runMeta: { seed: save.seed, presetId: save.presetId },
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

  updateSettings(patch) {
    const settings = { ...get().settings, ...patch };
    writeSettings(settings);
    applyDocumentSettings(settings);
    if ('musicOn' in patch) {
      setMusic(settings.musicOn, get().screen === 'game' ? 'ambient' : 'reflective');
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
