import { useEffect, useMemo, useState } from 'react';
import { replayTurns, runProbes } from '../../engine/probes';
import { encodeShare } from '../../engine/save';
import { playNarration } from '../audio';
import { Timeline } from '../components/Timeline';
import { TruthChart } from '../components/TruthChart';
import en from '../../../data/strings/en.json';
import { t, tRef, type StringKey } from '../i18n';
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
  // The hidden reveal must show the truth that DECIDED the ending: when the
  // other seat crossed (or its lab blew up), its alignment is the number
  // that mattered, not the player's.
  const endingLog = run.log.find((e) => e.kind === 'ending');
  const decidingSeat = String(
    endingLog?.meta?.causeSeat ?? endingLog?.meta?.winnerSeat ?? run.playerSeat,
  ) as 'usa' | 'china';
  const revealedAlignment =
    typeof endingLog?.meta?.trueAlignment === 'number'
      ? endingLog.meta.trueAlignment
      : player.hidden.trueAlignment;
  const decidedByOther = decidingSeat !== run.playerSeat;
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

  // Fog accounting: what the frontier cost you, in plain numbers.
  const fogStart = data.parameters.thresholds.fogZoneStart.value;
  const fogEntry = snapshots.find(
    (snap) => snap.state.seats[run.playerSeat].resources.capability >= fogStart,
  );
  const fogLine = fogEntry
    ? t('debrief.fog.account', {
        banked: fogEntry.state.seats[run.playerSeat].hidden.trueAlignment,
        lost: Math.max(
          0,
          fogEntry.state.seats[run.playerSeat].hidden.trueAlignment - player.hidden.trueAlignment,
        ),
        wall: run.world.alignmentDifficulty,
        final: player.hidden.trueAlignment,
      })
    : t('debrief.fog.none');

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
        <h2 className="panel-heading">{t('debrief.chart.heading')}</h2>
        <TruthChart run={run} snapshots={snapshots} />
        <p className="debrief-window">{fogLine}</p>
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
            <dd>{revealedAlignment}</dd>
          </div>
        </dl>
        {decidedByOther && (
          <p className="debrief-window">
            {t('debrief.hidden.decidedBy', {
              seat: tRef(data.seatsRules[decidingSeat].labelKey),
            })}
          </p>
        )}
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
        <button type="button" className="btn" onClick={() => goTo('sources')}>
          {t('debrief.sources.browse')}
        </button>
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
