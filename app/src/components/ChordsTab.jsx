import { useState } from 'react';
import { ChordChart } from './ChordChart';
import { SectionMarkerBadges } from './SectionMarkerBadges';
import { LABEL, SMALL_CAPS } from './styles';

// `key` feeds transposeProgression; `label` is what the player reads.
const TRANSPOSE_OPTIONS = [
  { key: 'Concert', label: 'Concert' },
  { key: 'Bb', label: 'B♭' },
  { key: 'Eb', label: 'E♭' },
];

export function ChordsTab({ tune }) {
  const [transposeKey, setTransposeKey] = useState('Concert');

  return (
    <div className="px-4 sm:px-10 py-7 flex flex-col gap-5">
      {tune.form && (
        <div className="flex flex-col gap-2.5 max-w-[800px]">
          <h3 className={LABEL}>Form &amp; Structure</h3>
          <p className="text-sm leading-relaxed text-pretty">{tune.form}</p>
          <SectionMarkerBadges markers={tune.section_markers} />
        </div>
      )}

      <div className={`flex items-center gap-4 ${SMALL_CAPS}`}>
        <span className="text-muted">Transpose</span>
        {TRANSPOSE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTransposeKey(key)}
            aria-pressed={transposeKey === key}
            className={`pb-0.5 border-b-2 transition-colors ${
              transposeKey === key ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ChordChart chords={tune.chords} transposeKey={transposeKey} sectionMarkers={tune.section_markers ?? []} />

      {tune.chord_progression_notes && (
        <p className="text-xs leading-relaxed text-muted max-w-[800px] text-pretty">{tune.chord_progression_notes}</p>
      )}
    </div>
  );
}
