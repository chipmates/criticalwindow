/**
 * Audio: build-time static files, lazy-loaded, OFF by default (classrooms,
 * autoplay policies, and respect). Music: 'I Walk With Ghosts' by Scott
 * Buckley, CC BY 4.0, named in settings and credits (picked by ear,
 * 2026-07-04: one track, looped). Narrations: generated at build time
 * (scripts/generate-audio.ts); everything degrades silently when a file
 * is absent.
 */
import type { EndingId } from '../engine/types';

const PLAYLIST = ['audio/music-i-walk-with-ghosts.mp3'] as const;

import audioScript from '../../scripts/audio-script.json';

/**
 * Model choice per VOICE, judged by ear (2026-07-04): the narrator
 * reads best in the eleven_v3 rendition (''), the advisor in the
 * multilingual v2 backup ('-v2'). Both sets ship; this map picks per clip.
 */
const MODEL_SUFFIX: Record<string, string> = {
  narrator: '',
  advisor: '-v2',
};

const VOICE_BY_KEY = new Map(
  (audioScript as { surfaces: Array<{ key: string; voice: string }> }).surfaces.map((s) => [
    s.key,
    s.voice,
  ]),
);

/** A string key becomes its pre-generated voice file (scripts/generate-audio.ts). */
function voicePath(stringKey: string): string {
  const suffix = MODEL_SUFFIX[VOICE_BY_KEY.get(stringKey) ?? 'narrator'] ?? '';
  return `audio/voice-${stringKey.replace(/\./g, '-')}${suffix}.mp3`;
}

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
  if (PLAYLIST.length === 1) {
    musicEl.loop = true; // one bed, seamless loop
  } else {
    musicEl.addEventListener('ended', () => {
      playTrack(trackIndex + 1);
    });
  }
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

/**
 * Speak one displayed text surface (memo, shock, prologue chapter, ending).
 * Pre-generated at build time; a missing file degrades to silence. Only one
 * voice at a time: opening a new surface stops the previous one.
 */
export function playVoice(stringKey: string, on: boolean): void {
  narrationEl?.pause();
  if (!on) {
    return;
  }
  narrationEl = new Audio(`${base()}${voicePath(stringKey)}`);
  narrationEl.volume = 0.9;
  narrationEl.play().catch(() => {
    // Missing voice file (not yet generated): silence, never an error.
  });
}

export function stopVoice(): void {
  narrationEl?.pause();
}

export function playNarration(ending: EndingId, on: boolean): void {
  if (ending === 'gradualDisempowerment') {
    return;
  }
  playVoice(`debrief.ending.${ending}.body`, on);
}

export function stopAllAudio(): void {
  musicEl?.pause();
  narrationEl?.pause();
}
