import { t } from '../i18n';
import { useStore } from '../store';

export function Title() {
  const goTo = useStore((s) => s.goTo);
  const loadFrom = useStore((s) => s.loadFrom);
  const hasAutosave = useStore((s) => s.hasAutosave)();

  return (
    <main className="title-screen">
      <div className="title-card">
        <p className="title-kicker">{t('app.workingTitleNote')}</p>
        <h1 className="title-name">{t('app.title')}</h1>
        <p className="title-tagline">{t('app.tagline')}</p>
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
      </div>
    </main>
  );
}
