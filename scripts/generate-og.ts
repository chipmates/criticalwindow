/**
 * pnpm tsx scripts/generate-og.ts — render public/og.png (1200x630) from a
 * self-contained HTML card, dev-time only (playwright chromium, same dep the
 * browser tests use). Title and tagline come from data/strings/en.json so a
 * rename is a one-file change. No external assets, no network.
 *
 * Design: the closing window. Two capability curves race toward a dashed
 * threshold; the amber band between NOW and TOO LATE is the window itself,
 * fog of war past the crossing. Colors are the dark tokens from theme.css
 * (situation room at 2 a.m.), so the card looks like the game it links to.
 * Composition is center-weighted so Reddit's square thumbnail crop keeps
 * the title, and the title is huge so it survives old-Reddit 70px thumbs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const strings = JSON.parse(readFileSync('data/strings/en.json', 'utf8')) as Record<string, string>;
const title = strings['app.title'] ?? 'Critical Window';

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #101318; color: #e8e4da;
    font-family: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
    overflow: hidden; position: relative; }

  /* faint chart-paper grid behind everything */
  .grid { position: absolute; inset: 0;
    background-image:
      linear-gradient(to right, rgba(232,228,218,0.045) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(232,228,218,0.045) 1px, transparent 1px);
    background-size: 60px 60px; }
  /* vignette so corners fall away and the center reads first */
  .vignette { position: absolute; inset: 0;
    background: radial-gradient(ellipse 95% 85% at 50% 40%, transparent 60%, rgba(6,8,11,0.4) 100%); }

  .frame { position: absolute; inset: 22px; border: 1px solid #2c333e; }

  .chart { position: absolute; left: 0; right: 0; bottom: 66px; height: 280px; }

  .masthead { position: absolute; top: 62px; left: 0; right: 0; text-align: center; }
  .kicker { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 21px;
    letter-spacing: 0.34em; color: #a49f93; text-transform: uppercase; }
  h1 { font-size: 128px; font-weight: 700; letter-spacing: 0.005em; line-height: 1;
    margin-top: 14px; color: #f0ece2;
    text-shadow: 0 2px 24px rgba(16,19,24,0.9), 0 0 80px rgba(224,164,88,0.12); }
  .tagline { font-size: 31px; font-style: italic; color: #b5afa2; margin-top: 20px; }

  .foot { position: absolute; left: 60px; right: 60px; bottom: 40px;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 20px; color: #a49f93; }
  .foot .cite { color: #e0a458; }
</style></head><body>
  <div class="grid"></div>

  <svg class="chart" viewBox="0 0 1200 280" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e0a458" stop-opacity="0.15"/>
        <stop offset="1" stop-color="#e0a458" stop-opacity="0.03"/>
      </linearGradient>
      <linearGradient id="youFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e0a458" stop-opacity="0.2"/>
        <stop offset="1" stop-color="#e0a458" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="fogFade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#101318" stop-opacity="0"/>
        <stop offset="0.4" stop-color="#101318" stop-opacity="0.8"/>
        <stop offset="1" stop-color="#101318" stop-opacity="0.97"/>
      </linearGradient>
    </defs>

    <!-- the window: amber band between NOW and TOO LATE -->
    <rect x="430" y="14" width="530" height="226" fill="url(#windowGlow)"/>
    <line x1="430" y1="14" x2="430" y2="240" stroke="#e0a458" stroke-opacity="0.75" stroke-width="2"/>
    <line x1="960" y1="14" x2="960" y2="240" stroke="#e0a458" stroke-opacity="0.75" stroke-width="2" stroke-dasharray="7 7"/>

    <!-- threshold -->
    <line x1="0" y1="48" x2="1200" y2="48" stroke="#ef6a6a" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="12 9"/>
    <text x="60" y="76" font-family="ui-monospace, Menlo, monospace" font-size="17"
      letter-spacing="3" fill="#ef6a6a" fill-opacity="0.85">POINT OF NO RETURN</text>

    <!-- capability curves: YOU (amber) and RIVAL (red), racing the threshold -->
    <path d="M 0 224 C 300 219, 560 202, 760 160 C 900 130, 950 90, 988 20"
      fill="none" stroke="#e0a458" stroke-width="5" stroke-linecap="round"/>
    <path d="M 0 224 C 300 219, 560 202, 760 160 C 900 130, 950 90, 988 20 L 988 240 L 0 240 Z"
      fill="url(#youFill)" stroke="none"/>
    <path d="M 0 231 C 330 228, 620 216, 830 178 C 970 152, 1040 106, 1080 40"
      fill="none" stroke="#e87f7f" stroke-width="5" stroke-linecap="round"/>

    <!-- fog of war past the crossing: darken, then faint diagonal hatch on top -->
    <rect x="900" y="0" width="300" height="240" fill="url(#fogFade)"/>
    <g stroke="#232a36" stroke-width="5" opacity="0.85">
      <line x1="960" y1="240" x2="1200" y2="0"/>
      <line x1="1000" y1="240" x2="1200" y2="40"/>
      <line x1="1040" y1="240" x2="1200" y2="80"/>
      <line x1="1080" y1="240" x2="1200" y2="120"/>
      <line x1="1120" y1="240" x2="1200" y2="160"/>
      <line x1="1160" y1="240" x2="1200" y2="200"/>
      <line x1="920" y1="200" x2="1120" y2="0"/>
      <line x1="960" y1="120" x2="1060" y2="0"/>
    </g>

    <!-- curve labels, kept clear of each other and of the fog -->
    <text x="565" y="172" font-family="ui-monospace, Menlo, monospace" font-size="19"
      letter-spacing="2" fill="#e0a458">YOU</text>
    <text x="565" y="226" font-family="ui-monospace, Menlo, monospace" font-size="19"
      letter-spacing="2" fill="#e87f7f">RIVAL</text>

    <!-- window labels -->
    <text x="444" y="38" font-family="ui-monospace, Menlo, monospace" font-size="18"
      letter-spacing="3" fill="#e0a458">NOW</text>
    <text x="946" y="38" font-family="ui-monospace, Menlo, monospace" font-size="18"
      letter-spacing="3" fill="#e0a458" text-anchor="end">TOO LATE</text>

    <!-- baseline + years -->
    <line x1="0" y1="240" x2="1200" y2="240" stroke="#2c333e" stroke-width="2"/>
    <g font-family="ui-monospace, Menlo, monospace" font-size="17" fill="#8a857a" letter-spacing="1">
      <text x="120" y="270">2026</text>
      <text x="360" y="270">2027</text>
      <text x="600" y="270">2028</text>
      <text x="840" y="270">2029</text>
      <text x="1080" y="270">2030</text>
    </g>
  </svg>

  <div class="vignette"></div>
  <div class="frame"></div>

  <div class="masthead">
    <div class="kicker">A strategy game about the AI race</div>
    <h1>${title}</h1>
    <div class="tagline">Sixteen quarters to 2030. Two dice sealed in an envelope.</div>
  </div>

  <div class="foot">
    <span>Free · Open source · No tracking</span>
    <span class="cite">Every number cites a source</span>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
const png = await page.screenshot({ type: 'png' });
await browser.close();
writeFileSync('public/og.png', png);
console.log(`wrote public/og.png (${png.length} bytes) for '${title}'`);
