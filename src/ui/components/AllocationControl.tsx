import { useState } from 'react';
import { t } from '../i18n';

interface AllocationControlProps {
  initial: { capability: number; safety: number; diffusion: number };
  points: number;
  /** Incident fallout: capability share is capped this quarter. */
  paused?: boolean;
  /** Pure preview of this allocation's direct yields (engine curves). */
  preview: (shares: { capability: number; safety: number; diffusion: number }) => {
    capabilityGain: number;
    insightGain: number;
    capitalIncome: number;
  };
  onCommit: (a: { capability: number; safety: number; diffusion: number }) => void;
}

const STEP = 5;
const PAUSE_CAP = 30;

const ROWS = [
  {
    key: 'capability',
    label: 'phase.allocate.capability',
    hint: 'phase.allocate.capabilityHint',
    token: '--m-capability',
  },
  {
    key: 'safety',
    label: 'phase.allocate.safety',
    hint: 'phase.allocate.safetyHint',
    token: '--m-safety',
  },
  {
    key: 'diffusion',
    label: 'phase.allocate.diffusion',
    hint: 'phase.allocate.diffusionHint',
    token: '--m-diffusion',
  },
] as const;

export function AllocationControl({
  initial,
  points,
  paused = false,
  preview,
  onCommit,
}: AllocationControlProps) {
  const [shares, setShares] = useState(() =>
    paused && initial.capability > PAUSE_CAP
      ? {
          capability: PAUSE_CAP,
          safety: initial.safety + (initial.capability - PAUSE_CAP),
          diffusion: initial.diffusion,
        }
      : initial,
  );
  const total = shares.capability + shares.safety + shares.diffusion;
  const remaining = 100 - total;
  const yields = preview(shares);
  const previewLine: Record<(typeof ROWS)[number]['key'], string> = {
    capability: t('alloc.preview.capability', { gain: yields.capabilityGain }),
    safety: t('alloc.preview.safety', { gain: yields.insightGain }),
    diffusion: t('alloc.preview.diffusion', { income: yields.capitalIncome }),
  };

  function bump(key: (typeof ROWS)[number]['key'], delta: number): void {
    setShares((current) => {
      const cap = paused && key === 'capability' ? PAUSE_CAP : 100;
      const next = Math.min(cap, Math.max(0, current[key] + delta));
      return { ...current, [key]: next };
    });
  }

  return (
    <section className="panel" aria-labelledby="alloc-heading">
      <h2 id="alloc-heading" className="panel-heading">
        {t('phase.allocate.heading')}
      </h2>
      <p className="panel-explain">{t('phase.allocate.explain', { points })}</p>
      {paused && <p className="alloc-paused">{t('game.forcedPause.notice')}</p>}
      <div className="alloc-rows">
        {ROWS.map((row) => (
          <div key={row.key} className="alloc-row">
            <div className="alloc-row-head">
              <span className="alloc-label">{t(row.label)}</span>
              <span className="alloc-share" style={{ color: `var(${row.token})` }}>
                {shares[row.key]}%
              </span>
            </div>
            <div className="alloc-controls">
              <button
                type="button"
                className="btn btn-step"
                onClick={() => bump(row.key, -STEP)}
                disabled={shares[row.key] === 0}
                aria-label={`${t(row.label)} minus ${STEP}`}
              >
                −
              </button>
              <span className="alloc-track" aria-hidden="true">
                <span
                  className="alloc-fill"
                  style={{ width: `${shares[row.key]}%`, background: `var(${row.token})` }}
                />
              </span>
              <button
                type="button"
                className="btn btn-step"
                onClick={() => bump(row.key, STEP)}
                disabled={shares[row.key] === 100 || remaining < STEP}
                aria-label={`${t(row.label)} plus ${STEP}`}
              >
                +
              </button>
            </div>
            <p className="alloc-hint">{t(row.hint)}</p>
            <p className="alloc-preview">{previewLine[row.key]}</p>
          </div>
        ))}
      </div>
      <div className="panel-actions">
        <span className={remaining === 0 ? 'alloc-remaining alloc-ok' : 'alloc-remaining'}>
          {remaining === 0 ? '✓' : `${remaining}%`}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          disabled={remaining !== 0}
          onClick={() => onCommit(shares)}
        >
          {t('phase.allocate.confirm')}
        </button>
      </div>
    </section>
  );
}
