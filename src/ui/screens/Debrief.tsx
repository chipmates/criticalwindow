import { useEffect, useMemo, useState } from 'react';
import { replayTurns, runProbes } from '../../engine/probes';
import { encodeShare } from '../../engine/save';
import { playNarration } from '../audio';
import { Timeline } from '../components/Timeline';
import en from '../../../data/strings/en.json';
import { t, type StringKey } from '../i18n';
import { gameData, useStore } from '../store';

function has(key: string): key is StringKey {
  return key in en;
}

export function Debrief() {
  const run = useStore((s) => s.run);
  const runMeta = useStore((s) => s.runMeta);
  const actionsLog = useStore((s) => s.actionsLog);
  const goTo = useStore((s) => s.goTo);
  const data = gameData();
  const [copied, setCopied] = useState(false);
  const voiceOn = useStore((s) => s.settings.voiceOn);
  const endingForVoice = run?.endingId ?? null;
  useEffect(() => {
    if (endingForVoice) {
      playNarration(endingForVoice, voiceOn);
    }
  }, [endingForVoice, voiceOn]);

  const analysis = useMemo(() => {
    if (!runMeta) {
      return null;
    }
    const snapshots = replayTurns(data, runMeta, actionsLog);
    const probes = runProbes(data, runMeta, actionsLog);
    return { snapshots, probes };
  }, [data, runMeta, actionsLog]);

  if (!run || !runMeta || !analysis || run.endingId === null) {
    return null;
  }

  const ending = run.endingId;
  const player = run.seats[run.playerSeat];
  const rivalSeat = run.seats[run.playerSeat === 'usa' ? 'china' : 'usa'];
  const windowOpen = run.world.flags.includes('windowStillOpen');
  const epilogueKey =
    windowOpen && has(`debrief.ending.${ending}.epilogueOpen`)
      ? `debrief.ending.${ending}.epilogueOpen`
      : `debrief.ending.${ending}.epilogue`;
  const epilogueText = t(epilogueKey as StringKey);
  const { probes, snapshots } = analysis;

  const takeaways: Array<{ key: string; fired: boolean }> = [
    {
      key: 't1',
      fired:
        probes.safetyUnderinvestment.turns.length > 0 ||
        ending === 'misalignedCatastrophe' ||
        ending === 'outpaced',
    },
    { key: 't2', fired: true },
    {
      key: 't3',
      fired:
        run.world.flags.includes('exportCrackdown') ||
        player.resources.energy < 300 ||
        rivalSeat.substitution >= 700,
    },
    {
      key: 't4',
      fired: probes.treatyWindowOpen.turns.length > 0 || ending === 'negotiatedSlowdown',
    },
    { key: 't5', fired: probes.societyNeglect.turns.length > 0 || ending === 'societalBreakdown' },
  ];

  const share = encodeShare({
    seed: runMeta.seed,
    presetId: runMeta.presetId,
    dataVersion: data.dataVersion,
  });

  const treatyLine =
    probes.treatyWindowOpen.turns.length === 0
      ? t('debrief.probe.treatyWindowNever')
      : ending === 'negotiatedSlowdown'
        ? t('debrief.probe.treatyWindowTaken', { turns: probes.treatyWindowOpen.turns.join(', ') })
        : t('debrief.probe.treatyWindow', { turns: probes.treatyWindowOpen.turns.join(', ') });

  return (
    <main className="debrief">
      <header className="debrief-head">
        <p className="title-kicker">{t('debrief.heading')}</p>
        <h1 className="debrief-ending">{t(`debrief.ending.${ending}.title` as StringKey)}</h1>
      </header>

      <section className="panel">
        <h2 className="panel-heading">{t('debrief.whatHappened')}</h2>
        <p className="debrief-body">{t(`debrief.ending.${ending}.body` as StringKey)}</p>
        {windowOpen && <p className="debrief-window">{t('debrief.windowStillOpen')}</p>}
        <p className="debrief-epilogue">{epilogueText}</p>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('debrief.timeline')}</h2>
        <Timeline data={data} snapshots={snapshots} />
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('debrief.counterfactuals')}</h2>
        <ul className="debrief-probes">
          <li>{treatyLine}</li>
          <li>
            {probes.safetyUnderinvestment.turns.length > 0
              ? t('debrief.probe.safetyBlind', {
                  count: probes.safetyUnderinvestment.turns.length,
                  turns: probes.safetyUnderinvestment.turns.join(', '),
                })
              : t('debrief.probe.safetyClear')}
          </li>
          {probes.societyNeglect.turns.length > 0 && (
            <li>
              {t('debrief.probe.societyNeglect', {
                turns: probes.societyNeglect.turns.join(', '),
              })}
            </li>
          )}
          <li>
            {probes.warningShots.turns.length === 0
              ? t('debrief.probe.noIncidents')
              : probes.warningShots.evidence.some((kept) => kept === 1)
                ? t('debrief.probe.warningShots', {
                    count: probes.warningShots.turns.length,
                    turns: probes.warningShots.turns.join(', '),
                  })
                : t('debrief.probe.warningShotsHeeded', {
                    count: probes.warningShots.turns.length,
                  })}
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('debrief.hidden.heading')}</h2>
        <dl className="debrief-hidden">
          <div>
            <dt>{t('debrief.hidden.difficulty')}</dt>
            <dd>{run.world.alignmentDifficulty}</dd>
          </div>
          <div>
            <dt>{t('debrief.hidden.steepness')}</dt>
            <dd>{run.world.takeoffSteepness}</dd>
          </div>
          <div>
            <dt>{t('debrief.hidden.trueAlignment')}</dt>
            <dd>{player.hidden.trueAlignment}</dd>
          </div>
        </dl>
        <p className="panel-explain">{t('debrief.hidden.explain')}</p>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('debrief.takeawaysHeading')}</h2>
        <div className="debrief-takeaways">
          {takeaways
            .filter((tw) => tw.fired)
            .map((tw) => (
              <article key={tw.key} className="takeaway">
                <h3>{t(`debrief.takeaway.${tw.key}.title` as StringKey)}</h3>
                <p>{t(`debrief.takeaway.${tw.key}.body` as StringKey)}</p>
              </article>
            ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-heading">{t('debrief.sources.heading')}</h2>
        <p className="panel-explain">{t('debrief.sources.body')}</p>
        <details>
          <summary>{t('debrief.sources.link')}</summary>
          <p className="debrief-sources-list">
            {[
              ...new Set([
                ...data.parameters.worldviewPresets[runMeta.presetId].alignmentDifficulty.sourceIds,
                ...data.parameters.worldviewPresets[runMeta.presetId].takeoffSteepness.sourceIds,
                ...data.parameters.evalUncertainty.baseBandWidth.sourceIds,
                ...data.parameters.evalUncertainty.deceptionMaxLift.sourceIds,
              ]),
            ].join(' · ')}
          </p>
        </details>
      </section>

      <section className="panel debrief-actions">
        <div>
          <h2 className="panel-heading">{t('debrief.share.heading')}</h2>
          <p className="panel-explain">{t('debrief.share.body')}</p>
          <div className="panel-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                const url = `${location.origin}${location.pathname}${share}`;
                void navigator.clipboard?.writeText(url).then(() => setCopied(true));
              }}
            >
              {copied ? t('debrief.share.copied') : t('debrief.share.copy')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => goTo('setup')}>
              {t('debrief.playAgain')}
            </button>
          </div>
        </div>
        <div className="debrief-provocation">
          <h2 className="panel-heading">{t('debrief.provocation')}</h2>
          <p className="panel-explain">{t('debrief.provocationBody')}</p>
        </div>
      </section>
    </main>
  );
}
