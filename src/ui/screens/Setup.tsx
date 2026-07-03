import { useState } from 'react';
import type { WorldviewPresetId } from '../../engine/types';
import { WORLDVIEW_PRESET_IDS } from '../../engine/types';
import { t, tRef } from '../i18n';
import { gameData, useStore } from '../store';

const WORDS_A = ['amber', 'cobalt', 'quiet', 'rapid', 'northern', 'late', 'clear', 'red'];
const WORDS_B = ['window', 'signal', 'harbor', 'ledger', 'summit', 'circuit', 'meridian', 'garden'];

function rollSeed(): string {
  const pick = (list: string[]): string => list[Math.floor(Math.random() * list.length)]!;
  return `${pick(WORDS_A)}-${pick(WORDS_B)}-${Math.floor(Math.random() * 900) + 100}`;
}

export function Setup() {
  const startRun = useStore((s) => s.startRun);
  const goTo = useStore((s) => s.goTo);
  const [presetId, setPresetId] = useState<WorldviewPresetId>('consensus');
  const [seed, setSeed] = useState(rollSeed());
  const data = gameData();

  return (
    <main className="setup-screen">
      <header className="setup-head">
        <h1>{t('setup.heading')}</h1>
        <p className="panel-explain">{t('setup.presetExplain')}</p>
      </header>

      <div className="preset-grid" role="radiogroup" aria-label={t('setup.heading')}>
        {WORLDVIEW_PRESET_IDS.map((id) => {
          const preset = data.parameters.worldviewPresets[id];
          const selected = id === presetId;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? 'preset-card preset-selected' : 'preset-card'}
              onClick={() => setPresetId(id)}
            >
              <h2 className="preset-name">{tRef(preset.label)}</h2>
              <p className="preset-desc">{tRef(preset.description)}</p>
              <p className="preset-sources">
                {[
                  ...new Set([
                    ...preset.alignmentDifficulty.sourceIds,
                    ...preset.takeoffSteepness.sourceIds,
                  ]),
                ].join(' · ')}
              </p>
            </button>
          );
        })}
      </div>
      <p className="setup-sources-note">{t('setup.sourcesNote')}</p>

      <div className="seed-row">
        <label htmlFor="seed-input" className="seed-label">
          {t('setup.seedLabel')}
        </label>
        <input
          id="seed-input"
          className="seed-input"
          value={seed}
          maxLength={64}
          onChange={(e) => setSeed(e.target.value)}
        />
        <button type="button" className="btn" onClick={() => setSeed(rollSeed())}>
          {t('setup.seedRandom')}
        </button>
      </div>
      <p className="panel-explain">{t('setup.seedExplain')}</p>

      <div className="panel-actions setup-actions">
        <button type="button" className="btn" onClick={() => goTo('title')}>
          ←
        </button>
        <button
          type="button"
          className="btn btn-primary btn-big"
          disabled={seed.trim().length === 0}
          onClick={() => startRun(seed.trim(), presetId)}
        >
          {t('setup.begin')}
        </button>
      </div>
    </main>
  );
}
