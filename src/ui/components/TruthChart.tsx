import type { TurnSnapshot } from '../../engine/probes';
import type { GameState } from '../../engine/types';
import { t } from '../i18n';

/**
 * The sealed envelope, opened: what your evals said each quarter (the band)
 * drawn against what was actually true (the line), with the hidden difficulty
 * wall across the whole chart. Pure SVG from the deterministic replay; this
 * is the screenshot that explains the entire game in one image.
 */
export function TruthChart({ run, snapshots }: { run: GameState; snapshots: TurnSnapshot[] }) {
  const seat = run.playerSeat;
  const points = snapshots
    .map(({ turn, state }) => {
      const player = state.seats[seat];
      const report = player.evalHistory[player.evalHistory.length - 1];
      return report
        ? {
            turn,
            low: report.bandLow,
            high: report.bandHigh,
            truth: player.hidden.trueAlignment,
          }
        : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  if (points.length < 2) {
    return null;
  }

  const W = 480;
  const H = 180;
  const PAD = { left: 34, right: 10, top: 10, bottom: 22 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const firstTurn = points[0]!.turn;
  const lastTurn = points[points.length - 1]!.turn;
  const x = (turn: number): number =>
    PAD.left +
    (lastTurn === firstTurn ? 0 : ((turn - firstTurn) / (lastTurn - firstTurn)) * innerW);
  const y = (value: number): number => PAD.top + (1 - value / 1000) * innerH;

  const bandPath = [
    ...points.map((p) => `${x(p.turn).toFixed(1)},${y(p.high).toFixed(1)}`),
    ...[...points].reverse().map((p) => `${x(p.turn).toFixed(1)},${y(p.low).toFixed(1)}`),
  ].join(' ');
  const truthPath = points.map((p) => `${x(p.turn).toFixed(1)},${y(p.truth).toFixed(1)}`).join(' ');
  const wall = run.world.alignmentDifficulty;
  const finalTruth = points[points.length - 1]!.truth;

  return (
    <figure className="truth-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('debrief.chart.aria', { wall, truth: finalTruth })}
      >
        {/* y-axis reference values */}
        {[0, 500, 1000].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              className="truth-chart-grid"
            />
            <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" className="truth-chart-tick">
              {v}
            </text>
          </g>
        ))}
        {/* the eval band: what your instruments told you */}
        <polygon points={bandPath} className="truth-chart-band" />
        {/* the hidden wall */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(wall)}
          y2={y(wall)}
          className="truth-chart-wall"
        />
        <text x={W - PAD.right} y={y(wall) - 4} textAnchor="end" className="truth-chart-wall-label">
          {t('debrief.chart.wallLabel', { wall })}
        </text>
        {/* the truth */}
        <polyline points={truthPath} className="truth-chart-truth" />
        {/* x-axis turn labels: first, middle, last */}
        {[firstTurn, Math.round((firstTurn + lastTurn) / 2), lastTurn].map((turn) => (
          <text key={turn} x={x(turn)} y={H - 6} textAnchor="middle" className="truth-chart-tick">
            {t('debrief.chart.turn', { turn })}
          </text>
        ))}
      </svg>
      <figcaption className="panel-explain">{t('debrief.chart.caption')}</figcaption>
      <div className="truth-chart-legend">
        <span className="truth-legend-band">{t('debrief.chart.legendBand')}</span>
        <span className="truth-legend-truth">{t('debrief.chart.legendTruth')}</span>
        <span className="truth-legend-wall">{t('debrief.chart.legendWall')}</span>
      </div>
    </figure>
  );
}
