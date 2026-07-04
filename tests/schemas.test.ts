import { describe, expect, test } from 'vitest';
import {
  actionSchema,
  curveTableSchema,
  eventCardSchema,
  parametersSchema,
  policyCardSchema,
  scenarioSchema,
  sourcesRegistrySchema,
  stringsFileSchema,
} from '../src/engine/schemas';
import eventFixture from './fixtures/event.sample.json';
import parametersFixture from './fixtures/parameters.sample.json';
import policyFixture from './fixtures/policy.sample.json';
import scenarioFixture from './fixtures/scenario.sample.json';
import sourcesFixture from './fixtures/sources.sample.json';

describe('sample data files validate (B1 done-when)', () => {
  test('event card', () => {
    expect(eventCardSchema.safeParse(eventFixture).success).toBe(true);
  });
  test('policy card', () => {
    expect(policyCardSchema.safeParse(policyFixture).success).toBe(true);
  });
  test('parameters', () => {
    expect(parametersSchema.safeParse(parametersFixture).success).toBe(true);
  });
  test('scenario', () => {
    expect(scenarioSchema.safeParse(scenarioFixture).success).toBe(true);
  });
  test('sources registry', () => {
    expect(sourcesRegistrySchema.safeParse(sourcesFixture).success).toBe(true);
  });
});

describe('the iron rule is schema-enforced', () => {
  test('an event card without sourceIds fails', () => {
    const { sourceIds: _dropped, ...bare } = eventFixture;
    expect(eventCardSchema.safeParse(bare).success).toBe(false);
  });

  test('a parameter value without sourceIds fails', () => {
    const broken = structuredClone(parametersFixture) as Record<string, unknown>;
    (broken.evalUncertainty as Record<string, unknown>).baseBandWidth = { value: 400 };
    expect(parametersSchema.safeParse(broken).success).toBe(false);
  });

  test('empty sourceIds fails', () => {
    const broken = structuredClone(eventFixture) as Record<string, unknown>;
    broken.sourceIds = [];
    expect(eventCardSchema.safeParse(broken).success).toBe(false);
  });

  test('TODO-SOURCE is schema-legal (draft gate lives in the validator)', () => {
    const draft = structuredClone(eventFixture) as Record<string, unknown>;
    draft.sourceIds = ['TODO-SOURCE'];
    expect(eventCardSchema.safeParse(draft).success).toBe(true);
  });
});

describe('structural guards', () => {
  test('unknown effect targets are typos, not extensions', () => {
    const broken = structuredClone(eventFixture) as {
      choices: Array<{ effects?: Record<string, unknown> }>;
    };
    broken.choices[0]!.effects!.pubicTrust = -30;
    expect(eventCardSchema.safeParse(broken).success).toBe(false);
  });

  test('curve x knots must be strictly increasing and lengths equal', () => {
    const base = { sourceIds: ['SRC-TEST'], x: [0, 100, 100], y: [0, 1, 2] };
    expect(curveTableSchema.safeParse(base).success).toBe(false);
    expect(
      curveTableSchema.safeParse({ sourceIds: ['SRC-TEST'], x: [0, 100], y: [0, 1, 2] }).success,
    ).toBe(false);
    expect(
      curveTableSchema.safeParse({ sourceIds: ['SRC-TEST'], x: [0, 100], y: [0, 1] }).success,
    ).toBe(true);
  });

  test('allocation shares must sum to 100', () => {
    const broken = structuredClone(scenarioFixture) as unknown as {
      seats: { usa: { allocation: { capability: number } } };
    };
    broken.seats.usa.allocation.capability = 61;
    expect(scenarioSchema.safeParse(broken).success).toBe(false);
    expect(
      actionSchema.safeParse({ type: 'allocate', capability: 50, safety: 30, diffusion: 21 })
        .success,
    ).toBe(false);
    expect(
      actionSchema.safeParse({ type: 'allocate', capability: 50, safety: 30, diffusion: 20 })
        .success,
    ).toBe(true);
  });

  test('duplicate source ids fail', () => {
    const broken = structuredClone(sourcesFixture) as { sources: Array<{ id: string }> };
    broken.sources[1]!.id = broken.sources[0]!.id;
    expect(sourcesRegistrySchema.safeParse(broken).success).toBe(false);
  });

  test('every strong card bites: a card with only free upside fails', () => {
    const freebie = structuredClone(eventFixture) as Record<string, unknown>;
    freebie.choices = [
      {
        label: 'strings:event.openWeightsShock.embrace',
        effects: { capability: 50, publicTrust: 20 },
      },
    ];
    expect(eventCardSchema.safeParse(freebie).success).toBe(false);
  });

  test('event turn windows must be ordered', () => {
    const broken = structuredClone(eventFixture) as { trigger: Record<string, unknown> };
    broken.trigger.turnMin = 9;
    broken.trigger.turnMax = 2;
    expect(eventCardSchema.safeParse(broken).success).toBe(false);
  });

  test('strings files are flat dot-key maps of non-empty text', () => {
    expect(stringsFileSchema.safeParse({ 'app.title': 'Race Conditions' }).success).toBe(true);
    expect(stringsFileSchema.safeParse({ 'app.title': '' }).success).toBe(false);
    expect(stringsFileSchema.safeParse({ Title: 'x' }).success).toBe(false);
  });
});
