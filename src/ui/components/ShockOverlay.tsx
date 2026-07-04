import { useEffect, useRef } from 'react';
import type { EngineData } from '../../engine/data';
import type { GameState, LogEntry } from '../../engine/types';
import { playVoice, stopVoice } from '../audio';
import { Hint } from './Hint';
import { signed, targetLabel } from '../format';
import { t, tRef } from '../i18n';
import { useStore } from '../store';

interface ShockOverlayProps {
  data: EngineData;
  run: GameState;
  shocks: LogEntry[];
  onContinue: () => void;
}

/**
 * Incidents and wildcards land during the world update, with no decision to
 * make. They still deserve a full-screen beat: the world just hit you, and a
 * player who reads these has better data than their eval band (design key).
 */
export function ShockOverlay({ data, run, shocks, onContinue }: ShockOverlayProps) {
  const voiceOn = useStore((s) => s.settings.voiceOn);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const bodyKeyFor = (entry: LogEntry): string | null => {
    if (entry.kind === 'incident') {
      const rung = data.incidents.rungs.find((r) => r.id === entry.meta?.rungId);
      return rung ? rung.body.replace('strings:', '') : null;
    }
    const card = data.events.find((e) => e.id === entry.meta?.eventId);
    return card ? card.body.replace('strings:', '') : null;
  };

  useEffect(() => {
    headingRef.current?.focus();
    const firstKey = shocks[0] ? bodyKeyFor(shocks[0]) : null;
    if (firstKey) {
      playVoice(firstKey, voiceOn);
    }
    return stopVoice;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bodyFor = (entry: LogEntry): string => {
    const key = bodyKeyFor(entry);
    return key ? tRef(`strings:${key}`) : '';
  };

  const forcedPause = shocks.some((s) => s.meta?.forcedPause === true);

  return (
    <div className="memo-backdrop">
      <section
        className="memo memo-shock"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shock-title"
      >
        <div className="memo-masthead">
          {shocks.some((s) => s.kind === 'incident')
            ? t('report.kind.incident')
            : t('report.kind.wildcard')}
        </div>
        {shocks.some((s) => s.kind === 'incident') && <Hint id="incident" />}
        {shocks.map((entry, i) => (
          <div key={i} className="shock-block">
            <h2
              id={i === 0 ? 'shock-title' : undefined}
              className="memo-title"
              tabIndex={i === 0 ? -1 : undefined}
              ref={i === 0 ? headingRef : undefined}
            >
              {entry.stringKey ? tRef(entry.stringKey) : ''}
            </h2>
            <p className="memo-body">{bodyFor(entry)}</p>
            <p className="memo-choice-effects">
              {Object.entries(entry.deltas ?? {})
                .filter(([target]) => !target.startsWith('hidden.'))
                .map(([target, delta]) => `${signed(delta)} ${targetLabel(target)}`)
                .join(' · ')}
            </p>
          </div>
        ))}
        {forcedPause && run.phase !== 'ended' && (
          <p className="shock-pause">{t('game.forcedPause.notice')}</p>
        )}
        <div className="panel-actions">
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            {t('phase.report.heading')} →
          </button>
        </div>
      </section>
    </div>
  );
}
