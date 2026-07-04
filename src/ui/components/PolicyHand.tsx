import type { EngineData } from '../../engine/data';
import { playablePolicies } from '../../engine/step';
import type { GameState } from '../../engine/types';
import { delayedSummary, effectSummary } from '../format';
import { t, tRef, type StringKey } from '../i18n';
import { TagStamp } from './TagStamp';

interface PolicyHandProps {
  data: EngineData;
  run: GameState;
  onPlay: (policyId: string) => void;
  onSkip: () => void;
}

export function PolicyHand({ data, run, onPlay, onSkip }: PolicyHandProps) {
  const playable = playablePolicies(data, run);
  return (
    <section className="panel" aria-labelledby="policy-heading">
      <h2 id="policy-heading" className="panel-heading">
        {t('phase.policy.heading')}
      </h2>
      <p className="panel-explain">{t('phase.policy.explain')}</p>
      <div className="hand">
        {playable.map(({ id, playable: ok, reason }) => {
          const card = data.policies.find((p) => p.id === id)!;
          const costs: string[] = [];
          if (card.cost?.politicalCapital) {
            costs.push(`${card.cost.politicalCapital} ${t('resource.politicalCapital.label')}`);
          }
          if (card.cost?.capital) {
            costs.push(`${card.cost.capital} ${t('resource.capital.label')}`);
          }
          return (
            <article key={id} className={ok ? 'card' : 'card card-locked'}>
              <header className="card-head">
                <TagStamp tags={card.tags} size={26} />
                <h3 className="card-title">{tRef(card.title)}</h3>
                {card.oncePerRun && (
                  <span className="card-badge">{t('phase.policy.oncePerRun')}</span>
                )}
              </header>
              <p className="card-body">{tRef(card.body)}</p>
              {costs.length > 0 && <p className="card-cost">{costs.join(' · ')}</p>}
              <ul className="card-effects">
                {effectSummary(card.effects).map((line) => (
                  <li key={line}>{line}</li>
                ))}
                {delayedSummary(card.delayedEffects).map((line) => (
                  <li key={line} className="card-delayed">
                    {line}
                  </li>
                ))}
              </ul>
              <footer className="card-actions">
                {ok ? (
                  <button type="button" className="btn btn-primary" onClick={() => onPlay(id)}>
                    {t('phase.policy.play')}
                  </button>
                ) : (
                  <span className="card-lock-reason">
                    {t(`phase.policy.locked.${reason ?? 'cost'}` as StringKey)}
                  </span>
                )}
              </footer>
            </article>
          );
        })}
      </div>
      <div className="panel-actions">
        <button type="button" className="btn" onClick={onSkip}>
          {t('phase.policy.skip')}
        </button>
      </div>
    </section>
  );
}
