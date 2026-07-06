/**
 * localStorage adapter for saves and settings. Lives in the UI layer by
 * constitution: the engine never touches storage. Everything here fails
 * soft (private-mode browsers, storage quotas, corrupted entries return
 * null instead of throwing at the player).
 */
import type { SaveGameData } from '../engine/schemas';

const PREFIX = 'critical-window';
// Working-title keys from pre-launch builds (2026-07-03..05); remove the
// migration after the alpha, nobody else ever had them.
const OLD_PREFIX = 'race-conditions';

/**
 * One-time migration from the working-title prefix. Copies any old key to
 * its new name without deleting the original (a rollback never loses data).
 */
function migrateOldPrefix(): void {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const oldKey = localStorage.key(i);
      if (!oldKey || !oldKey.startsWith(`${OLD_PREFIX}.`)) {
        continue;
      }
      const newKey = `${PREFIX}${oldKey.slice(OLD_PREFIX.length)}`;
      if (localStorage.getItem(newKey) === null) {
        const value = localStorage.getItem(oldKey);
        if (value !== null) {
          localStorage.setItem(newKey, value);
        }
      }
    }
  } catch {
    // Storage unavailable: nothing to migrate.
  }
}
migrateOldPrefix();

export const SAVE_SLOTS = ['auto', 'slot1', 'slot2', 'slot3'] as const;
export type SaveSlot = (typeof SAVE_SLOTS)[number];

function key(slot: SaveSlot): string {
  return `${PREFIX}.save.${slot}`;
}

export function writeSlot(slot: SaveSlot, save: SaveGameData): boolean {
  try {
    localStorage.setItem(key(slot), JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

/** Returns the raw parsed JSON; the caller validates via loadSave (engine). */
export function readSlot(slot: SaveSlot): unknown {
  try {
    const raw = localStorage.getItem(key(slot));
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function clearSlot(slot: SaveSlot): void {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    // Nothing sensible to do; the slot UI re-reads and reflects reality.
  }
}

/** Whether the 2023->2026 prologue has been seen (first-run tutorial gate). */
export function readPrologueSeen(): boolean {
  try {
    return localStorage.getItem(`${PREFIX}.prologueSeen`) === '1';
  } catch {
    return true; // storage unavailable: do not trap the player in a tutorial
  }
}

export function writePrologueSeen(): void {
  try {
    localStorage.setItem(`${PREFIX}.prologueSeen`, '1');
  } catch {
    // In-memory only for this session; acceptable degradation.
  }
}

export interface Settings {
  theme: 'auto' | 'light' | 'dark' | 'contrast';
  reducedMotion: 'auto' | 'on';
  textSize: 'normal' | 'large';
  /** Sound is off by default: classrooms, autoplay policies, respect. */
  musicOn: boolean;
  voiceOn: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  // Dark is the brand: the wedge of light needs its dark field. Auto, light
  // and contrast stay one toggle away for bright classrooms and projectors.
  theme: 'dark',
  reducedMotion: 'auto',
  textSize: 'normal',
  musicOn: false,
  voiceOn: false,
};

/** First-run hints: shown once each, then never again. */
export function hintSeen(id: string): boolean {
  try {
    return localStorage.getItem(`${PREFIX}.hint.${id}`) === '1';
  } catch {
    return true; // storage unavailable: stay quiet rather than nag
  }
}

export function markHint(id: string): void {
  try {
    localStorage.setItem(`${PREFIX}.hint.${id}`, '1');
  } catch {
    // ignore
  }
}

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(`${PREFIX}.settings`);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: Settings): void {
  try {
    localStorage.setItem(`${PREFIX}.settings`, JSON.stringify(settings));
  } catch {
    // Settings stay in-memory for the session; acceptable degradation.
  }
}
