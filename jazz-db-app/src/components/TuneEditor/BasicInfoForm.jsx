const STYLES = [
  'swing', 'bebop', 'ballad', 'bossa nova', 'blues', 'latin', 'modal', 'fusion', 'waltz', 'other'
];

const TIME_SIGNATURES = ['4/4', '3/4', '5/4', '6/8', '7/4', '12/8'];

export const BasicInfoForm = ({ tune, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Tune Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tune Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tune.tune_name || ''}
          onChange={(e) => onChange('tune_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="There Will Never Be Another You"
        />
      </div>

      {/* Composer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Composer <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tune.composer || ''}
          onChange={(e) => onChange('composer', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="Harry Warren"
        />
      </div>

      {/* Lyricist */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lyricist
        </label>
        <input
          type="text"
          value={tune.lyricist || ''}
          onChange={(e) => onChange('lyricist', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="Mack Gordon"
        />
      </div>

      {/* Year */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Year <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={tune.year || ''}
          onChange={(e) => onChange('year', parseInt(e.target.value) || '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="1942"
          min="1900"
          max="2025"
        />
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Style <span className="text-red-500">*</span>
        </label>
        <select
          value={tune.style || ''}
          onChange={(e) => onChange('style', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
        >
          <option value="">Select a style...</option>
          {STYLES.map(style => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Form
        </label>
        <input
          type="text"
          value={tune.form || ''}
          onChange={(e) => onChange('form', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="32-bar AABA"
        />
      </div>

      {/* Standard Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Standard Key
        </label>
        <input
          type="text"
          value={tune.standard_key || ''}
          onChange={(e) => onChange('standard_key', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="Eb major"
        />
      </div>

      {/* Tempo Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tempo Range
        </label>
        <input
          type="text"
          value={tune.tempo_range || ''}
          onChange={(e) => onChange('tempo_range', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
          placeholder="120-160 BPM"
        />
      </div>

      {/* Time Signature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Signature
        </label>
        <select
          value={tune.time_signature || '4/4'}
          onChange={(e) => onChange('time_signature', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
        >
          {TIME_SIGNATURES.map(sig => (
            <option key={sig} value={sig}>{sig}</option>
          ))}
        </select>
      </div>

      {/* History and Facts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          History & Facts
        </label>
        <textarea
          value={tune.history_and_facts || ''}
          onChange={(e) => onChange('history_and_facts', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue font-mono text-sm"
          placeholder="Enter the history and interesting facts about this tune..."
        />
      </div>

      {/* Curator Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Curator Notes <span className="text-xs text-gray-500">(Private)</span>
        </label>
        <textarea
          value={tune.curator_notes || ''}
          onChange={(e) => onChange('curator_notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue text-sm"
          placeholder="Private notes for the curator..."
        />
      </div>
    </div>
  );
};
