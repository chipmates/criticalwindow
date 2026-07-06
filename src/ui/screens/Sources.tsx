import { useEffect, useState } from 'react';
import sourcesJson from '../../../data/sources.json';
import usageJson from '../generated/source-usage.json';
import { t } from '../i18n';
import { gameData, useStore } from '../store';

interface SourceEntry {
  id: string;
  title: string;
  authors?: string;
  org?: string;
  year?: number;
  type: string;
  status: string;
  tier: 'load-bearing' | 'background' | 'library';
  evidenceClass: 'empirical' | 'forecast' | 'analysis' | 'design';
  gameUse?: string;
  shaped?: string;
  whyListed?: string;
  url?: string;
  flagReason?: string;
}

interface UsageView {
  counts: { loadBearing: number; background: number; library: number; citationSites: number };
  uses: Record<string, string[]>;
}

const SOURCES = (sourcesJson as unknown as { sources: SourceEntry[] }).sources;
const USAGE = usageJson as UsageView;

/** How many citation sites an entry shows before folding into "+N more". */
const MAX_SITES = 3;

const CLASS_LABEL_KEY = {
  empirical: 'sources.class.empirical',
  forecast: 'sources.class.forecast',
  analysis: 'sources.class.analysis',
  design: 'sources.class.design',
} as const;

function matches(source: SourceEntry, query: string): boolean {
  return [
    source.id,
    source.title,
    source.org ?? '',
    source.gameUse ?? '',
    source.shaped ?? '',
    source.whyListed ?? '',
  ].some((field) => field.toLowerCase().includes(query));
}

function Entry({ source }: { source: SourceEntry }) {
  const sites = USAGE.uses[source.id] ?? [];
  const claim = source.gameUse ?? source.shaped ?? source.whyListed;
  return (
    <li className="panel source-entry">
      <div className="source-head">
        <span className="source-id">{source.id}</span>
        <span className="source-badge">{t(CLASS_LABEL_KEY[source.evidenceClass])}</span>
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
        {[source.org, source.year, source.type].filter(Boolean).join(' · ')}
      </p>
      {claim && <p className="source-use">{claim}</p>}
      {source.tier === 'load-bearing' && sites.length > 0 && (
        <p className="source-sites">
          {t('sources.cited', { count: sites.length })} {sites.slice(0, MAX_SITES).join(' · ')}
          {sites.length > MAX_SITES && ` ${t('sources.more', { count: sites.length - MAX_SITES })}`}
        </p>
      )}
      {source.flagReason && <p className="source-note">{source.flagReason}</p>}
    </li>
  );
}

interface Section {
  titleKey: 'sources.section.load' | 'sources.section.background' | 'sources.section.library';
  explainKey:
    | 'sources.section.load.explain'
    | 'sources.section.background.explain'
    | 'sources.section.library.explain';
  entries: SourceEntry[];
}

const SECTIONS: Section[] = [
  {
    titleKey: 'sources.section.load',
    explainKey: 'sources.section.load.explain',
    entries: SOURCES.filter((s) => s.tier === 'load-bearing').sort(
      (a, b) => (USAGE.uses[b.id]?.length ?? 0) - (USAGE.uses[a.id]?.length ?? 0),
    ),
  },
  {
    titleKey: 'sources.section.background',
    explainKey: 'sources.section.background.explain',
    entries: SOURCES.filter((s) => s.tier === 'background'),
  },
  {
    titleKey: 'sources.section.library',
    explainKey: 'sources.section.library.explain',
    entries: SOURCES.filter((s) => s.tier === 'library'),
  },
];

/**
 * The evidence map, browsable in the game: which sources set the numbers
 * (and where), which shaped the design, which are the shelf. Everything
 * ships inside the bundle (zero runtime fetches); external links open in
 * a new tab. Flagged entries are labeled honestly; that is the point.
 */
export function Sources() {
  const goBack = useStore((s) => s.goBack);
  const sourcesQuery = useStore((s) => s.sourcesQuery);
  const setSourcesQuery = useStore((s) => s.setSourcesQuery);
  // A chip elsewhere can hand us a search term; consume it once, then clear so
  // it never re-applies on a later visit.
  const [query, setQuery] = useState(sourcesQuery ?? '');
  useEffect(() => {
    if (sourcesQuery !== null) {
      setSourcesQuery(null);
    }
  }, [sourcesQuery, setSourcesQuery]);
  const trimmed = query.trim().toLowerCase();
  const data = gameData();

  return (
    <main className="help-screen sources-screen">
      <header className="debrief-head">
        <p className="title-kicker">{t('sources.kicker')}</p>
        <h1>{t('sources.heading')}</h1>
        <p className="panel-explain">
          {t('sources.body', {
            loadBearing: USAGE.counts.loadBearing,
            sites: USAGE.counts.citationSites,
            background: USAGE.counts.background,
            library: USAGE.counts.library,
          })}
        </p>
        <p className="sources-legend">{t('sources.classes')}</p>
        <p className="sources-legend">{t('sources.legend')}</p>
        <button type="button" className="btn" onClick={() => goBack()}>
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

      {SECTIONS.map((section) => {
        const shown = trimmed
          ? section.entries.filter((s) => matches(s, trimmed))
          : section.entries;
        if (shown.length === 0) {
          return null;
        }
        return (
          <section key={section.titleKey} className="sources-section">
            <h2>{t(section.titleKey, { count: shown.length })}</h2>
            <p className="sources-section-explain">{t(section.explainKey)}</p>
            <ul className="sources-list">
              {shown.map((source) => (
                <Entry key={source.id} source={source} />
              ))}
            </ul>
          </section>
        );
      })}
      {trimmed && SECTIONS.every((s) => s.entries.every((e) => !matches(e, trimmed))) && (
        <p className="panel-explain">{t('sources.none')}</p>
      )}

      <p className="sources-legend sources-build">
        {t('sources.dataVersion', { hash: data.dataVersion })}
      </p>
    </main>
  );
}
