import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { BOT_IDS, runBot } from '../src/engine/bots';
import { canonicalJson } from '../src/engine/hash';
import { initGame } from '../src/engine/init';
import { runProbes } from '../src/engine/probes';
import {
  SaveError,
  buildSave,
  encodeShare,
  loadSave,
  parseShare,
  undoOnce,
} from '../src/engine/save';
import { loadRealData } from './helpers/load-real-data';

const data = loadRealData();

describe('save round-trips (property)', () => {
  test('bot runs survive save -> JSON -> load exactly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 24 }).filter((s) => s.trim().length > 0),
        fc.constantFrom(...BOT_IDS),
        fc.constantFrom('cautious', 'consensus', 'skeptic'),
        (seed, bot, presetId) => {
          const initial = initGame(data, { seed, presetId });
          const run = runBot(data, initial, bot);
          const save = buildSave(data, { seed, presetId }, run.actions);
          const thawed = JSON.parse(JSON.stringify(save)) as unknown;
          const loaded = loadSave(data, thawed);
          return canonicalJson(loaded.state) === canonicalJson(run.finalState);
        },
      ),
      { numRuns: 25 },
    );
  });

  test('undo replays minus the last action', () => {
    const seed = 'undo-check';
    const initial = initGame(data, { seed, presetId: 'consensus' });
    const run = runBot(data, initial, 'hedger');
    const save = buildSave(data, { seed, presetId: 'consensus' }, run.actions);
    const undone = undoOnce(data, save);
    expect(undone.actions.length).toBe(run.actions.length - 1);
    expect(undone.state.phase).not.toBe('ended');
  });
});

describe('save honesty', () => {
  test('different content is refused, not silently diverged', () => {
    const initial = initGame(data, { seed: 'v-check', presetId: 'consensus' });
    const run = runBot(data, initial, 'dove');
    const save = buildSave(data, { seed: 'v-check', presetId: 'consensus' }, run.actions);
    const tampered = { ...save, dataVersion: 'someone-elses-content' };
    expect(() => loadSave(data, tampered)).toThrowError(SaveError);
    try {
      loadSave(data, tampered);
    } catch (error) {
      expect((error as SaveError).code).toBe('dataVersionMismatch');
    }
  });

  test('garbage is malformed, not a crash', () => {
    expect(() => loadSave(data, { hello: 'world' })).toThrowError(SaveError);
    try {
      loadSave(data, 42);
    } catch (error) {
      expect((error as SaveError).code).toBe('malformed');
    }
  });
});

describe('share codes', () => {
  test('encode/parse round-trip incl. url-hostile seeds', () => {
    const share = {
      seed: 'my seed & friend=?',
      presetId: 'skeptic' as const,
      dataVersion: data.dataVersion,
    };
    expect(parseShare(encodeShare(share))).toEqual(share);
  });

  test('rejects malformed and oversized codes', () => {
    expect(parseShare('#s=&p=consensus&v=x')).toBeNull();
    expect(parseShare('#s=ok&p=notapreset&v=x')).toBeNull();
    expect(parseShare('nonsense')).toBeNull();
    expect(parseShare(`#s=${'x'.repeat(80)}&p=consensus&v=x`)).toBeNull();
  });
});

describe('debrief probes on known histories', () => {
  test('a dove run opens the treaty window (incl. the signing turn)', () => {
    // The dove bot plays compute_treaty_feeler on cooldown and keeps trust
    // rising; the window opens and is usually taken the same world update.
    for (const seed of ['probe-dove-1', 'probe-dove-2', 'probe-dove-3']) {
      const initial = initGame(data, { seed, presetId: 'skeptic' });
      const run = runBot(data, initial, 'dove');
      const probes = runProbes(data, { seed, presetId: 'skeptic' }, run.actions);
      if (probes.treatyWindowOpen.turns.length > 0) {
        expect(Math.min(...probes.treatyWindowOpen.turns)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...probes.treatyWindowOpen.turns)).toBeLessThanOrEqual(16);
        return;
      }
    }
    throw new Error('no dove seed opened a treaty window; probe or balance regression');
  });

  test('a racer run underinvests in safety while the band is wide', () => {
    const seed = 'probe-racer';
    const initial = initGame(data, { seed, presetId: 'cautious' });
    const run = runBot(data, initial, 'racer');
    const probes = runProbes(data, { seed, presetId: 'cautious' }, run.actions);
    expect(probes.safetyUnderinvestment.turns.length).toBeGreaterThan(0);
    for (const width of probes.safetyUnderinvestment.evidence) {
      expect(width).toBeGreaterThan(300);
    }
  });

  test('a racer run neglects society while unrest climbs (or society stayed calm)', () => {
    const seed = 'probe-neglect';
    const initial = initGame(data, { seed, presetId: 'consensus' });
    const run = runBot(data, initial, 'racer');
    const probes = runProbes(data, { seed, presetId: 'consensus' }, run.actions);
    // The racer allocates diffusion 10 every turn; the probe fires exactly on
    // turns where unrest actually rose. Assert consistency, not fate.
    for (const turn of probes.societyNeglect.turns) {
      expect(turn).toBeGreaterThan(1);
      expect(turn).toBeLessThanOrEqual(16);
    }
  });

  test('probes never fire on turns outside the run', () => {
    const seed = 'probe-bounds';
    const initial = initGame(data, { seed, presetId: 'consensus' });
    const run = runBot(data, initial, 'hedger');
    const probes = runProbes(data, { seed, presetId: 'consensus' }, run.actions);
    for (const result of [
      probes.treatyWindowOpen,
      probes.safetyUnderinvestment,
      probes.societyNeglect,
    ]) {
      for (const turn of result.turns) {
        expect(turn).toBeGreaterThanOrEqual(1);
        expect(turn).toBeLessThanOrEqual(run.finalState.turn);
      }
      expect(result.evidence.length).toBe(result.turns.length);
    }
  });
});
