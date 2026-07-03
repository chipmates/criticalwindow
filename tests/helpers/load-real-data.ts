/**
 * Test helper: load the REAL game data from data/ (what the shipped game
 * runs). Engine tests run against real content so a data change that breaks
 * the engine fails here, not in a browser.
 */
import { readFileSync } from 'node:fs';
import { loadEngineData, type EngineData } from '../../src/engine/data';
import { hashDataFiles } from '../../src/engine/hash';
import { dataRoot, readDataFiles } from '../../scripts/lib/data-files';

let cached: EngineData | null = null;

export function loadRealData(): EngineData {
  if (cached) {
    return cached;
  }
  const files = readDataFiles(dataRoot());
  const json = (rel: string): unknown =>
    JSON.parse(readFileSync(files.find((f) => f.relPath === rel)!.absPath, 'utf8'));
  cached = loadEngineData({
    dataVersion: hashDataFiles(files.map((f) => ({ path: f.relPath, content: f.content }))),
    parameters: json('parameters.json'),
    scenario: json('scenarios/scenario_2026.json'),
    events: files
      .filter((f) => f.relPath.startsWith('events/'))
      .map((f) => ({
        name: f.relPath.slice('events/'.length),
        json: JSON.parse(f.content) as unknown,
      })),
    policies: files
      .filter((f) => f.relPath.startsWith('policies/'))
      .map((f) => ({
        name: f.relPath.slice('policies/'.length),
        json: JSON.parse(f.content) as unknown,
      })),
  });
  return cached;
}
