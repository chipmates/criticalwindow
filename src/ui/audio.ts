/**
 * Audio: build-time static files, lazy-loaded, OFF by default (classrooms,
 * autoplay policies, and respect). Music: Scott Buckley, CC BY 4.0,
 * attribution in settings, credits and README. Narrations: generated at
 * build time (scripts/generate-audio.ts); everything degrades silently
 * when a file is absent.
 *
 * v0.2: one sequential playlist everywhere (The Long Dark -> I Walk With
 * Ghosts -> loop). Two calm tracks give ~14 minutes of variety under a
 * 20-40 minute session, which beats looping one of them.
 */
import type { EndingId } from '../engine/types';

const PLAYLIST = ['audio/music-the-long-dark.mp3', 'audio/music-i-walk-with-ghosts.mp3'] as const;

const NARRATION: Record<Exclude<EndingId, 'gradualDisempowerment'>, string> = {
  flourishing: 'audio/ending-flourishing.mp3',
  misalignedCatastrophe: 'audio/ending-misaligned-catastrophe.mp3',
  outpaced: 'audio/ending-outpaced.mp3',
  negotiatedSlowdown: 'audio/ending-negotiated-slowdown.mp3',
  societalBreakdown: 'audio/ending-societal-breakdown.mp3',
};

let musicEl: HTMLAudioElement | null = null;
let trackIndex = 0;
let narrationEl: HTMLAudioElement | null = null;

function base(): string {
  // Respect the deployed base path (vite base './').
  return new URL('.', document.baseURI).href;
}

function playTrack(index: number): void {
  trackIndex = index % PLAYLIST.length;
  musicEl?.pause();
  musicEl = new Audio(`${base()}${PLAYLIST[trackIndex]}`);
  musicEl.volume = 0.25;
  // Sequential playlist: when one track ends, the next plays; wraps around.
  musicEl.addEventListener('ended', () => {
    playTrack(trackIndex + 1);
  });
  musicEl.play().catch(() => {
    // Autoplay refused or file missing: stay silent, never break play.
  });
}

export function setMusic(on: boolean): void {
  if (!on) {
    musicEl?.pause();
    return;
  }
  if (musicEl && musicEl.paused && !musicEl.ended) {
    musicEl.play().catch(() => {
      // Resume refused: stay silent.
    });
    return;
  }
  if (!musicEl) {
    playTrack(0);
  }
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
