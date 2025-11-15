import { useMemo } from 'react';
import { validateChordProgression, countMeasures } from '../../utils/chordUtils';

export const ChordEditor = ({ chords, onChange }) => {
  const validation = useMemo(() => validateChordProgression(chords), [chords]);
  const measureCount = useMemo(() => countMeasures(chords), [chords]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Chord Progression <span className="text-red-500">*</span>
          </label>
          <div className="text-sm text-gray-600">
            {measureCount} {measureCount === 1 ? 'measure' : 'measures'}
          </div>
        </div>

        <textarea
          value={chords}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue font-mono text-sm"
          placeholder="| Cmaj7 | Dm7 | Em7 | Fmaj7 |"
        />

        {/* Validation feedback */}
        {!validation.valid && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-1">Validation Errors:</div>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.valid && chords && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">✓ Chord progression looks good!</div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <div className="font-medium mb-2">Format Guidelines:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Start and end each line with <code className="bg-gray-200 px-1 rounded">|</code></li>
          <li>Separate measures with <code className="bg-gray-200 px-1 rounded">|</code></li>
          <li>Separate chords within a measure with spaces</li>
          <li>Use line breaks (Enter) to separate lines visually</li>
          <li>Example: <code className="bg-gray-200 px-1 rounded">| Cmaj7 | Dm7 G7 | Cmaj7 |</code></li>
        </ul>
      </div>
    </div>
  );
};
