/**
 * Browser-side determinism harness. Loaded by /determinism.html via the Vite
 * dev server. Replays every committed golden fixture with the REAL engine
 * inside the actual browser JS engine and publishes the hashes on window.
 * The Playwright spec compares them across Chromium, Firefox and WebKit:
 * if any hash differs, the engine leaked implementation-defined behavior.
 */
import { loadEngineData } from '../engine/data';
import { hashDataFiles, hashJsonValue } from '../engine/hash';
import { initGame } from '../engine/init';
import { step } from '../engine/step';
import type { Action, WorldviewPresetId } from '../engine/types';

interface GoldenFixture {
  name: string;
  seed: string;
  presetId: WorldviewPresetId;
  actions: Action[];
}

// import.meta.glob returns unknown module shapes; narrow them structurally.
function moduleDefault<T>(mod: unknown): T {
  return (mod as { default: T }).default;
}

const rawData: Record<string, unknown> = import.meta.glob('/data/**/*.json', {
  eager: true,
  query: '?raw',
});
const goldenModules: Record<string, unknown> = import.meta.glob('/tests/golden/*.json', {
  eager: true,
});

function relPath(viteKey: string): string {
  return viteKey.replace('/data/', '');
}

const files = Object.entries(rawData)
  .filter(([key]) => !key.includes('/schemas/'))
  .map(([key, mod]) => ({ path: relPath(key), content: moduleDefault<string>(mod) }));
// dataVersion hashes ALL data files incl. schemas, matching the node side.
const allFiles = Object.entries(rawData).map(([key, mod]) => ({
  path: relPath(key),
  content: moduleDefault<string>(mod),
}));

const parse = (path: string): unknown => JSON.parse(files.find((f) => f.path === path)!.content);

const data = loadEngineData({
  dataVersion: hashDataFiles(allFiles),
  parameters: parse('parameters.json'),
  scenario: parse('scenarios/scenario_2026.json'),
  incidents: parse('incidents.json'),
  mandates: parse('mandates.json'),
  events: files
    .filter((f) => f.path.startsWith('events/'))
    .map((f) => ({ name: f.path, json: JSON.parse(f.content) as unknown })),
  policies: files
    .filter((f) => f.path.startsWith('policies/'))
    .map((f) => ({ name: f.path, json: JSON.parse(f.content) as unknown })),
});

const results: Record<string, { perTurnHashes: string[]; finalHash: string }> = {};

for (const mod of Object.values(goldenModules)) {
  const golden = moduleDefault<GoldenFixture>(mod);
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
