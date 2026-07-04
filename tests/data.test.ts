import { describe, expect, test } from 'vitest';
import { DataLoadError, checkIntegrity, loadEngineData } from '../src/engine/data';
import {
  eventCardSchema,
  incidentsSchema,
  parametersSchema,
  policyCardSchema,
  scenarioSchema,
  sourcesRegistrySchema,
} from '../src/engine/schemas';
import eventFixture from './fixtures/event.sample.json';
import incidentsFixture from './fixtures/incidents.sample.json';
import parametersFixture from './fixtures/parameters.sample.json';
import policyFixture from './fixtures/policy.sample.json';
import scenarioFixture from './fixtures/scenario.sample.json';
import sourcesFixture from './fixtures/sources.sample.json';

const parsed = {
  parameters: parametersSchema.parse(parametersFixture),
  scenario: scenarioSchema.parse(scenarioFixture),
  events: [eventCardSchema.parse(eventFixture)],
  policies: [policyCardSchema.parse(policyFixture)],
  incidents: incidentsSchema.parse(incidentsFixture),
  sources: sourcesRegistrySchema.parse(sourcesFixture),
};

/** Strings covering every ref used by the fixtures. */
const fixtureStrings = Object.fromEntries(
  [
    'event.openWeightsShock.title',
    'event.openWeightsShock.body',
    'event.openWeightsShock.embrace',
    'event.openWeightsShock.crackdown',
    'policy.exportControls.title',
    'policy.exportControls.body',
    'preset.cautious.label',
    'preset.cautious.description',
    'preset.consensus.label',
    'preset.consensus.description',
    'preset.skeptic.label',
    'preset.skeptic.description',
    'scenario.usa2026.label',
    'incident.nearMiss.title',
    'incident.nearMiss.body',
    'incident.labAccident.title',
    'incident.labAccident.body',
  ].map((key) => [key, 'placeholder text']),
);

describe('loadEngineData', () => {
  test('loads valid content', () => {
    const data = loadEngineData({
      dataVersion: 'test',
      parameters: parametersFixture,
      scenario: scenarioFixture,
      events: [{ name: 'event.sample.json', json: eventFixture }],
      policies: [{ name: 'policy.sample.json', json: policyFixture }],
      incidents: incidentsFixture,
    });
    expect(data.events).toHaveLength(1);
    expect(data.policies).toHaveLength(1);
    expect(data.parameters.turnStructure.maxTurns.value).toBe(16);
  });

  test('collects every issue instead of stopping at the first', () => {
    expect(() =>
      loadEngineData({
        dataVersion: 'test',
        parameters: {},
        scenario: {},
        events: [{ name: 'bad.json', json: { id: 'bad' } }],
        policies: [],
        incidents: incidentsFixture,
      }),
    ).toThrow(DataLoadError);
    try {
      loadEngineData({
        dataVersion: 'test',
        parameters: {},
        scenario: {},
        events: [{ name: 'bad.json', json: { id: 'bad' } }],
        policies: [],
        incidents: incidentsFixture,
      });
    } catch (error) {
      const issues = (error as DataLoadError).issues;
      expect(issues.some((issue) => issue.startsWith('parameters.json'))).toBe(true);
      expect(issues.some((issue) => issue.startsWith('events/bad.json'))).toBe(true);
      expect(issues.length).toBeGreaterThan(2);
    }
  });
});

describe('checkIntegrity', () => {
  test('clean fixtures report no errors and list draft values', () => {
    const report = checkIntegrity({ ...parsed, strings: fixtureStrings, sources: parsed.sources });
    expect(report.errors).toEqual([]);
    // The fixtures deliberately carry TODO-SOURCE drafts (C1 will too).
    expect(report.draftValues.length).toBeGreaterThan(0);
    expect(report.draftValues.some((path) => path.includes('startResources.talent'))).toBe(true);
  });

  test('unknown source ids are caught with their path', () => {
    const brokenEvent = structuredClone(parsed.events[0]!);
    brokenEvent.sourceIds = ['SRC-DOES-NOT-EXIST'];
    const report = checkIntegrity({
      ...parsed,
      events: [brokenEvent],
      strings: fixtureStrings,
      sources: parsed.sources,
    });
    expect(report.errors.some((e) => e.includes("unknown source id 'SRC-DOES-NOT-EXIST'"))).toBe(
      true,
    );
  });

  test('unresolved string keys are caught', () => {
    const missingStrings = { ...fixtureStrings };
    delete missingStrings['event.openWeightsShock.embrace'];
    const report = checkIntegrity({ ...parsed, strings: missingStrings, sources: parsed.sources });
    expect(
      report.errors.some((e) =>
        e.includes("unresolved string key 'event.openWeightsShock.embrace'"),
      ),
    ).toBe(true);
  });

  test('duplicate card ids are caught', () => {
    const report = checkIntegrity({
      ...parsed,
      events: [parsed.events[0]!, structuredClone(parsed.events[0]!)],
      strings: fixtureStrings,
      sources: parsed.sources,
    });
    expect(report.errors.some((e) => e.includes('duplicate event id'))).toBe(true);
  });

  test('startingHand must reference real policies', () => {
    const brokenScenario = structuredClone(parsed.scenario);
    brokenScenario.startingHand = ['no_such_policy'];
    const report = checkIntegrity({
      ...parsed,
      scenario: brokenScenario,
      strings: fixtureStrings,
      sources: parsed.sources,
    });
    expect(report.errors.some((e) => e.includes('no_such_policy'))).toBe(true);
  });

  test('without a sources registry, source ids are not checked (pre-A3)', () => {
    const report = checkIntegrity({ ...parsed, strings: fixtureStrings, sources: null });
    expect(report.errors).toEqual([]);
  });
});
