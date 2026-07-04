import { useEffect } from 'react';
import { parseShare } from '../engine/save';
import { t } from './i18n';
import { Debrief } from './screens/Debrief';
import { Help } from './screens/Help';
import { Game } from './screens/Game';
import { Prologue } from './screens/Prologue';
import { Setup } from './screens/Setup';
import { Sources } from './screens/Sources';
import { Title } from './screens/Title';
import { gameData, useStore } from './store';

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

  switch (screen) {
    case 'help':
      return <Help onBack={() => useStore.getState().goTo(useStore.getState().helpReturn)} />;
    case 'title':
      return <Title />;
    case 'setup':
      return <Setup />;
    case 'prologue':
      return <Prologue />;
    case 'game':
      return <Game />;
    case 'debrief':
      return <Debrief />;
    case 'sources':
      return <Sources />;
  }
}
