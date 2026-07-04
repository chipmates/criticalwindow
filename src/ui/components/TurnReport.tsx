import type { EngineData } from '../../engine/data';
import type { GameState, LogEntry } from '../../engine/types';
import { reportEntries, signed, targetLabel } from '../format';
import { t, tRef, type StringKey } from '../i18n';

interface TurnReportProps {
  data: EngineData;
  run: GameState;
  onAdvance: () => void;
}

function kindLine(data: EngineData, entry: LogEntry): string {
  const sourceTitle = (kind: 'event' | 'policy', id: unknown): string => {
    if (typeof id !== 'string') {
      return '';
    }
    const card =
      kind === 'event'
        ? data.events.find((e) => e.id === id)
        : data.policies.find((p) => p.id === id);
    return card ? tRef(card.title) : id;
  };
  switch (entry.kind) {
    case 'policyPlayed':
      return t('report.kind.policyPlayed', { source: sourceTitle('policy', entry.meta?.policyId) });
    case 'eventResolved':
      return t('report.kind.eventResolved', { source: sourceTitle('event', entry.meta?.eventId) });
    case 'delayedEffect': {
      const kind = entry.meta?.sourceKind === 'policy' ? 'policy' : 'event';
      return t('report.kind.delayedEffect', {
        source: sourceTitle(kind, entry.meta?.sourceId),
      });
    }
    case 'societyUpdate':
      return t('report.kind.societyUpdate');
    case 'rivalAction':
      return t('report.kind.rivalAction');
    case 'election':
      return t('report.kind.election');
    case 'incident':
      return `${t('report.kind.incident')}: ${entry.stringKey ? tRef(entry.stringKey) : ''}`;
    case 'wildcard':
      return `${t('report.kind.wildcard')}: ${entry.stringKey ? tRef(entry.stringKey) : ''}`;
    default:
      return t('report.kind.upkeep');
  }
}

export function TurnReport({ data, run, onAdvance }: TurnReportProps) {
  const entries = reportEntries(run);
  const ended = run.phase === 'ended';
  const election = run.log.find((e) => e.turn === run.turn && e.kind === 'election');

  return (
    <section className="panel" aria-labelledby="report-heading">
      <h2 id="report-heading" className="panel-heading">
        {t('phase.report.heading')}
      </h2>
      <p className="panel-explain">{t(`report.rival.${run.rival.posture}` as StringKey)}</p>
      {election && (
        <p className="report-election">
          {t(election.meta?.renewed ? 'report.election.renewed' : 'report.election.rebuked')}
        </p>
      )}
      <ul className="report-list">
        {entries.map((entry, i) => (
          <li
            key={i}
            className={
              entry.kind === 'incident' || entry.kind === 'wildcard'
                ? 'report-line report-line-shock'
                : 'report-line'
            }
          >
            <span className="report-kind">{kindLine(data, entry)}</span>
            <span className="report-deltas">
              {Object.entries(entry.deltas ?? {})
                .filter(([target]) => !target.startsWith('hidden.'))
                .map(([target, delta]) => `${signed(delta)} ${targetLabel(target)}`)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
      <div className="panel-actions">
        <button type="button" className="btn btn-primary" onClick={onAdvance}>
          {ended ? t('phase.report.endingReached') : t('phase.report.advance')}
        </button>
      </div>
    </section>
  );
}
