/**
 * The offline promise, tested against the artifact users actually receive:
 * the production build served by vite preview, service worker included. The
 * dev-server suite can never exercise the PWA; this one does. Requires dist/
 * (CI builds before the browser suite; locally run pnpm build first).
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const PORT = 5200;
const BASE = `http://localhost:${PORT}`;

let server: ChildProcess | null = null;

test.beforeAll(async () => {
  test.skip(!existsSync('dist/index.html'), 'dist/ missing; run pnpm build first');
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok) {
        return;
      }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('vite preview never came up');
});

test.afterAll(() => {
  server?.kill();
});

test('core game survives going offline after first load', async ({ browser, browserName }) => {
  // Offline emulation plus service workers is only reliable in chromium's
  // Playwright driver; the promise itself is engine-independent (one engine
  // proving the artifact serves from cache is the claim).
  test.skip(browserName !== 'chromium', 'offline+SW emulation is chromium-only in Playwright');
  test.setTimeout(120_000);
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(BASE);
  await page.getByRole('button', { name: 'New run' }).waitFor({ timeout: 20_000 });
  // Let the service worker finish installing and precaching.
  await page.evaluate(async () => {
    await (navigator as unknown as { serviceWorker: { ready: Promise<unknown> } }).serviceWorker
      .ready;
  });
  await page.waitForTimeout(2_000);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'New run' })).toBeVisible({ timeout: 20_000 });

  // A full setup screen renders offline too: the bundle, data and fonts came
  // from the cache, not the network.
  await page.getByRole('button', { name: 'New run' }).click();
  await expect(page.getByRole('button', { name: 'Take office' })).toBeVisible();

  await context.close();
});
