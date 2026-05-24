import { useState } from 'react';
import { ChordChart } from './ChordChart';
import { SectionMarkerBadges } from './SectionMarkerBadges';

const TRANSPOSE_OPTIONS = ['Concert', 'Bb', 'Eb'];

export function ChordsTab({ tune }) {
  const [transposeKey, setTransposeKey] = useState('Concert');

  return (
    <div className="px-3 sm:px-5 py-4 space-y-4">
      {tune.form && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">Form &amp; Structure</h3>
          <p className="text-zinc-700 text-sm">{tune.form}</p>
          <div className="mt-2">
            <SectionMarkerBadges markers={tune.section_markers} />
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Transpose:</span>
          {TRANSPOSE_OPTIONS.map(key => (
            <button
              key={key}
              onClick={() => setTransposeKey(key)}
              className={`px-3 py-1 text-xs rounded font-medium ${
                transposeKey === key
                  ? 'bg-sky-500 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <ChordChart chords={tune.chords} transposeKey={transposeKey} sectionMarkers={tune.section_markers ?? []} />
      </div>

      {tune.chord_progression_notes && (
        <p className="text-xs text-zinc-500 italic">{tune.chord_progression_notes}</p>
      )}
    </div>
  );
}
