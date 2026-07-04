import { useState } from 'react';
import { SettingsDialog } from '../components/SettingsDialog';
import { t } from '../i18n';
import { useStore } from '../store';

export function Title() {
  const goTo = useStore((s) => s.goTo);
  const loadFrom = useStore((s) => s.loadFrom);
  const hasAutosave = useStore((s) => s.hasAutosave)();
  const musicOn = useStore((s) => s.settings.musicOn);
  const voiceOn = useStore((s) => s.settings.voiceOn);
  const updateSettings = useStore((s) => s.updateSettings);
  // The landing keeps ONE plain switch: sound or silence. Players who want
  // just the narrator or just the bed split them apart in Settings.
  const soundOn = musicOn || voiceOn;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="title-screen">
      <div className="title-card">
        <p className="title-kicker">{t('app.workingTitleNote')}</p>
        <h1 className="title-name">{t('app.title')}</h1>
        <p className="title-tagline">{t('app.tagline')}</p>
        <div className="title-race" aria-hidden="true">
          <span className="title-race-bar title-race-you" />
          <span className="title-race-bar title-race-rival" />
        </div>
        <p className="title-hook">{t('title.hook')}</p>
        <ul className="title-features">
          <li>{t('title.feature.seats')}</li>
          <li>{t('title.feature.sources')}</li>
          <li>{t('title.feature.seed')}</li>
          <li>{t('title.feature.endings')}</li>
          <li>{t('title.feature.offline')}</li>
        </ul>
        <div className="title-actions">
          <button type="button" className="btn btn-primary btn-big" onClick={() => goTo('setup')}>
            {t('setup.newRun')}
          </button>
          {hasAutosave && (
            <button type="button" className="btn btn-big" onClick={() => loadFrom('auto')}>
              {t('setup.continueRun')}
            </button>
          )}
        </div>
        <p className="title-privacy">{t('footer.privacy')}</p>
        <div className="title-secondary">
          <button type="button" className="btn" onClick={() => goTo('help')}>
            {t('help.title.button')}
          </button>
          <button type="button" className="btn" onClick={() => goTo('prologue')}>
            {t('prologue.replay')}
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={soundOn}
            onClick={() => updateSettings({ musicOn: !soundOn, voiceOn: !soundOn })}
          >
            {soundOn ? t('title.sound.on') : t('title.sound.off')}
          </button>
          <button
            type="button"
            className="btn"
            aria-label={t('settings.heading')}
            onClick={() => setSettingsOpen(true)}
          >
            {t('settings.heading')}
          </button>
        </div>
      </div>
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}
