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

  // The prologue shows first in a fresh context: play it through the real
  // interactions (scan each teaching step), ending on the take-office step.
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Continue' }).click(); // intro -> ch1
  await page.getByRole('button', { name: 'Commit allocation' }).click(); // ch1 allocate
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Enact' }).click(); // ch2 policy
  await page.locator('.memo-choice').first().click(); // ch3 memo choice
  await page.getByRole('button', { name: 'Continue' }).click(); // response -> outro
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Take office' }).click(); // outro -> game
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
    } else if (await page.locator('.memo-shock .btn-primary').isVisible()) {
      await page.locator('.memo-shock .btn-primary').click();
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
    } else if (await page.locator('.memo-shock .btn-primary').isVisible()) {
      await page.locator('.memo-shock .btn-primary').click();
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

test('keyboard only: a turn can be played without a pointer', async ({ page, browserName }) => {
  // WebKit's tab-focus model skips elements chromium and firefox focus; real
  // Safari keyboard behavior is a manual check (tracked in the STAND), not a
  // driver emulation question.
  test.skip(browserName === 'webkit', 'webkit tab-focus semantics differ in the driver');
  await page.goto('/');
  // Tab to "New run" and activate.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'New run' })).toBeFocused();
  await page.keyboard.press('Enter');

  // Setup: preset cards + their source chips + radios + seed. Walk until Take office.
  for (let i = 0; i < 60; i += 1) {
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

  // The prologue plays first in a fresh context. Play it THROUGH with the
  // keyboard (focus lands on each step's heading; interactions sit after it
  // in tab order, so no wrap-around is needed).
  const walkTo = async (label: string, maxTabs = 30): Promise<void> => {
    for (let i = 0; i < maxTabs; i += 1) {
      const focused = await page.evaluate(() =>
        (
          globalThis as unknown as {
            document: { activeElement: { textContent: string | null } | null };
          }
        ).document.activeElement?.textContent?.trim(),
      );
      if (focused === label) {
        await page.keyboard.press('Enter');
        return;
      }
      await page.keyboard.press('Tab');
    }
    throw new Error(`keyboard walk never reached '${label}'`);
  };

  // Lazy-loaded screen: wait for it to mount, as a sighted user would.
  await page.getByRole('button', { name: 'Continue' }).waitFor();
  await walkTo('Continue'); // intro -> chapter 1
  await walkTo('Commit allocation'); // chapter 1 teaches the allocation control
  await walkTo('Enact'); // chapter 2 teaches a policy card
  await walkTo('Work with the regulators.'); // chapter 3 memo choice
  await walkTo('Continue'); // response -> outro
  await walkTo('Take office'); // outro -> the real game
  await expect(page.getByRole('button', { name: 'Commit allocation' })).toBeVisible();

  // Allocation: tab to Commit (default allocation already sums to 100).
  await walkTo('Commit allocation');

  // Policy phase reached: the panel heading exists and something is focusable.
  await expect(page.getByRole('heading', { name: 'Policy' })).toBeVisible();
});
