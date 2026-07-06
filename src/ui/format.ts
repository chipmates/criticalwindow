/**
 * Display formatting shared by panels: effect summaries, dates, deltas.
 * All text flows through the strings table; this file arranges, never writes.
 */
import type { EffectSetData } from '../engine/schemas';
import type { GameState } from '../engine/types';
import { t, type StringKey } from './i18n';

export function targetLabel(target: string): string {
  const key = target.includes('.') ? `${target}.label` : `resource.${target}.label`;
  return t(key as StringKey);
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Compact tradeoff line for a choice/policy: "+50 Capability · -100 Rival Trust · Set: Treaty Channel" */
export function effectSummary(effects: EffectSetData | undefined): string[] {
  if (!effects) {
    return [];
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(effects)) {
    if (key === 'flags') {
      for (const flag of value as string[]) {
        parts.push(t(`flag.${flag}.label` as StringKey));
      }
      continue;
    }
    if (key === 'clearFlags' || typeof value !== 'number') {
      continue;
    }
    if (key.startsWith('hidden.')) {
      // Hidden effects exist in open data but the running UI does not
      // preview them; the debrief and the repository tell the whole truth.
      continue;
    }
    parts.push(`${signed(value)} ${targetLabel(key)}`);
  }
  return parts;
}

export function delayedSummary(
  delayed: Array<{ inTurns: number; effects: EffectSetData }> | undefined,
): string[] {
  return (delayed ?? []).map(
    (d) => `in ${d.inTurns} turns: ${effectSummary(d.effects).join(', ') || '…'}`,
  );
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function turnDate(
  startTime: { year: number; quarter: number },
  turn: number,
): { quarter: string; year: number } {
  const index = startTime.quarter - 1 + (turn - 1);
  return {
    quarter: QUARTERS[index % 4]!,
    year: startTime.year + Math.floor(index / 4),
  };
}

export function eraLabelKey(era: string): StringKey {
  return (
    { early: 'hud.era.early', mid: 'hud.era.mid', late: 'hud.era.late' } as Record<
      string,
      StringKey
    >
  )[era]!;
}

/** Last-turn log entries relevant for one seat's quarter report. */
export function reportEntries(run: GameState, seat: string) {
  return run.log.filter(
    (entry) =>
      entry.turn === run.turn &&
      (entry.seat === seat || entry.seat === null) &&
      entry.deltas !== null &&
      Object.keys(entry.deltas).length > 0 &&
      entry.kind !== 'allocation',
  );
}
