import { useEffect, useRef, useState } from 'react';
import { divRound, evalCurve, mulDiv } from '../../engine/math';
import { eraForTurn } from '../../engine/step';
import { hashString } from '../../engine/hash';
import type { GameState } from '../../engine/types';
import { AllocationControl } from '../components/AllocationControl';
import { EvalBand } from '../components/EvalBand';
import { EventMemo } from '../components/EventMemo';
import { Meter } from '../components/Meter';
import { PolicyHand } from '../components/PolicyHand';
import { RaceTrack } from '../components/RaceTrack';
import { MandatesPanel } from '../components/MandatesPanel';
import { SettingsDialog } from '../components/SettingsDialog';
import { ShockOverlay } from '../components/ShockOverlay';
import { TurnReport } from '../components/TurnReport';
import { eraLabelKey, turnDate } from '../format';
import { t, tickerPool, type StringKey } from '../i18n';
import { gameData, useStore } from '../store';

/** Deterministic, replay-stable ticker line: hash(seed, turn) over the era pool. */
function tickerLine(seed: string, turn: number, era: 'early' | 'mid' | 'late'): string {
  const pool = tickerPool(era);
  return pool[hashString(`${seed}::ticker::${turn}`) % pool.length]!;
}

/**
 * Progressive disclosure (founding decision #5): turn one shows the race
 * track, the R&D loop and its two products. Every other meter surfaces the
 * first time it MOVES. Derived from the log, so it is deterministic and
 * replay-stable, and never touches the engine.
 */
type Disclosable =
  | 'energy'
  | 'talent'
  | 'capital'
  | 'publicTrust'
  | 'politicalCapital'
  | 'society'
  | 'rival'
  | 'eval';

const DISCLOSE_TOAST: Record<Disclosable, StringKey> = {
  energy: 'disclose.energy',
  talent: 'disclose.talent',
  capital: 'disclose.capital',
  publicTrust: 'disclose.publicTrust',
  politicalCapital: 'disclose.politicalCapital',
  society: 'disclose.society',
  rival: 'disclose.rival',
  eval: 'disclose.eval',
};

function revealedTracks(run: GameState): Set<Disclosable> {
  const revealed = new Set<Disclosable>();
  if (run.evalHistory.length > 0) {
    revealed.add('eval');
  }
  for (const entry of run.log) {
    for (const [target, delta] of Object.entries(entry.deltas ?? {})) {
      if (delta === 0) {
        continue;
      }
      if (target === 'energy' || target === 'talent' || target === 'capital') {
        revealed.add(target);
      } else if (target === 'publicTrust' || target === 'politicalCapital') {
        revealed.add(target);
      } else if (target.startsWith('society.')) {
        revealed.add('society');
      } else if (target.startsWith('rival.')) {
        revealed.add('rival');
      }
    }
  }
  return revealed;
}

export function Game() {
  const run = useStore((s) => s.run);
  const dispatch = useStore((s) => s.dispatch);
  const goTo = useStore((s) => s.goTo);
  const data = gameData();
  const liveRef = useRef<HTMLParagraphElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const shockAck = useStore((s) => s.shockAck);
  const ackShocks = useStore((s) => s.ackShocks);
  const [toasts, setToasts] = useState<Disclosable[]>([]);
  const knownTracks = useRef<Set<Disclosable> | null>(null);
  const knownSeed = useRef<string | null>(null);

  useEffect(() => {
    if (run && liveRef.current) {
      liveRef.current.textContent =
        run.phase === 'ended'
          ? t('a11y.runEnded', { ending: run.endingId ?? '' })
          : t('a11y.turnAdvanced', { turn: run.turn });
    }
  }, [run]);

  // Disclosure toasts: announce each track the first time it surfaces.
  useEffect(() => {
    if (!run) {
      return;
    }
    const revealed = revealedTracks(run);
    if (knownTracks.current === null || knownSeed.current !== run.seed) {
      // First render of a run (fresh or loaded): no back-announcements.
      knownTracks.current = revealed;
      knownSeed.current = run.seed;
      return;
    }
    const fresh = [...revealed].filter((track) => !knownTracks.current!.has(track));
    if (fresh.length > 0) {
      knownTracks.current = revealed;
      setToasts((current) => [...current, ...fresh]);
      window.setTimeout(() => {
        setToasts((current) => current.slice(fresh.length));
      }, 7000);
    }
  }, [run]);

  if (!run) {
    return null;
  }
  const revealed = revealedTracks(run);
  const shocks = run.log.filter(
    (entry) => entry.turn === run.turn && (entry.kind === 'incident' || entry.kind === 'wildcard'),
  );
  const shockKey = `${run.seed}:${run.turn}`;
  const showShocks =
    (run.phase === 'report' || run.phase === 'ended') && shocks.length > 0 && shockAck !== shockKey;

  const era = eraForTurn(data.parameters, run.turn);
  const date = turnDate(data.scenario.startTime, run.turn);
  const maxTurns = data.parameters.turnStructure.maxTurns.value;
  const report = run.evalHistory[run.evalHistory.length - 1];
  const bandWidth = report ? report.bandHigh - report.bandLow : 400;
  const rndPoints = evalCurve(
    data.parameters.curves['rndCapacity']!,
    run.resources.compute + run.resources.talent,
  );
  const prev = (target: string): number => {
    for (let i = run.log.length - 1; i >= 0; i -= 1) {
      const entry = run.log[i]!;
      if (entry.turn < run.turn - 1) {
        break; // trend means LAST quarter, not the last time it ever moved
      }
      if (entry.turn === run.turn - 1 && entry.deltas && target in entry.deltas) {
        return entry.deltas[target as keyof typeof entry.deltas] ?? 0;
      }
    }
    return 0;
  };

  return (
    <main className="game">
      <p ref={liveRef} className="visually-hidden" role="status" aria-live="polite" />

      <header className="game-head">
        <span className="game-brand">{t('app.title')}</span>
        <span className="game-clock">
          {t('hud.turn', { turn: run.turn, maxTurns })} ·{' '}
          {t('hud.date', { quarter: date.quarter, year: date.year })}
        </span>
        <span className="game-era">{t(eraLabelKey(era))}</span>
        <button
          type="button"
          className="btn"
          aria-label={t('help.title.button')}
          onClick={() => goTo('help')}
        >
          ?
        </button>
        <button
          type="button"
          className="btn"
          aria-label={t('settings.heading')}
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
      </header>

      <div className="wire" aria-label={t('a11y.tickerLabel')}>
        <span className="wire-masthead">{t('ticker.masthead')}</span>
        <span className="wire-line">{tickerLine(run.seed, run.turn, era)}</span>
      </div>

      <RaceTrack
        you={run.resources.capability}
        rival={run.rival.capability}
        fogFrom={data.parameters.thresholds.fogZoneStart.value}
        threshold={data.parameters.thresholds.capabilityThreshold.value}
        bandWidth={bandWidth}
      />

      <div className="game-grid">
        <div className="game-main">
          {run.phase === 'allocate' && (
            <AllocationControl
              initial={run.allocation}
              paused={run.flags.includes('forcedPause')}
              points={rndPoints}
              preview={(shares) => ({
                capabilityGain: evalCurve(
                  data.parameters.curves['capabilityPerRnd']!,
                  mulDiv(rndPoints, shares.capability, 100),
                ),
                insightGain: divRound(mulDiv(rndPoints, shares.safety, 100), 2),
                capitalIncome: mulDiv(
                  mulDiv(rndPoints, shares.diffusion, 100),
                  data.parameters.worldRules.upkeep.capitalIncomePerDiffusion.value,
                  100,
                ),
              })}
              onCommit={(a) => dispatch({ type: 'allocate', ...a })}
            />
          )}
          {run.phase === 'policy' && (
            <PolicyHand
              data={data}
              run={run}
              onPlay={(policyId) => dispatch({ type: 'playPolicy', policyId })}
              onSkip={() => dispatch({ type: 'skipPolicy' })}
            />
          )}
          {(run.phase === 'report' || run.phase === 'ended') && (
            <TurnReport
              data={data}
              run={run}
              onAdvance={() =>
                run.phase === 'ended' ? goTo('debrief') : dispatch({ type: 'advance' })
              }
            />
          )}
          {revealed.has('eval') && <EvalBand run={run} />}
        </div>

        <aside className="game-side" aria-label={t('dash.heading')}>
          <MandatesPanel data={data} run={run} />
          <h2 className="panel-heading">{t('dash.heading')}</h2>
          <Meter
            label={t('resource.compute.label')}
            value={run.resources.compute}
            token="--m-capital"
            trend={prev('compute')}
          />
          {revealed.has('energy') && (
            <Meter
              label={t('resource.energy.label')}
              value={run.resources.energy}
              token="--m-energy"
              trend={prev('energy')}
            />
          )}
          {revealed.has('talent') && (
            <Meter
              label={t('resource.talent.label')}
              value={run.resources.talent}
              token="--m-capital"
              trend={prev('talent')}
            />
          )}
          {revealed.has('capital') && (
            <Meter
              label={t('resource.capital.label')}
              value={run.resources.capital}
              token="--m-capital"
              trend={prev('capital')}
            />
          )}
          {revealed.has('publicTrust') && (
            <Meter
              label={t('resource.publicTrust.label')}
              value={run.resources.publicTrust}
              token="--m-trust"
              trend={prev('publicTrust')}
            />
          )}
          {revealed.has('politicalCapital') && (
            <Meter
              label={t('resource.politicalCapital.label')}
              value={run.resources.politicalCapital}
              token="--m-trust"
              trend={prev('politicalCapital')}
            />
          )}
          <Meter
            label={t('resource.capability.label')}
            value={run.resources.capability}
            token="--m-capability"
            trend={prev('capability')}
          />
          <Meter
            label={t('resource.safetyInsight.label')}
            value={run.resources.safetyInsight}
            token="--m-safety"
            trend={prev('safetyInsight')}
          />
          {revealed.has('society') && (
            <>
              <h2 className="panel-heading side-sub">{t('society.jobDisplacement.label')}</h2>
              <Meter
                label={t('society.jobDisplacement.label')}
                value={run.society.jobDisplacement}
                token="--m-unrest"
                trend={prev('society.jobDisplacement')}
              />
              <Meter
                label={t('society.unrest.label')}
                value={run.society.unrest}
                token="--m-unrest"
                trend={prev('society.unrest')}
              />
            </>
          )}
          {revealed.has('rival') && (
            <>
              <h2 className="panel-heading side-sub">{t('race.rival')}</h2>
              <Meter
                label={t('rival.capability.label')}
                value={run.rival.capability}
                token="--m-rival"
                trend={prev('rival.capability')}
              />
              <Meter
                label={t('rival.trust.label')}
                value={run.rival.trust}
                token="--m-trust"
                trend={prev('rival.trust')}
              />
              <Meter
                label={t('rival.substitution.label')}
                value={run.rival.substitution}
                token="--m-rival"
                trend={prev('rival.substitution')}
              />
            </>
          )}
        </aside>
      </div>

      {toasts.length > 0 && (
        <div className="disclose-toasts" role="status" aria-live="polite">
          {toasts.map((track, i) => (
            <p key={`${track}-${i}`} className="disclose-toast">
              {t(DISCLOSE_TOAST[track])}
            </p>
          ))}
        </div>
      )}

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {run.phase === 'event' && (
        <EventMemo
          data={data}
          run={run}
          onChoose={(eventId, choiceIndex) =>
            dispatch({ type: 'resolveEventChoice', eventId, choiceIndex })
          }
        />
      )}
      {showShocks && (
        <ShockOverlay
          data={data}
          run={run}
          shocks={shocks}
          onContinue={() => ackShocks(shockKey)}
        />
      )}
    </main>
  );
}
