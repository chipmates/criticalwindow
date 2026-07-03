/**
 * D1 token demo (dev-only page /design.html): every theme, the type system,
 * and the race-track centerpiece in three game states. This page is the
 * design review artifact; screenshot it per theme.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RaceTrack } from '../ui/components/RaceTrack';
import '../ui/theme.css';

const THEMES = ['light', 'dark', 'contrast'] as const;

function Meter({ token, label, value }: { token: string; label: string; value: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr 48px',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{label}</span>
      <div style={{ height: 8, background: 'var(--surface-sunken)', borderRadius: 4 }}>
        <div
          style={{
            width: `${value / 10}%`,
            height: '100%',
            borderRadius: 4,
            background: `var(${token})`,
          }}
        />
      </div>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)' }}>{value}</span>
    </div>
  );
}

function Demo() {
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('dark');
  document.documentElement.dataset.theme = theme;
  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 24, display: 'grid', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)' }}>Race Conditions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                minHeight: 'var(--target)',
                padding: '0 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--rule)',
                background: t === theme ? 'var(--accent)' : 'var(--surface)',
                color: t === theme ? 'var(--accent-ink)' : 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          display: 'grid',
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            borderBottom: '2px solid var(--rule-strong)',
            paddingBottom: 6,
          }}
        >
          THE WIRE · Q3 2027 · TURN 5 OF 16
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>She Kept the Receipts</h2>
        <p style={{ margin: 0, color: 'var(--ink)' }}>
          A senior safety engineer just told a Senate committee that red-flag eval results were
          buried to hit a launch date. She has documents. The lab calls it a misunderstanding of
          context.
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
          Sources: SRC-RIGHT-TO-WARN · SRC-SLEEPER
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{
              minHeight: 'var(--target)',
              padding: '0 16px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Open an investigation
          </button>
          <button
            style={{
              minHeight: 'var(--target)',
              padding: '0 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--rule)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            Back the lab
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <h3 style={{ fontSize: 'var(--text-lg)' }}>Early game, wide band</h3>
        <RaceTrack you={350} rival={300} fogFrom={800} threshold={1000} bandWidth={400} />
        <h3 style={{ fontSize: 'var(--text-lg)' }}>Approaching the fog, band narrowed</h3>
        <RaceTrack you={720} rival={640} fogFrom={800} threshold={1000} bandWidth={150} />
        <h3 style={{ fontSize: 'var(--text-lg)' }}>Racing blind</h3>
        <RaceTrack you={860} rival={790} fogFrom={800} threshold={1000} bandWidth={380} />
      </section>

      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          display: 'grid',
          gap: 10,
        }}
      >
        <h3 style={{ fontSize: 'var(--text-lg)' }}>The country</h3>
        <Meter token="--m-capability" label="Capability" value={350} />
        <Meter token="--m-safety" label="Safety Insight" value={200} />
        <Meter token="--m-diffusion" label="Diffusion" value={250} />
        <Meter token="--m-trust" label="Public Trust" value={400} />
        <Meter token="--m-unrest" label="Unrest" value={150} />
        <Meter token="--m-energy" label="Energy" value={450} />
        <Meter token="--m-capital" label="Capital" value={750} />
        <Meter token="--m-rival" label="Rival Capability" value={300} />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
