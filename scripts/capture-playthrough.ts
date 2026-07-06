/**
 * pnpm gif — regenerate docs/media/playthrough.gif from a real, seeded run.
 *
 * Drives the actual game in headless Chromium (same selectors as the browser
 * tests), captures keyframes at 2x device scale so text stays crisp, and
 * assembles them with gifski. Deterministic: fixed seed, reduced motion,
 * fixed viewport with margin so nothing ever clips. Requires `pnpm dev
 * --port 5199` running (or starts one itself) and gifski on PATH.
 */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const BASE = 'http://localhost:5199';
const SEED = 'critical-window-demo';
/** Hold time per keyframe, in gifski frames at 4 fps. */
const HOLDS: number[] = [];
const files: string[] = [];
let shot = 0;

const dir = mkdtempSync(join(tmpdir(), 'cw-gif-'));

async function capture(page: Page, hold: number): Promise<void> {
  shot += 1;
  const file = join(dir, `frame-${String(shot).padStart(3, '0')}.png`);
  await page.waitForTimeout(250); // let layout settle
  await page.screenshot({ path: file, type: 'png' });
  files.push(file);
  HOLDS.push(hold);
}

async function clickIf(page: Page, name: string): Promise<boolean> {
  const btn = page.getByRole('button', { name });
  if (await btn.isVisible().catch(() => false)) {
    await btn.first().click();
    return true;
  }
  return false;
}

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(BASE);
    return res.ok;
  } catch {
    return false;
  }
}

let server: ChildProcess | null = null;
if (!(await serverUp())) {
  server = spawn('pnpm', ['dev', '--port', '5199', '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 60 && !(await serverUp()); i += 1) {
    await new Promise((r) => setTimeout(r, 500));
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 860 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
  colorScheme: 'dark',
});
const page = await context.newPage();

try {
  await page.goto(BASE);
  await page.getByRole('button', { name: 'New run' }).waitFor({ timeout: 15_000 });
  await capture(page, 7); // title

  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByLabel('Seed').fill(SEED);
  await capture(page, 7); // setup: worldview + seed

  await page.getByRole('button', { name: 'Take office' }).click();

  // Prologue: play it for real, capture the allocation teach.
  await page.getByRole('button', { name: 'Continue' }).click();
  await capture(page, 7); // prologue allocation lesson
  await page.getByRole('button', { name: 'Commit allocation' }).click();
  await page.getByRole('button', { name: 'Enact' }).click();
  await page.locator('.memo-choice').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Take office' }).click();
  await page.waitForTimeout(400);
  await capture(page, 9); // turn 1: the full dashboard

  // Play forward; capture the first memo and a mid-game board.
  let memoShot = false;
  let midgameShot = false;
  for (let i = 0; i < 220; i += 1) {
    if (await page.getByRole('button', { name: 'See how it ends' }).isVisible()) {
      await capture(page, 8); // final board
      await page.getByRole('button', { name: 'See how it ends' }).click();
      break;
    }
    if (!memoShot && (await page.locator('.memo').isVisible())) {
      await capture(page, 9); // a memo dilemma
      memoShot = true;
    }
    if (!midgameShot && i > 25) {
      await capture(page, 8); // mid-game board state
      midgameShot = true;
    }
    if (await clickIf(page, 'Commit allocation')) continue;
    if (await clickIf(page, 'Pass this quarter')) continue;
    if (await page.locator('.memo-shock .btn-primary').isVisible()) {
      await page.locator('.memo-shock .btn-primary').click();
      continue;
    }
    if (await clickIf(page, 'Next quarter')) continue;
    if (await page.locator('.memo-choice').first().isVisible()) {
      await page.locator('.memo-choice').first().click();
      continue;
    }
    await page.waitForTimeout(200);
  }

  // Debrief: the ending, then the truth chart (the envelope opening).
  await page.waitForTimeout(600);
  await capture(page, 9); // ending title + what happened
  await page.locator('.debrief .panel').nth(1).scrollIntoViewIfNeeded();
  await capture(page, 10); // truth chart: evals said vs was true

  // Assemble. gifski paces via per-frame duplication at a fixed fps.
  const sequenced: string[] = [];
  files.forEach((file, i) => {
    for (let n = 0; n < HOLDS[i]!; n += 1) {
      sequenced.push(file);
    }
  });
  execFileSync('gifski', [
    '--fps',
    '4',
    '--width',
    '960',
    '--quality',
    '90',
    '-o',
    new URL('../docs/media/playthrough.gif', import.meta.url).pathname,
    ...sequenced,
  ]);
  console.log(`playthrough.gif rebuilt from ${files.length} keyframes`);
} finally {
  await browser.close();
  server?.kill();
  rmSync(dir, { recursive: true, force: true });
}
