/**
 * pnpm tsx scripts/generate-og.ts — render public/og.png (1200x630) from a
 * self-contained HTML card, dev-time only (playwright chromium, same dep the
 * browser tests use). Title and tagline come from data/strings/en.json so a
 * rename is a one-file change. No external assets, no network.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const strings = JSON.parse(readFileSync('data/strings/en.json', 'utf8')) as Record<string, string>;
const title = strings['app.title'] ?? 'Race Conditions';

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #101318; color: #ece8df;
    font-family: Georgia, 'Times New Roman', serif; overflow: hidden; position: relative; }
  .frame { position: absolute; inset: 28px; border: 2px solid #3a4150; padding: 56px 64px;
    display: flex; flex-direction: column; justify-content: space-between; }
  .kicker { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 22px;
    letter-spacing: 0.28em; color: #8b93a3; text-transform: uppercase; }
  h1 { font-size: 104px; letter-spacing: 0.01em; line-height: 1.02; margin-top: 12px; }
  .tagline { font-size: 34px; color: #b9b2a4; margin-top: 18px; font-style: italic; }
  .tracks { margin-top: 8px; }
  .track { display: flex; align-items: center; gap: 18px; margin-top: 18px; }
  .track-label { font-family: ui-monospace, Menlo, monospace; font-size: 20px; width: 92px;
    color: #8b93a3; letter-spacing: 0.12em; }
  .bar { flex: 1; height: 14px; background: #1a1f28; position: relative; }
  .fill { position: absolute; inset: 0 auto 0 0; }
  .you .fill { width: 46%; background: #d8a03c; }
  .rival .fill { width: 39%; background: #7a4dd8; }
  .fog { position: absolute; right: 0; top: 0; bottom: 0; width: 22%;
    background: repeating-linear-gradient(135deg, #232a36 0 10px, #1a1f28 10px 20px); }
  .foot { display: flex; justify-content: space-between; align-items: baseline;
    font-family: ui-monospace, Menlo, monospace; font-size: 21px; color: #8b93a3; }
</style></head><body>
  <div class="frame">
    <div>
      <div class="kicker">A strategy game about the AI race</div>
      <h1>${title}</h1>
      <div class="tagline">Sixteen quarters to 2030. Two dice sealed in an envelope.</div>
    </div>
    <div class="tracks">
      <div class="track you"><span class="track-label">YOU</span><span class="bar"><span class="fill"></span><span class="fog"></span></span></div>
      <div class="track rival"><span class="track-label">RIVAL</span><span class="bar"><span class="fill"></span><span class="fog"></span></span></div>
    </div>
    <div class="foot">
      <span>Every number cites a source</span>
      <span>Free · Open source · No tracking</span>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
const png = await page.screenshot({ type: 'png' });
await browser.close();
writeFileSync('public/og.png', png);
console.log(`wrote public/og.png (${png.length} bytes) for '${title}'`);
