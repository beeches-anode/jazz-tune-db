export const ALLOWED_FIELDS = new Set([
  'tune_name', 'composer', 'lyricist', 'year', 'style', 'rank',
  'standard_key', 'form', 'history_and_facts', 'famous_recordings',
  'chords', 'section_markers', 'youtube_video_ids',
  'youtube_backing_track_ids', 'spotify_playlist_id',
  'chord_progression_notes', 'is_approved', 'is_archived', 'last_updated',
]);

const TYPES = {
  tune_name: 'string', composer: 'string', lyricist: 'string',
  year: 'integer', style: 'string', rank: 'integer',
  standard_key: 'string', form: 'string', history_and_facts: 'string',
  famous_recordings: 'array', chords: 'string',
  section_markers: 'array', youtube_video_ids: 'array',
  youtube_backing_track_ids: 'array', spotify_playlist_id: 'string',
  chord_progression_notes: 'string',
  is_approved: 'boolean', is_archived: 'boolean', last_updated: 'string',
};

function checkType(value, type) {
  if (type === 'string') return typeof value === 'string';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'boolean') return typeof value === 'boolean';
  return false;
}

export function validateTuneUpdate(updates) {
  if ('id' in updates) {
    return { valid: false, errors: ['id is immutable'], warnings: [], sanitized: null };
  }
  const sanitized = {};
  const errors = [];
  const warnings = [];
  for (const [k, v] of Object.entries(updates)) {
    if (!ALLOWED_FIELDS.has(k)) {
      warnings.push(`unknown field '${k}' stripped`);
      continue;
    }
    if (TYPES[k] && !checkType(v, TYPES[k])) {
      errors.push(`${k} must be ${TYPES[k] === 'integer' ? 'an integer' : `a ${TYPES[k]}`}`);
      continue;
    }
    sanitized[k] = v;
  }
  return { valid: errors.length === 0, errors, warnings, sanitized };
}

export function validateNewTune(tune) {
  if (!tune.tune_name || typeof tune.tune_name !== 'string') {
    return { valid: false, errors: ['tune_name is required'] };
  }
  if (!tune.composer || typeof tune.composer !== 'string') {
    return { valid: false, errors: ['composer is required'] };
  }
  return { valid: true, errors: [] };
}
