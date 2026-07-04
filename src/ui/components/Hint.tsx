import { useState } from 'react';
import { t, type StringKey } from '../i18n';
import { hintSeen, markHint } from '../storage';

/**
 * A first-run hint: one calm sentence, shown once ever, dismissed forever.
 * Never a lecture; the lesson lives in the mechanics (70/30 rule).
 */
export function Hint({ id }: { id: string }) {
  const [visible, setVisible] = useState(() => !hintSeen(id));
  if (!visible) {
    return null;
  }
  return (
    <aside className="hint" role="note">
      <p>{t(`hint.${id}` as StringKey)}</p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          markHint(id);
          setVisible(false);
        }}
      >
        {t('hint.dismiss')}
      </button>
    </aside>
  );
}
