/**
 * Browser-side determinism harness. Loaded by /determinism.html via the Vite
 * dev server. Replays every committed golden fixture with the REAL engine
 * inside the actual browser JS engine and publishes the hashes on window.
 * The Playwright spec compares them across Chromium, Firefox and WebKit:
 * if any hash differs, the engine leaked implementation-defined behavior.
 */
import { loadEngineData } from '../../src/engine/data';
import { hashDataFiles, hashJsonValue } from '../../src/engine/hash';
import { initGame } from '../../src/engine/init';
import { step } from '../../src/engine/step';
import type { Action, WorldviewPresetId } from '../../src/engine/types';

interface GoldenFixture {
  name: string;
  seed: string;
  presetId: WorldviewPresetId;
  actions: Action[];
}

const rawData = import.meta.glob('/data/**/*.json', { eager: true, query: '?raw' }) as Record<
  string,
  { default: string }
>;
const goldenModules = import.meta.glob('/tests/golden/*.json', { eager: true }) as Record<
  string,
  { default: GoldenFixture }
>;

function relPath(viteKey: string): string {
  return viteKey.replace('/data/', '');
}

const files = Object.entries(rawData)
  .filter(([key]) => !key.includes('/schemas/'))
  .map(([key, mod]) => ({ path: relPath(key), content: mod.default }));
// dataVersion hashes ALL data files incl. schemas, matching the node side.
const allFiles = Object.entries(rawData).map(([key, mod]) => ({
  path: relPath(key),
  content: mod.default,
}));

const parse = (path: string): unknown => JSON.parse(files.find((f) => f.path === path)!.content);

const data = loadEngineData({
  dataVersion: hashDataFiles(allFiles),
  parameters: parse('parameters.json'),
  scenario: parse('scenarios/scenario_2026.json'),
  events: files
    .filter((f) => f.path.startsWith('events/'))
    .map((f) => ({ name: f.path, json: JSON.parse(f.content) as unknown })),
  policies: files
    .filter((f) => f.path.startsWith('policies/'))
    .map((f) => ({ name: f.path, json: JSON.parse(f.content) as unknown })),
});

const results: Record<string, { perTurnHashes: string[]; finalHash: string }> = {};

for (const mod of Object.values(goldenModules)) {
  const golden = mod.default;
  let state = initGame(data, { seed: golden.seed, presetId: golden.presetId });
  const perTurnHashes: string[] = [];
  let lastTurn = 0;
  for (const action of golden.actions) {
    state = step(data, state, action);
    const turnEnded = state.phase === 'report' || state.phase === 'ended';
    if (turnEnded && state.turn > lastTurn) {
      perTurnHashes.push(hashJsonValue(state));
      lastTurn = state.turn;
    }
  }
  results[golden.name] = { perTurnHashes, finalHash: hashJsonValue(state) };
}

declare global {
  interface Window {
    __GOLDEN_RESULTS__?: Record<string, { perTurnHashes: string[]; finalHash: string }>;
    __GOLDEN_DATAVERSION__?: string;
  }
}

window.__GOLDEN_RESULTS__ = results;
window.__GOLDEN_DATAVERSION__ = data.dataVersion;
