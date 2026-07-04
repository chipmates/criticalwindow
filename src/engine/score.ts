/**
 * The Reckoning: a deterministic grade for a finished run, computed from the
 * final state alone. Same actions, same score, byte-exact, which is what
 * makes a shared seed a duel.
 *
 * Design rules: the ENDING dominates (no point total can outrun a
 * catastrophe), and every breakdown line is one of the game's lessons
 * restated as a number. The score can never teach values the game does not
 * hold.
 */
import type { GameState, EndingId } from './types';

export interface ScoreLine {
  /** strings key under debrief.score.line.* */
  key: string;
  points: number;
}

export interface RunScore {
  total: number;
  grade: string;
  lines: ScoreLine[];
}

const ENDING_BASE: Record<EndingId, number> = {
  flourishing: 5000,
  negotiatedSlowdown: 4000,
  gradualDisempowerment: 1400,
  outpaced: 1200,
  societalBreakdown: 700,
  misalignedCatastrophe: 500,
};

/** Endings where the world broke on your watch cap the grade at D. */
const GRADE_CAPPED: ReadonlySet<EndingId> = new Set(['misalignedCatastrophe', 'societalBreakdown']);

const GRADES: Array<[number, string]> = [
  [6500, 'A+'],
  [5800, 'A'],
  [5200, 'B+'],
  [4600, 'B'],
  [4000, 'C+'],
  [3200, 'C'],
  [2200, 'D'],
];

export function scoreRun(run: GameState, warningShotsHeeded: boolean): RunScore {
  const ending = run.endingId;
  if (!ending) {
    return { total: 0, grade: '-', lines: [] };
  }
  const player = run.seats[run.playerSeat];
  const lines: ScoreLine[] = [{ key: `ending.${ending}`, points: ENDING_BASE[ending] }];

  // Society held: distance below the breakdown line at the end.
  lines.push({
    key: 'society',
    points: Math.max(0, Math.round((800 - player.society.unrest) * 0.8)),
  });
  // The public still with you.
  lines.push({ key: 'trust', points: Math.round(player.resources.publicTrust * 0.6) });
  // Alignment banked against the revealed wall (the envelope, scored).
  lines.push({
    key: 'alignment',
    points: Math.max(
      0,
      Math.min(600, player.hidden.trueAlignment - run.world.alignmentDifficulty + 300),
    ),
  });
  // Warning shots read, not raced past.
  lines.push({ key: 'warnings', points: warningShotsHeeded ? 400 : 0 });
  // Political capital left standing: governing room to spare.
  lines.push({
    key: 'capital',
    points: Math.round(Math.min(600, player.resources.politicalCapital) / 3),
  });

  const total = lines.reduce((sum, line) => sum + line.points, 0);
  let grade = 'F';
  for (const [min, g] of GRADES) {
    if (total >= min) {
      grade = g;
      break;
    }
  }
  if (GRADE_CAPPED.has(ending) && total >= 2200) {
    grade = 'D';
  }
  return { total, grade, lines };
}
