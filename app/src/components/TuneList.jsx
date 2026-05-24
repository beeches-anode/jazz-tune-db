import { useState, useMemo } from 'react';
import { TuneCard } from './TuneCard';

export function TuneList({ tunes, selectedId, onSelect }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return tunes;
    const q = query.toLowerCase();
    return tunes.filter(t =>
      t.tune_name?.toLowerCase().includes(q) ||
      t.composer?.toLowerCase().includes(q)
    );
  }, [tunes, query]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-200 bg-white sticky top-0">
        <input
          type="search"
          placeholder="Search tunes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded text-base"
        />
        <div className="text-xs text-zinc-500 mt-1">{filtered.length} of {tunes.length}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map(tune => (
          <TuneCard
            key={tune.id}
            tune={tune}
            selected={tune.id === selectedId}
            onClick={() => onSelect(tune.id)}
          />
        ))}
      </div>
    </div>
  );
}
