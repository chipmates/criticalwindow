import { useState } from 'react';
import sourcesJson from '../../../data/sources.json';
import { t } from '../i18n';
import { useStore } from '../store';

interface SourceEntry {
  id: string;
  title: string;
  org: string;
  year: number;
  type: string;
  status: string;
  gameUse: string;
  url?: string;
  flagReason?: string;
}

const SOURCES = (sourcesJson as { sources: SourceEntry[] }).sources;

/**
 * The registry, browsable: the proof behind "every number cites a source".
 * Ships inside the bundle (zero runtime fetches); external links open in a
 * new tab. Flagged entries are labeled honestly; that is the point.
 */
export function Sources() {
  const goTo = useStore((s) => s.goTo);
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();
  const shown = trimmed
    ? SOURCES.filter((s) =>
        [s.id, s.title, s.org, s.gameUse].some((field) => field.toLowerCase().includes(trimmed)),
      )
    : SOURCES;

  return (
    <main className="help-screen sources-screen">
      <header className="debrief-head">
        <p className="title-kicker">{t('sources.kicker')}</p>
        <h1>{t('sources.heading')}</h1>
        <p className="panel-explain">{t('sources.body', { count: SOURCES.length })}</p>
        <p className="sources-legend">{t('sources.legend')}</p>
        <button type="button" className="btn" onClick={() => goTo('title')}>
          ← {t('help.back')}
        </button>
      </header>

      <div className="seed-row">
        <label className="seed-label" htmlFor="source-search">
          {t('sources.search')}
        </label>
        <input
          id="source-search"
          className="seed-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="sources-list">
        {shown.map((source) => (
          <li key={source.id} className="panel source-entry">
            <div className="source-head">
              <span className="source-id">{source.id}</span>
              <span className={`source-status source-status-${source.status}`}>
                {source.status}
              </span>
            </div>
            <p className="source-title">
              {source.url ? (
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              ) : (
                source.title
              )}
            </p>
            <p className="source-meta">
              {source.org} · {source.year} · {source.type}
            </p>
            <p className="source-use">{source.gameUse}</p>
            {source.flagReason && <p className="source-flag-reason">{source.flagReason}</p>}
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="panel-explain">{t('sources.none')}</p>}
    </main>
  );
}
