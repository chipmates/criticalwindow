/**
 * Anchor labels: every 0-1000 index translated back to the sourced reality it
 * was derived from ("about 40 GW of headroom", "handles hour-scale tasks").
 * Descriptive UI only: the engine never reads this file, so anchors can never
 * move balance. Lookup is nearest anchor at or below the value; honest coarse
 * bands, no interpolation.
 */
import anchorsJson from '../../data/anchors.json';
import { tRef } from './i18n';

interface UnitDef {
  template: string;
  points: Array<[number, number]>;
  scale: 'linear' | 'log';
  decimals: number;
}

interface AnchorTrack {
  sourceIds: string[];
  anchors: Array<{ at: number; label: string }>;
  unit?: UnitDef;
}

const TRACKS = (anchorsJson as unknown as { tracks: Record<string, AnchorTrack> }).tracks;

export type AnchorTrackId = keyof typeof TRACKS;

function interpolate(unit: UnitDef, value: number): number {
  const pts = unit.points;
  if (value <= pts[0]![0]) {
    return pts[0]![1];
  }
  for (let i = 1; i < pts.length; i += 1) {
    const [x1, y1] = pts[i]!;
    if (value <= x1) {
      const [x0, y0] = pts[i - 1]!;
      const f = (value - x0) / (x1 - x0);
      if (unit.scale === 'log' && y0 > 0 && y1 > 0) {
        return Math.exp(Math.log(y0) + f * (Math.log(y1) - Math.log(y0)));
      }
      return y0 + f * (y1 - y0);
    }
  }
  return pts[pts.length - 1]![1];
}

/** Hours -> a human horizon phrase ("3-day", "2-week"), for the capability clock. */
function horizonPhrase(hours: number): string {
  const pick = (key: string, n: number): string =>
    tRef(`strings:unit.capability.${key}`).replace('{n}', String(n));
  if (hours < 1) {
    return pick('minutes', Math.max(5, Math.round((hours * 60) / 5) * 5));
  }
  if (hours < 48) {
    return pick('hours', Math.max(1, Math.round(hours)));
  }
  if (hours < 24 * 14) {
    return pick('days', Math.round(hours / 24));
  }
  if (hours < 24 * 7 * 9) {
    return pick('weeks', Math.round(hours / (24 * 7)));
  }
  if (hours < 8760) {
    return pick('months', Math.round(hours / 730));
  }
  return pick('years', Math.max(1, Math.round(hours / 8760)));
}

/**
 * The continuous real-world reading of a track value ("≈ 55 GW of grid
 * headroom"), where an honest unit exists. Null where one does not; the
 * qualitative rungs cover those, and nothing fakes precision.
 */
export function unitFor(track: string, value: number): string | null {
  const unit = TRACKS[track]?.unit;
  if (!unit) {
    return null;
  }
  const real = interpolate(unit, value);
  const template = tRef(unit.template);
  if (template.includes('{t}')) {
    return template.replace('{t}', horizonPhrase(real));
  }
  const rounded = unit.decimals === 0 ? Math.round(real) : real.toFixed(unit.decimals);
  return template.replace('{n}', String(rounded));
}

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
