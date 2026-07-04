import type { EngineData } from '../../engine/data';
import type { GameState, PlayableSeatId } from '../../engine/types';
import { targetLabel } from '../format';
import { t, tRef } from '../i18n';

/**
 * Cabinet mandates: the near-term objectives that give the mid-game a pulse.
 * Delivered and lapsed mandates stay visible: the record IS the pressure.
 */
export function MandatesPanel({
  data,
  run,
  seat,
}: {
  data: EngineData;
  run: GameState;
  seat: PlayableSeatId;
}) {
  const seatMandates = run.seats[seat].mandates;
  if (seatMandates.length === 0) {
    return null;
  }
  const items = seatMandates.map((mandate) => ({
    mandate,
    def: data.mandates.mandates.find((d) => d.id === mandate.id)!,
  }));
  return (
    <section className="panel mandates" aria-labelledby="mandates-heading">
      <h2 id="mandates-heading" className="panel-heading">
        {t('mandates.heading')}
      </h2>
      <ul className="mandate-list">
        {items.map(({ mandate, def }) => {
          const goalLine =
            def.goal.comparator === '>='
              ? t('mandates.goalAtLeast', {
                  label: targetLabel(def.goal.target),
                  value: def.goal.value,
                })
              : t('mandates.goalAtMost', {
                  label: targetLabel(def.goal.target),
                  value: def.goal.value,
                });
          const statusLine =
            mandate.status === 'active'
              ? t('mandates.deadline', { turn: mandate.deadlineTurn })
              : mandate.status === 'met'
                ? t('mandates.met')
                : t('mandates.lapsed');
          return (
            <li key={mandate.id} className={`mandate mandate-${mandate.status}`}>
              <span className="mandate-title">{tRef(def.title)}</span>
              <span className="mandate-goal">
                {goalLine} · {statusLine}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
