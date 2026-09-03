import { useState, useMemo } from 'react';
import { TuneCard } from './TuneCard';
import { SMALL_CAPS, CHIP } from './styles';

const SORTS = [
  { id: 'rank', label: 'Rank', cmp: (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999) },
  { id: 'name', label: 'A–Z', cmp: (a, b) => (a.tune_name ?? '').localeCompare(b.tune_name ?? '') },
  { id: 'composer', label: 'Composer', cmp: (a, b) => (a.composer ?? '').localeCompare(b.composer ?? '') },
  { id: 'year', label: 'Year', cmp: (a, b) => (a.year ?? 9999) - (b.year ?? 9999) },
];

// Top five styles by count. Matched case-insensitively — the data has
// "Ballad" and "ballad" side by side and we are not normalising it here.
const STYLE_CHIPS = ['ballad', 'swing', 'bebop', 'hard bop', 'bossa nova'];

export function TuneList({ tunes, selectedId, onSelect, showMasthead = true }) {
  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState('rank');
  const [style, setStyle] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const { cmp } = SORTS.find((s) => s.id === sortId);
    return tunes
      .filter((t) => !q || t.tune_name?.toLowerCase().includes(q) || t.composer?.toLowerCase().includes(q))
      .filter((t) => !style || t.style?.trim().toLowerCase() === style)
      .slice()
      .sort(cmp);
  }, [tunes, query, sortId, style]);

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="sticky top-0 bg-paper">
        {/* Masthead */}
        {showMasthead && (
          <div className="flex items-end justify-between px-4 pt-5 pb-3 border-b border-rule">
            <div className="text-3xl font-black uppercase leading-none tracking-[-0.035em]">Jazz Tunes</div>
            <div className="flex items-center gap-3.5">
              <span className={`${SMALL_CAPS} text-muted`}>{tunes.length} tunes</span>
              <a href="/edit" aria-label="Edit tunes" className="text-ink hover:text-ink/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2.5 px-4 h-[46px] border-b border-rule">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search tunes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-muted-soft focus:outline-none"
          />
          <span className={`${SMALL_CAPS} text-muted whitespace-nowrap`}>{filtered.length} of {tunes.length}</span>
        </div>

        {/* Sort */}
        <div className={`flex items-center gap-4 px-4 h-9 border-b border-rule ${SMALL_CAPS}`}>
          <span className="text-muted">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSortId(s.id)}
              aria-pressed={sortId === s.id}
              className={`pb-0.5 -mb-0.5 border-b-2 transition-colors ${
                sortId === s.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Style chips */}
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-rule">
          <button
            onClick={() => setStyle(null)}
            aria-pressed={style === null}
            className={`${CHIP} ${style === null ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5'}`}
          >
            All
          </button>
          {STYLE_CHIPS.map((s) => (
            <button
              key={s}
              data-style-chip={s}
              onClick={() => setStyle(style === s ? null : s)}
              aria-pressed={style === s}
              className={`${CHIP} ${style === s ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5'}`}
            >
              {s}
            </button>
          ))}
          <span className={`${CHIP} border-transparent text-muted`}>+ more</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((tune) => (
          <TuneCard key={tune.id} tune={tune} selected={tune.id === selectedId} onClick={() => onSelect(tune.id)} />
        ))}
      </div>
    </div>
  );
}
