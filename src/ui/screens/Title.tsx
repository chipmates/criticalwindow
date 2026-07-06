import { useState } from 'react';
import { SettingsDialog } from '../components/SettingsDialog';
import { t } from '../i18n';
import { hintSeen, markHint } from '../storage';
import { useStore } from '../store';

export function Title() {
  const goTo = useStore((s) => s.goTo);
  const loadFrom = useStore((s) => s.loadFrom);
  const hasAutosave = useStore((s) => s.hasAutosave)();
  const liveRun = useStore((s) => s.run);
  const staleSaveSeed = useStore((s) => s.staleSaveSeed);
  const musicOn = useStore((s) => s.settings.musicOn);
  const voiceOn = useStore((s) => s.settings.voiceOn);
  const updateSettings = useStore((s) => s.updateSettings);
  // The landing keeps ONE plain switch: sound or silence. Players who want
  // just the narrator or just the bed split them apart in Settings.
  const soundOn = musicOn || voiceOn;
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Sound is off by default out of respect; the offer is the one nudge, shown
  // once. It rides the same first-run hint flags as every other one-time note.
  const [soundOfferOpen, setSoundOfferOpen] = useState(() => !hintSeen('soundOffer'));
  const dismissSoundOffer = (): void => {
    markHint('soundOffer');
    setSoundOfferOpen(false);
  };

  return (
    <main className="title-screen">
      <div className="title-card">
        <svg
          className="title-mark"
          viewBox="72 72 368 368"
          width="56"
          height="56"
          aria-hidden="true"
        >
          <path d="M72 72 H 226 L 302 440 H 72 Z" fill="var(--ink)" />
          <path d="M440 72 H 306 L 330 440 H 440 Z" fill="var(--ink)" />
          <path d="M226 72 H 306 L 330 440 H 302 Z" fill="var(--accent)" />
        </svg>
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
          {liveRun && (
            <button
              type="button"
              className="btn btn-primary btn-big"
              onClick={() => goTo(liveRun.phase === 'ended' ? 'debrief' : 'game')}
            >
              {liveRun.phase === 'ended' ? t('title.resumeDebrief') : t('title.resumeRun')}
            </button>
          )}
          <button
            type="button"
            className={liveRun ? 'btn btn-big' : 'btn btn-primary btn-big'}
            onClick={() => goTo('setup')}
          >
            {t('setup.newRun')}
          </button>
          {hasAutosave && !staleSaveSeed && (
            <button type="button" className="btn btn-big" onClick={() => loadFrom('auto')}>
              {t('setup.continueRun')}
            </button>
          )}
        </div>
        {staleSaveSeed && (
          <p className="title-stale-save">{t('title.staleSave', { seed: staleSaveSeed })}</p>
        )}
        {soundOfferOpen && (
          <div className="sound-offer" role="group" aria-label={t('title.soundOffer')}>
            <p className="sound-offer-text">{t('title.soundOffer')}</p>
            <div className="sound-offer-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  updateSettings({ musicOn: true, voiceOn: true });
                  dismissSoundOffer();
                }}
              >
                {t('title.soundOn')}
              </button>
              <button type="button" className="btn-link" onClick={dismissSoundOffer}>
                {t('title.soundNotNow')}
              </button>
            </div>
          </div>
        )}
        <p className="title-privacy">
          {t('footer.privacy')}{' '}
          <a href={t('app.repoUrl')} target="_blank" rel="noopener noreferrer">
            {t('title.github')}
          </a>{' '}
          · <a href="/imprint.html">{t('title.imprint')}</a> ·{' '}
          <a href="/privacy.html">{t('title.privacyPage')}</a>
        </p>
        <nav className="title-links" aria-label="More">
          <button type="button" className="btn-link" onClick={() => goTo('help')}>
            {t('help.title.button')}
          </button>
          <button type="button" className="btn-link" onClick={() => goTo('prologue')}>
            {t('prologue.replay')}
          </button>
          <button type="button" className="btn-link" onClick={() => goTo('sources')}>
            {t('title.sources')}
          </button>
          <button
            type="button"
            className="btn-link"
            aria-pressed={soundOn}
            onClick={() => updateSettings({ musicOn: !soundOn, voiceOn: !soundOn })}
          >
            {soundOn ? t('title.sound.on') : t('title.sound.off')}
          </button>
          <button type="button" className="btn-link" onClick={() => setSettingsOpen(true)}>
            {t('settings.heading')}
          </button>
        </nav>
      </div>
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}
