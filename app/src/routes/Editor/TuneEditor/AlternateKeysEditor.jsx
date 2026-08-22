import { useEffect, useState } from 'react';
import { KEY_REGEX } from '../../../../netlify/functions/_shared/validation.js';

const rowComplete = (r) => KEY_REGEX.test(r.key) && r.context.trim() !== '';

export const AlternateKeysEditor = ({ tuneId, value, onChange }) => {
  const [rows, setRows] = useState(value || []);

  // Re-sync local state only when switching tunes — not on every save echo,
  // which would wipe half-typed rows.
  useEffect(() => {
    setRows(value || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuneId]);

  const emit = (next) => {
    setRows(next);
    onChange(next.filter(rowComplete));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Alternate Keys
      </label>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const keyBad = row.key !== '' && !KEY_REGEX.test(row.key);
          return (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={row.key}
                onChange={(e) => emit(rows.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue ${
                  keyBad ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="C major"
              />
              <input
                type="text"
                value={row.context}
                onChange={(e) => emit(rows.map((r, j) => (j === i ? { ...r, context: e.target.value } : r)))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
                placeholder="why (e.g. common vocal call key)"
              />
              <button
                type="button"
                aria-label={`Remove alternate key ${i + 1}`}
                onClick={() => emit(rows.filter((_, j) => j !== i))}
                className="px-2 py-2 text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => emit([...rows, { key: '', context: '' }])}
        className="mt-2 text-sm text-jazz-blue hover:underline"
      >
        + Add alternate key
      </button>
    </div>
  );
};
