import { useMemo, useState } from 'react';
import type { EngineData } from '../../engine/data';
import type { TurnSnapshot } from '../../engine/probes';
import { t } from '../i18n';
import './timeline.css';

/**
 * The run, as one picture. Four entity-locked series (you, rival, trust,
 * unrest) plus the eval band as a shaded annotation layer: what you knew,
 * drawn around what was true. Palette validated per mode (dataviz method);
 * the rival is additionally dashed and every series is direct-labeled, so
 * identity never rides on color alone. Hover snaps a crosshair to the
 * nearest turn; a table view carries the same data for screen readers.
 */

const W = 720;
const H = 260;
const PAD = { top: 16, right: 88, bottom: 28, left: 40 };

interface Series {
  id: 'you' | 'rival' | 'trust' | 'unrest';
  labelKey: 'race.you' | 'race.rival' | 'resource.publicTrust.label' | 'society.unrest.label';
  values: number[];
  dashed?: boolean;
}

export function Timeline({ data, snapshots }: { data: EngineData; snapshots: TurnSnapshot[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { series, band, turns, electionTurn, incidentTurns } = useMemo(() => {
    const turnsList = snapshots.map((s) => s.turn);
    const mk = (pick: (s: TurnSnapshot) => number): number[] => snapshots.map(pick);
    const finalLog = snapshots[snapshots.length - 1]?.state.log ?? [];
    return {
      turns: turnsList,
      electionTurn: data.parameters.turnStructure.electionTurn.value,
      incidentTurns: [...new Set(finalLog.filter((e) => e.kind === 'incident').map((e) => e.turn))],
      series: [
        { id: 'you', labelKey: 'race.you', values: mk((s) => s.state.resources.capability) },
        {
          id: 'rival',
          labelKey: 'race.rival',
          values: mk((s) => s.state.rival.capability),
          dashed: true,
        },
        {
          id: 'trust',
          labelKey: 'resource.publicTrust.label',
          values: mk((s) => s.state.resources.publicTrust),
        },
        {
          id: 'unrest',
          labelKey: 'society.unrest.label',
          values: mk((s) => s.state.society.unrest),
        },
      ] satisfies Series[],
      band: snapshots.map((s) => {
        const report = s.state.evalHistory[s.state.evalHistory.length - 1];
        return report ? { low: report.bandLow, high: report.bandHigh } : { low: 0, high: 0 };
      }),
    };
  }, [data, snapshots]);

  if (snapshots.length < 2) {
    return null;
  }

  const lastTurn = turns[turns.length - 1]!;
  const x = (turn: number): number =>
    PAD.left + ((turn - 1) / Math.max(1, lastTurn - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number): number => PAD.top + (1 - v / 1000) * (H - PAD.top - PAD.bottom);

  const path = (values: number[]): string =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(turns[i]!)},${y(v)}`).join(' ');

  const bandPath = `${band.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(turns[i]!)},${y(b.high)}`).join(' ')} ${band
    .slice()
    .reverse()
    .map((b, i) => `L${x(turns[band.length - 1 - i]!)},${y(b.low)}`)
    .join(' ')} Z`;

  const hoverTurnIndex =
    hover === null
      ? null
      : Math.max(
          0,
          Math.min(
            turns.length - 1,
            Math.round(((hover - PAD.left) / (W - PAD.left - PAD.right)) * (lastTurn - 1)),
          ),
        );

  return (
    <figure className="timeline">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('debrief.timeline')}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHover(((e.clientX - rect.left) / rect.width) * W);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {/* recessive grid */}
        {[0, 250, 500, 750, 1000].map((v) => (
          <g key={v}>
            <line className="tl-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="tl-axis" x={PAD.left - 6} y={y(v) + 3} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {turns
          .filter((turn) => turn % 4 === 1 || turn === lastTurn)
          .map((turn) => (
            <text key={turn} className="tl-axis" x={x(turn)} y={H - 8} textAnchor="middle">
              {turn}
            </text>
          ))}

        {/* eval band: what you were allowed to know */}
        <path className="tl-band" d={bandPath} />

        {/* election annotation */}
        {electionTurn <= lastTurn && (
          <g>
            <line
              className="tl-election"
              x1={x(electionTurn)}
              x2={x(electionTurn)}
              y1={PAD.top}
              y2={H - PAD.bottom}
            />
            <text className="tl-axis" x={x(electionTurn)} y={PAD.top - 4} textAnchor="middle">
              {t('report.kind.election')}
            </text>
          </g>
        )}

        {/* incident markers: the warning shots, where they landed */}
        {incidentTurns
          .filter((turn) => turn <= lastTurn)
          .map((turn) => (
            <g key={`incident-${turn}`}>
              <line
                className="tl-incident"
                x1={x(turn)}
                x2={x(turn)}
                y1={PAD.top}
                y2={H - PAD.bottom}
              />
              <text className="tl-incident-mark" x={x(turn)} y={PAD.top + 10} textAnchor="middle">
                !
              </text>
            </g>
          ))}

        {/* series */}
        {series.map((s) => (
          <g key={s.id}>
            <path
              className={`tl-line tl-${s.id}`}
              d={path(s.values)}
              strokeDasharray={s.dashed ? '6 4' : undefined}
            />
            <text
              className={`tl-label tl-label-${s.id}`}
              x={W - PAD.right + 6}
              y={y(s.values[s.values.length - 1]!) + 3}
            >
              {t(s.labelKey)}
            </text>
          </g>
        ))}

        {/* crosshair + tooltip */}
        {hoverTurnIndex !== null && (
          <g>
            <line
              className="tl-crosshair"
              x1={x(turns[hoverTurnIndex]!)}
              x2={x(turns[hoverTurnIndex]!)}
              y1={PAD.top}
              y2={H - PAD.bottom}
            />
            {series.map((s) => (
              <circle
                key={s.id}
                className={`tl-dot tl-${s.id}`}
                cx={x(turns[hoverTurnIndex]!)}
                cy={y(s.values[hoverTurnIndex]!)}
                r={4}
              />
            ))}
          </g>
        )}
      </svg>

      {hoverTurnIndex !== null && (
        <div className="tl-tooltip" role="status">
          <strong>{t('hud.turn', { turn: turns[hoverTurnIndex]!, maxTurns: lastTurn })}</strong>
          {series.map((s) => (
            <span key={s.id} className="tl-tooltip-row">
              <span className={`tl-swatch tl-bg-${s.id}`} aria-hidden="true" />
              {t(s.labelKey)}: {s.values[hoverTurnIndex]}
            </span>
          ))}
          <span className="tl-tooltip-row">
            {t('eval.band', {
              low: band[hoverTurnIndex]!.low,
              high: band[hoverTurnIndex]!.high,
            })}
          </span>
        </div>
      )}

      <figcaption className="tl-legend">
        {series.map((s) => (
          <span key={s.id} className="tl-legend-item">
            <span className={`tl-swatch tl-bg-${s.id}`} aria-hidden="true" />
            {t(s.labelKey)}
          </span>
        ))}
        <span className="tl-legend-item">
          <span className="tl-swatch tl-bg-band" aria-hidden="true" />
          {t('eval.heading')}
        </span>
        {incidentTurns.length > 0 && (
          <span className="tl-legend-item">
            <span className="tl-swatch tl-bg-incident" aria-hidden="true" />
            {t('report.kind.incident')}
          </span>
        )}
      </figcaption>

      <details className="tl-table">
        <summary>{t('debrief.timeline')}</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              {series.map((s) => (
                <th key={s.id} scope="col">
                  {t(s.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {turns.map((turn, i) => (
              <tr key={turn}>
                <th scope="row">{turn}</th>
                {series.map((s) => (
                  <td key={s.id}>{s.values[i]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
