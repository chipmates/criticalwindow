/**
 * Mid-run detours must come home. A player who checks a citation from
 * inside a run (game -> help -> sources) walks back the same way and finds
 * the run exactly where they left it; and if they ever land on the title
 * with a live run, the title offers a way back in.
 */
import { expect, test } from '@playwright/test';

test('sources back button returns to where you came from, run intact', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByLabel('Seed').fill('nav-detour');
  await page.getByRole('button', { name: 'Take office' }).click();

  // Prologue, played through like the other suites.
  await page.getByRole('button', { name: 'Continue' }).click();
  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click();
  }
  await page.getByRole('button', { name: 'Commit allocation' }).click();
  await page.getByRole('button', { name: 'Enact' }).click();
  await page.locator('.memo-choice').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Take office' }).click();

  // In the run. Note the turn indicator, then detour: help -> sources.
  await expect(page.getByRole('button', { name: 'Commit allocation' })).toBeVisible();
  await page.getByRole('button', { name: 'How to play' }).click();
  await page.getByRole('button', { name: 'Browse the full source registry' }).click();
  await expect(page.getByRole('heading', { name: 'Every number cites a source' })).toBeVisible();

  // Back walks the chain in reverse: sources -> help -> game.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Browse the full source registry' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Commit allocation' })).toBeVisible();
});

test('sources back respects every origin: title and setup', async ({ page }) => {
  await page.goto('/');

  // From the title footer: back returns to the title.
  await page.getByRole('button', { name: 'Sources' }).click();
  await expect(page.getByRole('heading', { name: 'Every number cites a source' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'New run' })).toBeVisible();

  // From a setup source chip: back returns to setup, choices intact.
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByLabel('Seed').fill('nav-origin');
  await page.locator('.source-chip').first().click();
  await expect(page.getByRole('heading', { name: 'Every number cites a source' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Take office' })).toBeVisible();
  await expect(page.getByLabel('Seed')).toHaveValue('nav-origin');
});
