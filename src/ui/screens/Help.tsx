import { anchorSources, anchorTable, anchorTrackIds } from '../anchors';
import { t, type StringKey } from '../i18n';
import { useStore } from '../store';

const ANCHOR_TRACK_LABEL: Record<string, StringKey> = {
  capability: 'resource.capability.label',
  compute: 'resource.compute.label',
  energy: 'resource.energy.label',
  talent: 'resource.talent.label',
  capital: 'resource.capital.label',
  publicTrust: 'resource.publicTrust.label',
  politicalCapital: 'resource.politicalCapital.label',
  safetyInsight: 'resource.safetyInsight.label',
  jobDisplacement: 'society.jobDisplacement.label',
  unrest: 'society.unrest.label',
  bilateralTrust: 'rival.trust.label',
  substitution: 'rival.substitution.label',
};

const TERMS = [
  'compute',
  'energy',
  'talent',
  'capital',
  'publicTrust',
  'politicalCapital',
  'capability',
  'safetyInsight',
  'jobDisplacement',
  'unrest',
  'rivalCapability',
  'rivalTrust',
  'rivalSubstitution',
  'evalBand',
] as const;

const TERM_LABEL: Record<(typeof TERMS)[number], StringKey> = {
  compute: 'resource.compute.label',
  energy: 'resource.energy.label',
  talent: 'resource.talent.label',
  capital: 'resource.capital.label',
  publicTrust: 'resource.publicTrust.label',
  politicalCapital: 'resource.politicalCapital.label',
  capability: 'resource.capability.label',
  safetyInsight: 'resource.safetyInsight.label',
  jobDisplacement: 'society.jobDisplacement.label',
  unrest: 'society.unrest.label',
  rivalCapability: 'rival.capability.label',
  rivalTrust: 'rival.trust.label',
  rivalSubstitution: 'rival.substitution.label',
  evalBand: 'eval.heading',
};

const ENDINGS = [
  'flourishing',
  'misalignedCatastrophe',
  'outpaced',
  'negotiatedSlowdown',
  'societalBreakdown',
] as const;

/**
 * The rulebook, in the open. Only the sealed dice stay hidden; every track's
 * causes and effects and every ending's door are stated plainly here, because
 * a player who cannot see the machine cannot make a meaningful decision.
 */
export function Help({ onBack }: { onBack: () => void }) {
  return (
    <main className="help">
      <header className="help-head">
        <button type="button" className="btn" onClick={onBack}>
          ← {t('help.back')}
        </button>
        <h1>{t('help.heading')}</h1>
      </header>
      <p className="help-intro">{t('help.intro')}</p>

      <section className="panel">
        <h2 className="panel-heading">{t('help.turn.heading')}</h2>
        <p className="panel-explain">{t('help.turn.body')}</p>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('help.endings.heading')}</h2>
        <p className="panel-explain">{t('help.endings.intro')}</p>
        <dl className="help-endings">
          {ENDINGS.map((ending) => (
            <div key={ending} className="help-ending">
              <dt>{t(`debrief.ending.${ending}.title` as StringKey)}</dt>
              <dd>{t(`help.ending.${ending}` as StringKey)}</dd>
            </div>
          ))}
          <div className="help-ending">
            <dt>{t('hud.era.late')}</dt>
            <dd>{t('help.ending.unresolved')}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('help.beats.heading')}</h2>
        <p className="panel-explain">{t('help.beats.intro')}</p>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('help.wildcards.heading')}</h2>
        <p className="panel-explain">{t('help.wildcards.intro')}</p>
        <ul className="help-wildcards">
          <li>{t('help.wildcard.weightTheft')}</li>
          <li>{t('help.wildcard.taiwanStraitCrisis')}</li>
          <li>{t('help.wildcard.asmlExportSqueeze')}</li>
          <li>{t('help.wildcard.gridCrunch')}</li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('help.incidents.heading')}</h2>
        <p className="panel-explain">{t('help.incidents.intro')}</p>
        <p className="panel-explain">{t('help.incidents.rungs')}</p>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('help.anchors.heading')}</h2>
        <p className="panel-explain">{t('help.anchors.body')}</p>
        <button type="button" className="btn" onClick={() => useStore.getState().goTo('sources')}>
          {t('help.sourcesLink')}
        </button>
        <div className="help-anchors">
          {anchorTrackIds().map((track) => (
            <details key={track} className="help-anchor-track">
              <summary>{t(ANCHOR_TRACK_LABEL[track] ?? 'resource.capability.label')}</summary>
              <table className="help-anchor-table">
                <tbody>
                  {anchorTable(track).map((row) => (
                    <tr key={row.at}>
                      <td className="help-anchor-at">{row.at}</td>
                      <td>{row.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="help-anchor-sources">{anchorSources(track).join(' · ')}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('help.terms.heading')}</h2>
        <div className="help-terms">
          {TERMS.map((term) => (
            <article key={term} className="help-term">
              <h3>{t(TERM_LABEL[term])}</h3>
              <p>{t(`help.term.${term}.what` as StringKey)}</p>
              <p className="help-moves">{t(`help.term.${term}.moves` as StringKey)}</p>
              <p className="help-affects">{t(`help.term.${term}.affects` as StringKey)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
