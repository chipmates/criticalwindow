/**
 * pnpm golden — regenerate the committed golden fixtures.
 *
 * A golden fixture pins (seed, preset, bot) to the canonical state hash at
 * the end of every turn. Any engine or data change that alters a replay
 * shows up as a hash diff in tests/golden/*.json: balance drift becomes a
 * reviewable artifact instead of a silent change. Regenerating goldens is
 * a deliberate act that belongs in the same commit as the change (and, for
 * data changes, its source ids).
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runBot, type BotId } from '../src/engine/bots';
import { loadEngineData } from '../src/engine/data';
import { hashDataFiles, hashJsonValue } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import { step } from '../src/engine/step';
import type { WorldviewPresetId } from '../src/engine/types';
import { dataRoot, readDataFiles } from './lib/data-files';

const FIXTURES: Array<{ name: string; seed: string; presetId: WorldviewPresetId; bot: BotId }> = [
  { name: 'golden-1-consensus-hedger', seed: 'golden-1', presetId: 'consensus', bot: 'hedger' },
  { name: 'golden-2-cautious-racer', seed: 'golden-2', presetId: 'cautious', bot: 'racer' },
  { name: 'golden-3-skeptic-dove', seed: 'golden-3', presetId: 'skeptic', bot: 'dove' },
  { name: 'golden-4-consensus-chaos', seed: 'golden-4', presetId: 'consensus', bot: 'chaos' },
  { name: 'golden-5-skeptic-racer', seed: 'golden-5', presetId: 'skeptic', bot: 'racer' },
];

const files = readDataFiles(dataRoot());
const json = (rel: string): unknown =>
  JSON.parse(readFileSync(files.find((f) => f.relPath === rel)!.absPath, 'utf8'));
const data = loadEngineData({
  dataVersion: hashDataFiles(files.map((f) => ({ path: f.relPath, content: f.content }))),
  parameters: json('parameters.json'),
  scenario: json('scenarios/scenario_2026.json'),
  events: files
    .filter((f) => f.relPath.startsWith('events/'))
    .map((f) => ({ name: f.relPath, json: JSON.parse(f.content) as unknown })),
  policies: files
    .filter((f) => f.relPath.startsWith('policies/'))
    .map((f) => ({ name: f.relPath, json: JSON.parse(f.content) as unknown })),
});

const outDir = new URL('../tests/golden', import.meta.url).pathname;

for (const fixture of FIXTURES) {
  // Drive the bot to get the action list, then re-fold recording hashes.
  const initial = initGame(data, { seed: fixture.seed, presetId: fixture.presetId });
  const run = runBot(data, initial, fixture.bot);

  let state = initGame(data, { seed: fixture.seed, presetId: fixture.presetId });
  const perTurnHashes: string[] = [];
  let lastTurn = 0;
  for (const action of run.actions) {
    state = step(data, state, action);
    const turnEnded = state.phase === 'report' || state.phase === 'ended';
    if (turnEnded && state.turn > lastTurn) {
      perTurnHashes.push(hashJsonValue(state));
      lastTurn = state.turn;
    }
  }

  const golden = {
    name: fixture.name,
    dataVersion: data.dataVersion,
    seed: fixture.seed,
    presetId: fixture.presetId,
    bot: fixture.bot,
    endingId: run.endingId,
    turns: run.turns,
    actions: run.actions,
    perTurnHashes,
    finalHash: hashJsonValue(run.finalState),
  };
  writeFileSync(join(outDir, `${fixture.name}.json`), `${JSON.stringify(golden, null, 2)}\n`);
  console.log(
    `golden: ${fixture.name} -> ${run.endingId} in ${run.turns} turns, ${perTurnHashes.length} turn hashes`,
  );
}
