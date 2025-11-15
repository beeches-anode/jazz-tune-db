import { useMemo } from 'react';
import { countMeasures, generateSectionMarkers } from '../../utils/chordUtils';
import { Button } from '../shared/Button';

export const SectionMarkerBuilder = ({ chords, form, sectionMarkers, onChange }) => {
  const measureCount = useMemo(() => countMeasures(chords), [chords]);

  const handleAutoGenerate = () => {
    const generated = generateSectionMarkers(measureCount, form);
    if (generated.length > 0) {
      onChange(generated);
    } else {
      alert('Could not auto-generate section markers. Please add them manually.');
    }
  };

  const handleAddSection = () => {
    const newSection = {
      label: 'A',
      start: sectionMarkers.length > 0
        ? sectionMarkers[sectionMarkers.length - 1].end + 1
        : 1,
      end: measureCount,
    };
    onChange([...sectionMarkers, newSection]);
  };

  const handleUpdateSection = (index, field, value) => {
    const updated = [...sectionMarkers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemoveSection = (index) => {
    const updated = sectionMarkers.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Section Markers</h3>
          <p className="text-xs text-gray-500 mt-1">
            Total measures: {measureCount}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleAutoGenerate}>
            Auto-Generate
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddSection}>
            Add Section
          </Button>
        </div>
      </div>

      {/* Visual representation */}
      {sectionMarkers.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex gap-1">
            {sectionMarkers.map((section, idx) => (
              <div
                key={idx}
                className="flex-1 bg-jazz-blue text-white text-center py-2 rounded"
                title={`${section.label}: measures ${section.start}-${section.end}`}
              >
                <div className="font-bold">{section.label}</div>
                <div className="text-xs">{section.start}-{section.end}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-3">
        {sectionMarkers.map((section, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={section.label}
                  onChange={(e) => handleUpdateSection(idx, 'label', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue text-sm"
                  placeholder="A"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start
                </label>
                <input
                  type="number"
                  value={section.start}
                  onChange={(e) => handleUpdateSection(idx, 'start', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue text-sm"
                  min="1"
                  max={measureCount}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End
                </label>
                <input
                  type="number"
                  value={section.end}
                  onChange={(e) => handleUpdateSection(idx, 'end', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue text-sm"
                  min="1"
                  max={measureCount}
                />
              </div>
            </div>
            <button
              onClick={() => handleRemoveSection(idx)}
              className="text-red-600 hover:text-red-800 p-2"
              title="Remove section"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {sectionMarkers.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No section markers defined. Click "Auto-Generate" or "Add Section" to get started.
        </div>
      )}
    </div>
  );
};
