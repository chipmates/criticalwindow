/**
 * Browser-side content loader: every data file ships in the bundle via
 * import.meta.glob, validated through the same loadEngineData the tests use.
 * The dataVersion computed here matches the node side byte for byte (same
 * hash over the same relative paths), so saves and shares stay honest.
 */
import { loadEngineData, type EngineData } from '../engine/data';
import { hashDataFiles } from '../engine/hash';

function moduleDefault<T>(mod: unknown): T {
  return (mod as { default: T }).default;
}

const rawData: Record<string, unknown> = import.meta.glob('/data/**/*.json', {
  eager: true,
  query: '?raw',
});

function relPath(viteKey: string): string {
  return viteKey.replace('/data/', '');
}

const allFiles = Object.entries(rawData).map(([key, mod]) => ({
  path: relPath(key),
  content: moduleDefault<string>(mod),
}));

const files = allFiles.filter((f) => !f.path.startsWith('schemas/'));
const parse = (path: string): unknown => JSON.parse(files.find((f) => f.path === path)!.content);

let cached: EngineData | null = null;

export function loadGameData(): EngineData {
  if (!cached) {
    cached = loadEngineData({
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
  }
  return cached;
}
