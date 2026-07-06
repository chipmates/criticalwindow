import { useEffect, useRef } from 'react';
import type { EngineData } from '../../engine/data';
import type { GameState } from '../../engine/types';
import { playVoice, stopVoice } from '../audio';
import { Hint } from './Hint';
import { TagStamp } from './TagStamp';
import { delayedSummary, effectSummary, turnDate } from '../format';
import sourcesJson from '../../../data/sources.json';
import { t, tRef } from '../i18n';
import { useStore } from '../store';

const SOURCE_TITLE = new Map(
  (sourcesJson as { sources: Array<{ id: string; title: string }> }).sources.map((s) => [
    s.id,
    s.title,
  ]),
);

interface EventMemoProps {
  data: EngineData;
  run: GameState;
  onChoose: (eventId: string, choiceIndex: number) => void;
}

/**
 * The priority memo. A forced decision: no dismiss, no escape, exactly like
 * the situation it models. Focus moves into the dialog and stays until a
 * choice is made.
 */
export function EventMemo({ data, run, onChoose }: EventMemoProps) {
  const pending = run.seats[run.actingSeat].pendingEvents[0];
  const voiceOn = useStore((s) => s.settings.voiceOn);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const card = pending ? data.events.find((e) => e.id === pending.eventId) : null;
    if (card) {
      playVoice(card.body.replace('strings:', ''), voiceOn);
    }
    return stopVoice;
  }, [pending?.eventId, pending, data, voiceOn]);

  if (!pending) {
    return null;
  }
  const card = data.events.find((e) => e.id === pending.eventId)!;
  if (card.kind === 'wildcard') {
    return null; // wildcards never enter pendingEvents; they land in the report
  }
  const date = turnDate(data.scenario.startTime, run.turn);

  return (
    <div className="memo-backdrop">
      <section className="memo" role="dialog" aria-modal="true" aria-labelledby="memo-title">
        <div className="memo-masthead">
          <span>
            {t('phase.event.heading')} · {date.quarter} {date.year}
          </span>
          <TagStamp tags={card.tags} />
        </div>
        <h2 id="memo-title" className="memo-title" tabIndex={-1} ref={headingRef}>
          {tRef(card.title)}
        </h2>
        <p className="memo-body">{tRef(card.body)}</p>
        <Hint id="memo" />
        <div className="memo-choices">
          {card.choices.map((choice, index) => (
            <button
              key={index}
              type="button"
              className="memo-choice"
              onClick={() => onChoose(card.id, index)}
            >
              <span className="memo-choice-label">{tRef(choice.label)}</span>
              <span className="memo-choice-effects">
                {[...effectSummary(choice.effects), ...delayedSummary(choice.delayedEffects)].join(
                  ' · ',
                )}
              </span>
            </button>
          ))}
        </div>
        <p className="memo-sources">
          {card.sourceIds.map((id) => SOURCE_TITLE.get(id) ?? id).join(' · ')}
        </p>
      </section>
    </div>
  );
}
