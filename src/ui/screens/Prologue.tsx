import { useEffect, useRef, useState } from 'react';
import { evalCurve, divRound, mulDiv } from '../../engine/math';
import type { PrologueChapterData } from '../../engine/schemas';
import { playVoice, stopVoice } from '../audio';
import { AllocationControl } from '../components/AllocationControl';
import { targetLabel } from '../format';
import { t, tRef } from '../i18n';
import { loadPrologueData } from '../load-data';
import { gameData, useStore } from '../store';

/**
 * The 2023->2026 prologue: three scenes of real history, played through the
 * real controls, ending exactly on the state the player inherits. Founding
 * decision #9: the tutorial IS the backstory. Nothing here can fail; the
 * scary part is that everything after it can.
 */
export function Prologue() {
  const run = useStore((s) => s.run);
  const goTo = useStore((s) => s.goTo);
  const markPrologueSeen = useStore((s) => s.markPrologueSeen);
  const prologue = loadPrologueData();
  const data = gameData();
  const [stepIndex, setStepIndex] = useState(0); // 0 intro, 1..n chapters, n+1 outro
  const [pickedChoice, setPickedChoice] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const voiceOn = useStore((s) => s.settings.voiceOn);
  useEffect(() => {
    headingRef.current?.focus();
    const key =
      stepIndex === 0
        ? prologue.intro
        : stepIndex <= prologue.chapters.length
          ? prologue.chapters[stepIndex - 1]!.body
          : prologue.outro;
    playVoice(key.replace('strings:', ''), voiceOn);
    return stopVoice;
  }, [stepIndex, prologue, voiceOn]);

  const finish = (): void => {
    markPrologueSeen();
    goTo(run ? 'game' : 'setup');
  };
  const advance = (): void => {
    setPickedChoice(null);
    setStepIndex((i) => i + 1);
  };

  const chapterCount = prologue.chapters.length;
  const chapter: PrologueChapterData | null =
    stepIndex >= 1 && stepIndex <= chapterCount ? prologue.chapters[stepIndex - 1]! : null;

  const usaStart = data.scenario.seats.usa;
  const rndPoints = evalCurve(
    data.parameters.curves['rndCapacity']!,
    usaStart.resources.compute.value + usaStart.resources.talent.value,
  );

  const startStateRows = Object.entries(usaStart.resources).map(([key, sourced]) => ({
    label: targetLabel(key),
    value: sourced.value,
  }));

  return (
    <main className="prologue">
      <header className="prologue-head">
        <p className="title-kicker">{t('prologue.heading')}</p>
        <button type="button" className="btn prologue-skip" onClick={finish}>
          {t('prologue.skip')}
        </button>
      </header>

      {stepIndex === 0 && (
        <section className="panel prologue-step">
          <h1 className="prologue-title" tabIndex={-1} ref={headingRef}>
            {t('prologue.heading')}
          </h1>
          <p className="prologue-body">{tRef(prologue.intro)}</p>
          <div className="panel-actions">
            <button type="button" className="btn btn-primary" onClick={advance}>
              {t('prologue.next')}
            </button>
          </div>
        </section>
      )}

      {chapter && (
        <section className="panel prologue-step">
          <p className="prologue-date">{tRef(chapter.dateLabel)}</p>
          <h1 className="prologue-title" tabIndex={-1} ref={headingRef}>
            {tRef(chapter.title)}
          </h1>
          <p className="prologue-body">{tRef(chapter.body)}</p>

          <ul className="prologue-motion" aria-label={t('debrief.timeline')}>
            {chapter.trackMotion.map((motion) => (
              <li key={motion.target} className="prologue-motion-chip">
                {targetLabel(motion.target)} {motion.from} → {motion.to}
              </li>
            ))}
          </ul>

          <p className="prologue-explainer">{tRef(chapter.explainer)}</p>

          {chapter.teach === 'allocate' && (
            <AllocationControl
              initial={{
                capability: usaStart.allocation.capability,
                safety: usaStart.allocation.safety,
                diffusion: usaStart.allocation.diffusion,
              }}
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
              onCommit={advance}
            />
          )}

          {chapter.teach === 'policy' &&
            (() => {
              const card = data.policies.find((p) => p.id === chapter.mockPolicyId)!;
              return (
                <div className="prologue-policy">
                  <div className="policy-card">
                    <h2 className="policy-title">{tRef(card.title)}</h2>
                    <p className="policy-body">{tRef(card.body)}</p>
                    <p className="memo-sources">{card.sourceIds.join(' · ')}</p>
                  </div>
                  <div className="panel-actions">
                    <button type="button" className="btn btn-primary" onClick={advance}>
                      {t('phase.policy.play')}
                    </button>
                  </div>
                </div>
              );
            })()}

          {chapter.teach === 'memo' && (
            <div className="prologue-memo">
              {pickedChoice === null ? (
                <div className="memo-choices">
                  {(chapter.mockChoices ?? []).map((choice, index) => (
                    <button
                      key={index}
                      type="button"
                      className="memo-choice"
                      onClick={() => setPickedChoice(index)}
                    >
                      <span className="memo-choice-label">{tRef(choice.label)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <p className="prologue-response">
                    {tRef((chapter.mockChoices ?? [])[pickedChoice]!.response)}
                  </p>
                  <div className="panel-actions">
                    <button type="button" className="btn btn-primary" onClick={advance}>
                      {t('prologue.next')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <p className="memo-sources">{chapter.sourceIds.join(' · ')}</p>
        </section>
      )}

      {stepIndex === chapterCount + 1 && (
        <section className="panel prologue-step">
          <h1 className="prologue-title" tabIndex={-1} ref={headingRef}>
            {t('prologue.startState')}
          </h1>
          <p className="prologue-body">{tRef(prologue.outro)}</p>
          <ul className="prologue-motion">
            {startStateRows.map((row) => (
              <li key={row.label} className="prologue-motion-chip">
                {row.label} {row.value}
              </li>
            ))}
          </ul>
          <div className="panel-actions">
            <button type="button" className="btn btn-primary btn-big" onClick={finish}>
              {t('prologue.begin')}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
