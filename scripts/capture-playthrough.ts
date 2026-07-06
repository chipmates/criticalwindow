/**
 * pnpm gif — regenerate docs/media/playthrough.gif from a real, seeded run.
 *
 * Drives the actual game in headless Chromium (same selectors as the browser
 * tests) and captures a nine-shot arc: title, worldview setup, clean turn-1
 * board, a memo dilemma (modal intended, teaching hints dismissed), the
 * incident shock, the late board under fog, the ending, the truth chart, the
 * grade. Assembled with gifski. Deterministic: fixed seed, reduced motion,
 * dark theme, 1440x860 at 2x scale so no text clips. Requires gifski on PATH;
 * starts its own dev server if none is listening.
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
/** Frames that double as README stills: shot number -> media file name. */
const STILLS: Record<number, string> = { 1: 'title.png', 3: 'game.png' };

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

/** First-run teaching hints are for players, not for the trailer. */
async function dismissHints(page: Page): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    if (!(await clickIf(page, 'Got it'))) {
      return;
    }
    await page.waitForTimeout(120);
  }
}

/** Unlock toasts auto-fade after 7s; the harness outruns them, a shot must not. */
async function awaitToastsGone(page: Page): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    if ((await page.locator('.disclose-toast').count()) === 0) {
      return;
    }
    await page.waitForTimeout(250);
  }
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
  await capture(page, 7); // 1. title: the definition hook

  await page.getByRole('button', { name: 'New run' }).click();
  await page.getByLabel('Seed').fill(SEED);
  await capture(page, 6); // 2. setup: pick your worldview, the transparency move

  await page.getByRole('button', { name: 'Take office' }).click();

  // Prologue: play through without capturing (it teaches; the gif pitches).
  await page.getByRole('button', { name: 'Continue' }).click();
  await dismissHints(page);
  await page.getByRole('button', { name: 'Commit allocation' }).click();
  await page.getByRole('button', { name: 'Enact' }).click();
  await page.locator('.memo-choice').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Take office' }).click();
  await page.waitForTimeout(400);
  await dismissHints(page);
  await capture(page, 9); // 3. turn-1 board, clean: race track, allocation, anchors

  // Play forward; capture the first memo and the first incident shock.
  let memoShot = false;
  let shockShot = false;
  for (let i = 0; i < 240; i += 1) {
    if (await page.getByRole('button', { name: 'See how it ends' }).isVisible()) {
      await capture(page, 8); // 6. the late board: fog closed in, band wide
      await page.getByRole('button', { name: 'See how it ends' }).click();
      break;
    }
    if (!shockShot && (await page.locator('.memo-shock').isVisible())) {
      await awaitToastsGone(page);
      await capture(page, 7); // 5. incident shock: the truth leaks
      shockShot = true;
    }
    if (!memoShot && (await page.locator('.memo').isVisible())) {
      await dismissHints(page);
      await awaitToastsGone(page);
      await capture(page, 9); // 4. a memo dilemma, citations in the footer
      memoShot = true;
    }
    if (await page.locator('.memo-shock .btn-primary').isVisible()) {
      await page.locator('.memo-shock .btn-primary').click();
      continue;
    }
    if (await clickIf(page, 'Commit allocation')) continue;
    if (await clickIf(page, 'Pass this quarter')) continue;
    if (await clickIf(page, 'Next quarter')) continue;
    if (await page.locator('.memo-choice').first().isVisible()) {
      await page.locator('.memo-choice').first().click();
      continue;
    }
    await page.waitForTimeout(200);
  }

  // Debrief: the envelope opens, the truth chart, the grade.
  await page.waitForTimeout(600);
  await capture(page, 8); // 7. the ending
  await page.locator('.debrief .panel').nth(1).scrollIntoViewIfNeeded();
  await capture(page, 10); // 8. what your evals said, against the truth
  await page.locator('.score-grade').scrollIntoViewIfNeeded();
  await capture(page, 9); // 9. the grade: beat this seed

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
  // The README stills come from the same run, same theme, same cleanliness.
  for (const [shotNo, name] of Object.entries(STILLS)) {
    const source = files[Number(shotNo) - 1];
    if (!source) {
      continue;
    }
    execFileSync('ffmpeg', [
      '-y',
      '-i',
      source,
      '-vf',
      'scale=1440:-1',
      new URL(`../docs/media/${name}`, import.meta.url).pathname,
    ]);
  }
  console.log(
    `playthrough.gif + ${Object.values(STILLS).join(' + ')} rebuilt from ${files.length} keyframes`,
  );
} finally {
  await browser.close();
  server?.kill();
  rmSync(dir, { recursive: true, force: true });
}
