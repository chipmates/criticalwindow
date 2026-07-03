import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { hashJsonValue } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import { step } from '../src/engine/step';
import type { Action, WorldviewPresetId } from '../src/engine/types';
import { loadRealData } from './helpers/load-real-data';

interface Golden {
  name: string;
  dataVersion: string;
  seed: string;
  presetId: WorldviewPresetId;
  endingId: string;
  turns: number;
  actions: Action[];
  perTurnHashes: string[];
  finalHash: string;
}

const data = loadRealData();
const goldenDir = join(__dirname, 'golden');
const goldens = readdirSync(goldenDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(goldenDir, f), 'utf8')) as Golden);

describe('golden fixtures (balance drift becomes a visible diff)', () => {
  test('five fixtures exist and match the current content version', () => {
    expect(goldens.length).toBe(5);
    for (const golden of goldens) {
      // Data changed but goldens were not regenerated: that is a failing
      // state on purpose. Run pnpm golden IN THE SAME COMMIT as the change.
      expect(golden.dataVersion, `${golden.name}: run pnpm golden after data changes`).toBe(
        data.dataVersion,
      );
    }
  });

  for (const golden of goldens) {
    test(`${golden.name ?? 'fixture'} replays hash-exact at every turn`, () => {
      let state = initGame(data, { seed: golden.seed, presetId: golden.presetId });
      const hashes: string[] = [];
      let lastTurn = 0;
      for (const action of golden.actions) {
        state = step(data, state, action);
        const turnEnded = state.phase === 'report' || state.phase === 'ended';
        if (turnEnded && state.turn > lastTurn) {
          hashes.push(hashJsonValue(state));
          lastTurn = state.turn;
        }
      }
      expect(hashes).toEqual(golden.perTurnHashes);
      expect(hashJsonValue(state)).toBe(golden.finalHash);
      expect(state.endingId).toBe(golden.endingId);
    });
  }
});
