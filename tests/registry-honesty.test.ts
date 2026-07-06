/**
 * Mutation tests for the registry-honesty rules: prove the validator
 * actually catches each class of violation, on the REAL data. If a rule
 * silently stops firing, these fail before a reader catches us publishing
 * a claim the data does not support.
 */
import { describe, expect, test } from 'vitest';
import { sourcesRegistrySchema, sourceEntrySchema } from '../src/engine/schemas';
import { buildUsageMap } from '../scripts/lib/source-usage';
import { registryHonestyErrors } from '../scripts/lib/registry-honesty';
import { renderSourcesMd, renderUsageJson, tierCounts } from '../scripts/lib/render-views';
import registryJson from '../data/sources.json';
import usageView from '../src/ui/generated/source-usage.json';

const registry = sourcesRegistrySchema.parse(registryJson);
const usage = buildUsageMap();

describe('the live registry is honest', () => {
  test('zero honesty errors on the real data', () => {
    expect(registryHonestyErrors(registry, usage)).toEqual([]);
  });

  test('every load-bearing entry is actually cited, and vice versa', () => {
    for (const source of registry.sources) {
      expect(usage.has(source.id), source.id).toBe(source.tier === 'load-bearing');
    }
  });

  test('the counts the game displays match the data', () => {
    const counts = tierCounts(registry);
    expect(usageView.counts.loadBearing).toBe(counts['load-bearing']);
    expect(usageView.counts.background).toBe(counts.background);
    expect(usageView.counts.library).toBe(counts.library);
  });
});

describe('mutations are caught (the rules bite)', () => {
  test('a cited source demoted to library fails', () => {
    const mutated = structuredClone(registry);
    const cited = mutated.sources.find((s) => usage.has(s.id));
    if (!cited) throw new Error('no cited source in registry');
    cited.tier = 'library';
    delete cited.gameUse;
    cited.whyListed = 'now pretending to be shelf material';
    const errors = registryHonestyErrors(mutated, usage);
    expect(errors.some((e) => e.includes(cited.id) && e.includes('load-bearing'))).toBe(true);
  });

  test('an uncited source promoted to load-bearing fails', () => {
    const mutated = structuredClone(registry);
    const uncited = mutated.sources.find((s) => !usage.has(s.id));
    if (!uncited) throw new Error('no uncited source in registry');
    uncited.tier = 'load-bearing';
    delete uncited.shaped;
    delete uncited.whyListed;
    uncited.gameUse = 'claims a citation it does not have';
    const errors = registryHonestyErrors(mutated, usage);
    expect(errors.some((e) => e.includes(uncited.id) && e.includes('nothing in data/'))).toBe(
      true,
    );
  });

  test('vague usage claims fail', () => {
    const mutated = structuredClone(registry);
    const background = mutated.sources.find((s) => s.tier === 'background');
    if (!background) throw new Error('no background source in registry');
    background.shaped = 'This source informed our thinking about the design.';
    const errors = registryHonestyErrors(mutated, usage);
    expect(errors.some((e) => e.includes(background.id))).toBe(true);
  });

  test('schema: a background entry without shaped fails', () => {
    const entry = registry.sources.find((s) => s.tier === 'background');
    if (!entry) throw new Error('no background source');
    const { shaped: _dropped, ...bare } = entry;
    expect(sourceEntrySchema.safeParse(bare).success).toBe(false);
  });

  test('schema: a library entry claiming gameUse fails', () => {
    const entry = structuredClone(registry.sources.find((s) => s.tier === 'library'));
    if (!entry) throw new Error('no library source');
    entry.gameUse = 'sneaking a usage claim onto a shelf entry';
    expect(sourceEntrySchema.safeParse(entry).success).toBe(false);
  });

  test('registry changes surface as view drift', () => {
    const mutated = structuredClone(registry);
    const first = mutated.sources.find((s) => s.tier === 'load-bearing');
    if (!first) throw new Error('no load-bearing source');
    first.gameUse = 'a silently edited claim';
    expect(renderSourcesMd(mutated, usage)).not.toBe(renderSourcesMd(registry, usage));
    first.tier = 'background';
    expect(renderUsageJson(mutated, usage)).not.toBe(renderUsageJson(registry, usage));
  });
});
