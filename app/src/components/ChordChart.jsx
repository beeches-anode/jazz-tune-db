import { parseChords, transposeProgression } from '../utils/chordUtils';

export function ChordChart({ chords, transposeKey = 'Concert', sectionMarkers = [] }) {
  const transposed = transposeProgression(chords ?? '', transposeKey);
  const grid = parseChords(transposed);
  const markersByMeasure = new Map();
  for (const m of sectionMarkers) {
    markersByMeasure.set(m.start, m.label);
  }

  let measureIdx = 0;
  return (
    <div className="space-y-1">
      {grid.map((line, lineIdx) => {
        // Each line might have a section label above one of its measures
        const lineMarkers = [];
        for (let i = 0; i < line.length; i++) {
          measureIdx++;
          if (markersByMeasure.has(measureIdx)) {
            lineMarkers.push({ col: i, label: markersByMeasure.get(measureIdx) });
          }
        }
        return (
          <div key={lineIdx}>
            {lineMarkers.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-1">
                {Array.from({ length: 4 }).map((_, col) => {
                  const marker = lineMarkers.find(m => m.col === col);
                  return (
                    <div key={col} className="text-xs font-bold text-sky-700">
                      {marker?.label ?? ''}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {line.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className="border border-zinc-300 rounded px-2 py-2 min-h-[2.5rem] sm:min-h-[3rem] font-mono text-sm flex items-center justify-center bg-white"
                >
                  {cell}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
