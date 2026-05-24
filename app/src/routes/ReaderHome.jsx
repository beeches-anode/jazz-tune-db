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

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading tunes…</div>;
  if (error) return <div className="p-8 text-center text-red-600">Failed to load: {error.message}</div>;

  // Mobile: list → full-screen detail
  if (isMobile) {
    if (selected) {
      return (
        <div className="flex flex-col h-screen">
          <div className="border-b border-zinc-200 bg-white p-3">
            <button onClick={() => setSelectedId(null)} className="text-sky-600 text-sm">← Back to list</button>
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
      <div className="w-1/3 max-w-md border-r border-zinc-200">
        <TuneList tunes={tunes} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div className="flex-1">
        {selected ? (
          <ReaderDetail tune={selected} />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400">
            Select a tune from the list
          </div>
        )}
      </div>
    </div>
  );
}
