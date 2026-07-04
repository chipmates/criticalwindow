/**
 * Anchor labels: every 0-1000 index translated back to the sourced reality it
 * was derived from ("about 40 GW of headroom", "handles hour-scale tasks").
 * Descriptive UI only: the engine never reads this file, so anchors can never
 * move balance. Lookup is nearest anchor at or below the value; honest coarse
 * bands, no interpolation.
 */
import anchorsJson from '../../data/anchors.json';
import { tRef } from './i18n';

interface AnchorTrack {
  sourceIds: string[];
  anchors: Array<{ at: number; label: string }>;
}

const TRACKS = (anchorsJson as { tracks: Record<string, AnchorTrack> }).tracks;

export type AnchorTrackId = keyof typeof TRACKS  ;

export function anchorFor(track: string, value: number): string | null {
  const def = TRACKS[track];
  if (!def) {
    return null;
  }
  let best: { at: number; label: string } | null = null;
  for (const anchor of def.anchors) {
    if (anchor.at <= value && (best === null || anchor.at > best.at)) {
      best = anchor;
    }
  }
  return best ? tRef(best.label) : null;
}

/** All anchors of one track, resolved, for the Help table. */
export function anchorTable(track: string): Array<{ at: number; text: string }> {
  const def = TRACKS[track];
  if (!def) {
    return [];
  }
  return def.anchors.map((a) => ({ at: a.at, text: tRef(a.label) }));
}

export function anchorTrackIds(): string[] {
  return Object.keys(TRACKS);
}

export function anchorSources(track: string): string[] {
  return TRACKS[track]?.sourceIds ?? [];
}
