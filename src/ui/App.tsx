import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { parseShare } from '../engine/save';
import { t } from './i18n';
import { Game } from './screens/Game';
import { Setup } from './screens/Setup';
import { Title } from './screens/Title';
import { gameData, useStore } from './store';

// Title, Setup and Game are the hot path and stay in the main chunk. The
// rest split out so a school Chromebook does not download the debrief, the
// prologue, the sources browser and the help glossary just to see the menu.
const Debrief = lazy(() => import('./screens/Debrief').then((m) => ({ default: m.Debrief })));
const Help = lazy(() => import('./screens/Help').then((m) => ({ default: m.Help })));
const Prologue = lazy(() => import('./screens/Prologue').then((m) => ({ default: m.Prologue })));
const Sources = lazy(() => import('./screens/Sources').then((m) => ({ default: m.Sources })));

export function App() {
  const screen = useStore((s) => s.screen);
  const startRun = useStore((s) => s.startRun);

  // Seed challenge links: #s=<seed>&p=<preset>&v=<dataVersion>
  useEffect(() => {
    const share = parseShare(location.hash);
    if (share) {
      history.replaceState(null, '', location.pathname);
      if (share.dataVersion === gameData().dataVersion) {
        startRun(share.seed, share.presetId);
      } else {
        // Honest refusal: different content would mean a different world.
        alert(t('error.shareVersion'));
      }
    }
  }, [startRun]);

  let view: ReactNode = null;
  switch (screen) {
    case 'help':
      view = <Help onBack={() => useStore.getState().goTo(useStore.getState().helpReturn)} />;
      break;
    case 'title':
      view = <Title />;
      break;
    case 'setup':
      view = <Setup />;
      break;
    case 'prologue':
      view = <Prologue />;
      break;
    case 'game':
      view = <Game />;
      break;
    case 'debrief':
      view = <Debrief />;
      break;
    case 'sources':
      view = <Sources />;
      break;
  }

  return (
    <Suspense fallback={<main className="screen-loading" aria-busy="true" />}>{view}</Suspense>
  );
}
