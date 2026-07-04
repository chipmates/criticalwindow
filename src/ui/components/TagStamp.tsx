/**
 * Tag stamps: small line-drawn glyphs, like rubber stamps on a briefing
 * folder. Twelve families cover every content tag; strokes ride
 * currentColor and the accent rides the theme token, so stamps re-ink
 * themselves in dark and high-contrast modes. All of it is inspectable
 * code: no raster art anywhere in the game.
 */

import type { ReactElement } from 'react';

const SW = 2.4;

const GLYPHS: Record<string, ReactElement> = {
  chips: (
    <>
      <rect x="12" y="12" width="16" height="16" rx="1.5" fill="none" strokeWidth={SW} />
      <rect x="17" y="17" width="6" height="6" fill="var(--accent)" stroke="none" />
      {[15, 20, 25].map((x) => (
        <g key={x}>
          <line x1={x} y1="8" x2={x} y2="12" strokeWidth="2" />
          <line x1={x} y1="28" x2={x} y2="32" strokeWidth="2" />
          <line x1="8" y1={x} x2="12" y2={x} strokeWidth="2" />
          <line x1="28" y1={x} x2="32" y2={x} strokeWidth="2" />
        </g>
      ))}
    </>
  ),
  energy: (
    <polygon
      points="22,7 12,22 19,22 17,33 28,17 21,17"
      fill="none"
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  ),
  labor: (
    <>
      <polygon
        points="8,30 8,20 14,15 14,20 20,15 20,20 26,15 26,30"
        fill="none"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <rect x="28" y="12" width="4" height="18" fill="none" strokeWidth={SW} />
      <line x1="8" y1="30" x2="32" y2="30" strokeWidth={SW} />
    </>
  ),
  governance: (
    <>
      <polygon points="20,7 32,14 8,14" fill="none" strokeWidth={SW} strokeLinejoin="round" />
      <line x1="12" y1="14" x2="12" y2="27" strokeWidth={SW} />
      <line x1="20" y1="14" x2="20" y2="27" strokeWidth={SW} />
      <line x1="28" y1="14" x2="28" y2="27" strokeWidth={SW} />
      <line x1="8" y1="30" x2="32" y2="30" strokeWidth={SW} />
    </>
  ),
  treaty: (
    <>
      <circle cx="16" cy="20" r="8" fill="none" strokeWidth={SW} />
      <circle cx="24" cy="20" r="8" fill="none" stroke="var(--accent)" strokeWidth={SW} />
    </>
  ),
  media: (
    <>
      <line x1="20" y1="14" x2="20" y2="32" strokeWidth={SW} />
      <polygon points="20,14 14,32 26,32" fill="none" strokeWidth={SW} strokeLinejoin="round" />
      <path d="M 13 12 A 9 9 0 0 1 27 12" fill="none" stroke="var(--accent)" strokeWidth={SW} />
      <path d="M 9 8 A 14 14 0 0 1 31 8" fill="none" strokeWidth={SW} />
      <circle cx="20" cy="14" r="2.2" stroke="none" />
    </>
  ),
  security: (
    <>
      <path
        d="M 20 7 L 31 11 L 31 20 Q 31 29 20 33 Q 9 29 9 20 L 9 11 Z"
        fill="none"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <line x1="20" y1="13" x2="20" y2="22" stroke="var(--accent)" strokeWidth={SW} />
    </>
  ),
  society: (
    <>
      <circle cx="14" cy="15" r="4.5" fill="none" strokeWidth={SW} />
      <path d="M 6 31 Q 6 22 14 22 Q 17 22 19 23.5" fill="none" strokeWidth={SW} />
      <circle cx="26" cy="15" r="4.5" fill="none" strokeWidth={SW} />
      <path d="M 21 23.5 Q 23 22 26 22 Q 34 22 34 31" fill="none" strokeWidth={SW} />
    </>
  ),
  economy: (
    <>
      <polyline
        points="8,30 15,22 20,26 31,12"
        fill="none"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <polygon points="31,12 25,13 30,19" fill="var(--accent)" stroke="none" />
      <line x1="8" y1="33" x2="32" y2="33" strokeWidth="2" />
    </>
  ),
  science: (
    <>
      <line x1="17" y1="8" x2="17" y2="17" strokeWidth={SW} />
      <line x1="23" y1="8" x2="23" y2="17" strokeWidth={SW} />
      <path
        d="M 17 17 L 10 30 Q 9 33 12 33 L 28 33 Q 31 33 30 30 L 23 17"
        fill="none"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <line x1="14" y1="26" x2="26" y2="26" stroke="var(--accent)" strokeWidth={SW} />
      <line x1="14" y1="8" x2="26" y2="8" strokeWidth={SW} />
    </>
  ),
  agents: (
    <>
      <rect x="8" y="10" width="24" height="20" rx="2" fill="none" strokeWidth={SW} />
      <polyline
        points="12,16 17,20 12,24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <line x1="20" y1="25" x2="27" y2="25" strokeWidth={SW} />
    </>
  ),
  diplomacy: (
    <>
      <circle cx="20" cy="20" r="12" fill="none" strokeWidth={SW} />
      <ellipse cx="20" cy="20" rx="5.5" ry="12" fill="none" strokeWidth="1.8" />
      <line x1="8" y1="20" x2="32" y2="20" strokeWidth="1.8" />
      <path
        d="M 10.5 14 A 12 12 0 0 1 29.5 14"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
      />
    </>
  ),
};

/** Every content tag collapses onto one of the twelve stamp families. */
const TAG_FAMILY: Record<string, string> = {
  chips: 'chips',
  subsidy: 'chips',
  substitution: 'chips',
  'industrial-policy': 'chips',
  compute: 'chips',
  chokepoint: 'chips',
  buildout: 'chips',
  infrastructure: 'chips',
  taiwan: 'chips',
  smuggling: 'chips',
  energy: 'energy',
  grid: 'energy',
  labor: 'labor',
  automation: 'labor',
  jobs: 'labor',
  welfare: 'labor',
  unrest: 'labor',
  governance: 'governance',
  legitimacy: 'governance',
  politics: 'governance',
  election: 'governance',
  liability: 'governance',
  regulation: 'governance',
  enforcement: 'governance',
  eu: 'governance',
  local: 'governance',
  transparency: 'governance',
  treaty: 'treaty',
  verification: 'treaty',
  pause: 'treaty',
  window: 'treaty',
  media: 'media',
  press: 'media',
  benchmarks: 'media',
  military: 'security',
  defense: 'security',
  security: 'security',
  espionage: 'security',
  escalation: 'security',
  natsec: 'security',
  covert: 'security',
  sabotage: 'security',
  secrecy: 'security',
  'dual-use': 'security',
  crisis: 'security',
  shock: 'security',
  society: 'society',
  trust: 'society',
  'companion-ai': 'society',
  education: 'society',
  economy: 'economy',
  markets: 'economy',
  insurance: 'economy',
  risk: 'economy',
  trade: 'economy',
  concentration: 'economy',
  safety: 'science',
  evals: 'science',
  research: 'science',
  interpretability: 'science',
  talent: 'science',
  labs: 'science',
  agents: 'agents',
  autonomy: 'agents',
  capability: 'agents',
  'open-weights': 'agents',
  takeoff: 'agents',
  milestone: 'agents',
  'fixed-beat': 'agents',
  diplomacy: 'diplomacy',
  alliance: 'diplomacy',
  allies: 'diplomacy',
  rival: 'diplomacy',
  race: 'diplomacy',
  pressure: 'diplomacy',
  exposure: 'diplomacy',
  diffusion: 'society',
};

export function stampFamily(tags: readonly string[]): string | null {
  for (const tag of tags) {
    const family = TAG_FAMILY[tag];
    if (family) {
      return family;
    }
  }
  return null;
}

export function TagStamp({ tags, size = 34 }: { tags: readonly string[]; size?: number }) {
  const family = stampFamily(tags);
  if (!family) {
    return null;
  }
  return (
    <svg
      className="tag-stamp"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      stroke="currentColor"
      fill="currentColor"
    >
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="3"
        fill="none"
        strokeWidth="2"
        strokeOpacity="0.85"
      />
      {GLYPHS[family]}
    </svg>
  );
}
