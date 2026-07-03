import { useEffect, useRef, useState } from 'react';
import { readSlot, SAVE_SLOTS, clearSlot, type SaveSlot, type Settings } from '../storage';
import { t, type StringKey } from '../i18n';
import { useStore } from '../store';

interface SettingsDialogProps {
  onClose: () => void;
}

function OptionRow<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; labelKey: StringKey }>;
  onPick: (id: T) => void;
}) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div className="settings-options" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.id === value}
            className={option.id === value ? 'btn settings-on' : 'btn'}
            onClick={() => onPick(option.id)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

function slotSummary(slot: SaveSlot): string {
  const raw = readSlot(slot) as { actions?: unknown[] } | null;
  if (!raw) {
    return t('saves.empty');
  }
  const count = Array.isArray(raw.actions) ? raw.actions.length : 0;
  return t('saves.turnLabel', {
    turn: Math.max(1, Math.ceil(count / 4)),
    ending: t('saves.inProgress'),
  });
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const saveTo = useStore((s) => s.saveTo);
  const loadFrom = useStore((s) => s.loadFrom);
  const run = useStore((s) => s.run);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [, bump] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.querySelector('button')?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const patch = (p: Partial<Settings>): void => updateSettings(p);

  return (
    <div className="memo-backdrop">
      <div
        ref={dialogRef}
        className="memo settings"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.heading')}
      >
        <div className="settings-head">
          <h2>{t('settings.heading')}</h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <OptionRow
          label={t('settings.theme')}
          value={settings.theme}
          options={[
            { id: 'auto', labelKey: 'settings.theme.auto' },
            { id: 'light', labelKey: 'settings.theme.light' },
            { id: 'dark', labelKey: 'settings.theme.dark' },
            { id: 'contrast', labelKey: 'settings.theme.contrast' },
          ]}
          onPick={(theme) => patch({ theme })}
        />
        <OptionRow
          label={t('settings.motion')}
          value={settings.reducedMotion}
          options={[
            { id: 'auto', labelKey: 'settings.motion.auto' },
            { id: 'on', labelKey: 'settings.motion.on' },
          ]}
          onPick={(reducedMotion) => patch({ reducedMotion })}
        />
        <OptionRow
          label={t('settings.textSize')}
          value={settings.textSize}
          options={[
            { id: 'normal', labelKey: 'settings.textSize.normal' },
            { id: 'large', labelKey: 'settings.textSize.large' },
          ]}
          onPick={(textSize) => patch({ textSize })}
        />

        <section aria-label={t('saves.heading')} className="settings-saves">
          <h3 className="panel-heading">{t('saves.heading')}</h3>
          {SAVE_SLOTS.filter((slot) => slot !== 'auto').map((slot, i) => (
            <div key={slot} className="settings-row">
              <span className="settings-label">
                {t('saves.slot', { n: i + 1 })}
                <span className="settings-slot-state"> · {slotSummary(slot)}</span>
              </span>
              <div className="settings-options">
                {run && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      saveTo(slot);
                      bump((n) => n + 1);
                    }}
                  >
                    {t('saves.save')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn"
                  disabled={readSlot(slot) === null}
                  onClick={() => {
                    const error = loadFrom(slot);
                    if (error === null) {
                      onClose();
                    } else {
                      setLoadError(
                        error === 'dataVersionMismatch'
                          ? t('error.saveMismatch')
                          : t('error.saveCorrupt'),
                      );
                    }
                  }}
                >
                  {t('saves.load')}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={readSlot(slot) === null}
                  onClick={() => {
                    clearSlot(slot);
                    bump((n) => n + 1);
                  }}
                >
                  {t('saves.delete')}
                </button>
              </div>
            </div>
          ))}
          {loadError && <p className="settings-error">{loadError}</p>}
        </section>

        <p className="panel-explain">{t('settings.audio.credit')}</p>
      </div>
    </div>
  );
}
