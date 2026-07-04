/**
 * The game is playable start to ending in a real browser: title -> setup ->
 * full turn loop -> debrief, driven only through the visible UI. Runs in all
 * three engines; screenshots land in test-results for design review.
 */
import { expect, test } from '@playwright/test';

test('a full run plays through the UI to the debrief', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');

  // Title -> setup
  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByLabel('Seed').fill('e2e-playthrough-1');
  await page.getByRole('button', { name: 'Take office' }).click();

  // Fresh browser context: the prologue plays first. Skip it here; the a11y
  // spec plays it through.
  await page.getByRole('button', { name: 'Skip the history' }).click();

  // Turn loop: commit the default allocation, pass policy, take the first
  // memo choice, advance. Repeat until the debrief button appears.
  for (let safety = 0; safety < 200; safety += 1) {
    if (await page.getByRole('button', { name: 'Commit allocation' }).isVisible()) {
      await page.getByRole('button', { name: 'Commit allocation' }).click();
      continue;
    }
    if (await page.getByRole('button', { name: 'Pass this quarter' }).isVisible()) {
      await page.getByRole('button', { name: 'Pass this quarter' }).click();
      continue;
    }
    const shock = page.locator('.memo-shock .btn-primary');
    if (await shock.isVisible()) {
      await shock.click();
      continue;
    }
    const memo = page.locator('.memo-choice').first();
    if (await memo.isVisible()) {
      await memo.click();
      continue;
    }
    if (await page.getByRole('button', { name: 'See how it ends' }).isVisible()) {
      await page.getByRole('button', { name: 'See how it ends' }).click();
      break;
    }
    if (await page.getByRole('button', { name: 'Next quarter' }).isVisible()) {
      await page.getByRole('button', { name: 'Next quarter' }).click();
      continue;
    }
    await page.waitForTimeout(50);
  }

  // Debrief: ending, timeline, envelope reveal, share.
  await expect(page.locator('.debrief-ending')).toBeVisible();
  await expect(page.locator('.timeline svg')).toBeVisible();
  await expect(page.getByText('The envelope, opened')).toBeVisible();
  await page.screenshot({ path: 'test-results/debrief.png', fullPage: true });
});

test('mobile portrait: setup renders without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: 'New run' }).click();
  const overflow = await page.evaluate(() => {
    const el = (
      globalThis as unknown as {
        document: { documentElement: { scrollWidth: number; clientWidth: number } };
      }
    ).document.documentElement;
    return el.scrollWidth > el.clientWidth;
  });
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Take office' }).click();
  await page.getByRole('button', { name: 'Skip the history' }).click();
  await expect(page.getByRole('button', { name: 'Commit allocation' })).toBeVisible();
  const gameOverflow = await page.evaluate(() => {
    const el = (
      globalThis as unknown as {
        document: { documentElement: { scrollWidth: number; clientWidth: number } };
      }
    ).document.documentElement;
    return el.scrollWidth > el.clientWidth;
  });
  expect(gameOverflow).toBe(false);
  await page.screenshot({ path: 'test-results/mobile-game.png', fullPage: true });
});
