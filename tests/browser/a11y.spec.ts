/**
 * Accessibility gates: axe scans every screen (zero violations tolerated,
 * not just criticals) and a keyboard-only session drives the core loop.
 * WCAG AA is a constitution here, so it runs in CI like everything else.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoViolations(page: import('@playwright/test').Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
}

test('axe: title, setup, game and debrief scan clean', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expectNoViolations(page);

  await page.getByRole('button', { name: 'New run' }).click();
  await expectNoViolations(page);

  await page.getByLabel('Seed').fill('a11y-run');
  await page.getByRole('button', { name: 'Take office' }).click();
  await expectNoViolations(page);

  // Reach a memo (event dialog) and scan it too.
  for (let i = 0; i < 60; i += 1) {
    if (await page.locator('.memo').isVisible()) {
      break;
    }
    if (await page.getByRole('button', { name: 'Commit allocation' }).isVisible()) {
      await page.getByRole('button', { name: 'Commit allocation' }).click();
    } else if (await page.getByRole('button', { name: 'Pass this quarter' }).isVisible()) {
      await page.getByRole('button', { name: 'Pass this quarter' }).click();
    } else if (await page.getByRole('button', { name: 'Next quarter' }).isVisible()) {
      await page.getByRole('button', { name: 'Next quarter' }).click();
    }
  }
  await expectNoViolations(page);

  // Play to the end and scan the debrief.
  for (let i = 0; i < 200; i += 1) {
    if (await page.getByRole('button', { name: 'See how it ends' }).isVisible()) {
      await page.getByRole('button', { name: 'See how it ends' }).click();
      break;
    }
    if (await page.getByRole('button', { name: 'Commit allocation' }).isVisible()) {
      await page.getByRole('button', { name: 'Commit allocation' }).click();
    } else if (await page.getByRole('button', { name: 'Pass this quarter' }).isVisible()) {
      await page.getByRole('button', { name: 'Pass this quarter' }).click();
    } else if (await page.locator('.memo-choice').first().isVisible()) {
      await page.locator('.memo-choice').first().click();
    } else if (await page.getByRole('button', { name: 'Next quarter' }).isVisible()) {
      await page.getByRole('button', { name: 'Next quarter' }).click();
    } else {
      await page.waitForTimeout(30);
    }
  }
  await expect(page.locator('.debrief-ending')).toBeVisible();
  await expectNoViolations(page);
});

test('keyboard only: a turn can be played without a pointer', async ({ page }) => {
  await page.goto('/');
  // Tab to "New run" and activate.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'New run' })).toBeFocused();
  await page.keyboard.press('Enter');

  // Setup: radio group -> seed -> begin. Walk with Tab until Take office.
  for (let i = 0; i < 20; i += 1) {
    const focused = await page.evaluate(() =>
      (
        globalThis as unknown as {
          document: { activeElement: { textContent: string | null } | null };
        }
      ).document.activeElement?.textContent?.trim(),
    );
    if (focused === 'Take office') {
      break;
    }
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');

  // Allocation: tab to Commit (default allocation already sums to 100).
  for (let i = 0; i < 30; i += 1) {
    const focused = await page.evaluate(() =>
      (
        globalThis as unknown as {
          document: { activeElement: { textContent: string | null } | null };
        }
      ).document.activeElement?.textContent?.trim(),
    );
    if (focused === 'Commit allocation') {
      break;
    }
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');

  // Policy phase reached: the panel heading exists and something is focusable.
  await expect(page.getByRole('heading', { name: 'Policy' })).toBeVisible();
});
