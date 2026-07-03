/**
 * Audio: build-time static files, lazy-loaded, OFF by default (classrooms,
 * autoplay policies, and respect). Music: Scott Buckley, CC BY 4.0,
 * attribution in settings, credits and README. Narrations: generated at
 * build time (scripts/generate-audio.ts); everything degrades silently
 * when a file is absent.
 */
import type { EndingId } from '../engine/types';

const MUSIC = {
  ambient: 'audio/music-simulacra.mp3',
  reflective: 'audio/music-aphelion.mp3',
} as const;

const NARRATION: Record<Exclude<EndingId, 'gradualDisempowerment'>, string> = {
  flourishing: 'audio/ending-flourishing.mp3',
  misalignedCatastrophe: 'audio/ending-misaligned-catastrophe.mp3',
  outpaced: 'audio/ending-outpaced.mp3',
  negotiatedSlowdown: 'audio/ending-negotiated-slowdown.mp3',
  societalBreakdown: 'audio/ending-societal-breakdown.mp3',
};

let musicEl: HTMLAudioElement | null = null;
let narrationEl: HTMLAudioElement | null = null;

function base(): string {
  // Respect the deployed base path (vite base './').
  return new URL('.', document.baseURI).href;
}

export function setMusic(on: boolean, mood: keyof typeof MUSIC = 'ambient'): void {
  if (!on) {
    musicEl?.pause();
    return;
  }
  const src = `${base()}${MUSIC[mood]}`;
  if (!musicEl || !musicEl.src.endsWith(MUSIC[mood])) {
    musicEl?.pause();
    musicEl = new Audio(src);
    musicEl.loop = true;
    musicEl.volume = 0.25;
  }
  musicEl.play().catch(() => {
    // Autoplay refused or file missing: stay silent, never break play.
  });
}

export function playNarration(ending: EndingId, on: boolean): void {
  narrationEl?.pause();
  if (!on || ending === 'gradualDisempowerment') {
    return;
  }
  narrationEl = new Audio(`${base()}${NARRATION[ending]}`);
  narrationEl.volume = 0.9;
  narrationEl.play().catch(() => {
    // Missing narration (e.g. key not yet refreshed): silence, not errors.
  });
}

export function stopAllAudio(): void {
  musicEl?.pause();
  narrationEl?.pause();
}
