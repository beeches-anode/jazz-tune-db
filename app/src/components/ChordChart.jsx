import { parseChords, transposeProgression, splitMeasure } from '../utils/chordUtils';
import { ChordSymbol } from './ChordSymbol';

// Lead-sheet grid: 4 measures per row, measure numbers in a left gutter,
// section letters in red, double bars where a section starts.
export function ChordChart({ chords, transposeKey = 'Concert', sectionMarkers = [] }) {
  const grid = parseChords(transposeProgression(chords ?? '', transposeKey));
  const markersByMeasure = new Map(sectionMarkers.map((m) => [m.start, m.label]));

  let measureIdx = 0;
  return (
    <div className="flex flex-col">
      {grid.map((line, lineIdx) => {
        const firstMeasure = measureIdx + 1;
        const lineMarkers = [];
        for (let i = 0; i < line.length; i++) {
          measureIdx++;
          if (markersByMeasure.has(measureIdx)) {
            lineMarkers.push({ col: i, label: markersByMeasure.get(measureIdx) });
          }
        }
        const gutterLabel = lineMarkers.find((m) => m.col === 0)?.label;
        const inlineMarkers = lineMarkers.filter((m) => m.col > 0);
        const isLast = lineIdx === grid.length - 1;

        return (
          <div
            key={lineIdx}
            data-section-start={gutterLabel ? '' : undefined}
            className={`flex items-stretch border-rule ${gutterLabel ? 'border-t-[3px] border-double' : 'border-t'} ${
              isLast ? 'border-b-[3px] border-double' : ''
            }`}
          >
            <div className="w-10 sm:w-14 shrink-0 flex flex-col justify-center gap-0.5 pr-2 sm:pr-3">
              {gutterLabel && (
                <span data-section className="text-[22px] font-black leading-none tracking-[-0.03em] text-accent">
                  {gutterLabel}
                </span>
              )}
              <span data-measure-number className="text-[11px] leading-none text-muted-soft tabular-nums">
                {firstMeasure}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-4">
              {line.map((cell, colIdx) => {
                const inline = inlineMarkers.find((m) => m.col === colIdx);
                return (
                  <div
                    key={colIdx}
                    data-measure
                    className={`relative flex items-center gap-3 sm:gap-4 h-14 px-2 sm:px-3.5 border-l border-rule ${
                      colIdx === line.length - 1 ? 'border-r' : ''
                    } text-lg sm:text-2xl font-extrabold tracking-[-0.02em] leading-none`}
                  >
                    {inline && (
                      <span data-section className="absolute top-1 left-2 text-[11px] font-black leading-none text-accent">
                        {inline.label}
                      </span>
                    )}
                    {splitMeasure(cell).map((token, i) => (
                      <ChordSymbol key={i} token={token} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
