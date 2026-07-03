/**
 * The cross-engine determinism guarantee: the committed golden hashes must
 * reproduce bit-exactly inside Chromium, Firefox AND WebKit. A failure here
 * means implementation-defined behavior leaked into the engine (this is
 * what the banned-Math lint buys; fix the leak, never relax the rule).
 */
import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Golden {
  name: string;
  perTurnHashes: string[];
  finalHash: string;
}

const goldenDir = fileURLToPath(new URL('../golden', import.meta.url));
const goldens: Golden[] = readdirSync(goldenDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(goldenDir, f), 'utf8')) as Golden);

test('golden fixtures replay hash-exact in this browser engine', async ({ page }) => {
  await page.goto('/determinism.html');
  await page.waitForFunction(() => window.__GOLDEN_RESULTS__ !== undefined, undefined, {
    timeout: 30_000,
  });
  const results = await page.evaluate(() => window.__GOLDEN_RESULTS__!);

  expect(goldens.length).toBe(5);
  for (const golden of goldens) {
    const browserRun = results[golden.name];
    expect(browserRun, `${golden.name} missing in browser results`).toBeTruthy();
    expect(browserRun!.perTurnHashes).toEqual(golden.perTurnHashes);
    expect(browserRun!.finalHash).toBe(golden.finalHash);
  }
});
