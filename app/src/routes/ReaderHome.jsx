import { useState } from 'react';
import { useTunes } from '../hooks/useTunes';
import { useViewport } from '../hooks/useViewport';
import { TuneList } from '../components/TuneList';
import { ReaderDetail } from './ReaderDetail';

export function ReaderHome() {
  const { tunes, loading, error } = useTunes();
  const { isMobile } = useViewport();
  const [selectedId, setSelectedId] = useState(null);

  const selected = tunes.find(t => t.id === selectedId);

  if (loading) return <div className="p-8 text-center text-muted">Loading tunes…</div>;
  if (error) return <div className="p-8 text-center text-ink font-semibold">Failed to load: {error.message}</div>;

  // Mobile: list → full-screen detail
  if (isMobile) {
    if (selected) {
      return (
        <div className="flex flex-col h-screen">
          <div className="border-b border-rule bg-paper px-2">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 min-h-[44px] px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to list
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ReaderDetail tune={selected} />
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen">
        <TuneList tunes={tunes} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    );
  }

  // Laptop: master-detail
  return (
    <div className="flex h-screen">
      <div className="w-1/3 max-w-md border-r border-rule">
        <TuneList tunes={tunes} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div className="flex-1">
        {selected ? (
          <ReaderDetail tune={selected} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted">
            Select a tune from the list
          </div>
        )}
      </div>
    </div>
  );
}
