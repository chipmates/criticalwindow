import type { GameState, PlayableSeatId } from '../../engine/types';
import { t } from '../i18n';

export function EvalBand({ run, seat }: { run: GameState; seat: PlayableSeatId }) {
  const history = run.seats[seat].evalHistory;
  const report = history[history.length - 1];
  if (!report) {
    return null;
  }
  const left = (report.bandLow / 1000) * 100;
  const width = ((report.bandHigh - report.bandLow) / 1000) * 100;
  return (
    <section className="panel eval" aria-labelledby="eval-heading">
      <h2 id="eval-heading" className="panel-heading">
        {t('eval.heading')}
      </h2>
      <div
        className="eval-scale"
        role="img"
        aria-label={t('eval.band', { low: report.bandLow, high: report.bandHigh })}
      >
        <span className="eval-fill" style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
      <p className="eval-numbers">
        {t('eval.band', { low: report.bandLow, high: report.bandHigh })}
      </p>
      <p className="panel-explain">{t('eval.explain')}</p>
    </section>
  );
}
