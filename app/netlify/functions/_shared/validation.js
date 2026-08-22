export const ALLOWED_FIELDS = new Set([
  'tune_name', 'composer', 'lyricist', 'year', 'style', 'rank',
  'standard_key', 'alternate_keys', 'form', 'history_and_facts', 'famous_recordings',
  'chords', 'section_markers', 'youtube_video_ids',
  'youtube_backing_track_ids', 'spotify_playlist_id',
  'chord_progression_notes', 'curator_notes', 'validated',
  'is_approved', 'is_archived', 'last_updated',
]);

const TYPES = {
  tune_name: 'string', composer: 'string', lyricist: 'string',
  year: 'integer', style: 'string', rank: 'integer',
  standard_key: 'string', alternate_keys: 'array', form: 'string',
  history_and_facts: 'string',
  famous_recordings: 'array', chords: 'string',
  section_markers: 'array', youtube_video_ids: 'array',
  youtube_backing_track_ids: 'array', spotify_playlist_id: 'string',
  chord_progression_notes: 'string', curator_notes: 'string',
  validated: 'boolean',
  is_approved: 'boolean', is_archived: 'boolean', last_updated: 'string',
};

export const KEY_QUALITIES = ['major', 'minor', 'blues', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian'];
const QUALITY_ALT = KEY_QUALITIES.join('|');
export const KEY_REGEX = new RegExp(`^[A-G][b#]? (${QUALITY_ALT})$`);
const KEY_PARSE_REGEX = new RegExp(`^([A-G][b#]?) (${QUALITY_ALT})$`);
export const UNCONVENTIONAL_ROOTS = new Set(['A#', 'D#', 'B#', 'E#', 'Cb', 'Fb']);

export function parseKey(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(KEY_PARSE_REGEX);
  return m ? { root: m[1], quality: m[2] } : null;
}

export function validateStandardKey(value) {
  const errors = [];
  const warnings = [];
  if (typeof value !== 'string') {
    errors.push('standard_key must be a string');
    return { errors, warnings };
  }
  if (value === '') return { errors, warnings };
  const parsed = parseKey(value);
  if (!parsed) {
    errors.push(`standard_key "${value}" must be "<root> <quality>", e.g. "C major", "F blues", "D dorian" (qualities: ${KEY_QUALITIES.join(', ')})`);
    return { errors, warnings };
  }
  if (UNCONVENTIONAL_ROOTS.has(parsed.root)) {
    warnings.push(`standard_key root "${parsed.root}" is unconventional — prefer its enharmonic equivalent`);
  }
  return { errors, warnings };
}

export function validateAlternateKeys(value, standardKey) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(value)) {
    errors.push('alternate_keys must be an array');
    return { errors, warnings };
  }
  const seen = new Set();
  value.forEach((entry, i) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`alternate_keys[${i}] must be an object with key and context`);
      return;
    }
    const extra = Object.keys(entry).filter((k) => k !== 'key' && k !== 'context');
    if (extra.length > 0) {
      errors.push(`alternate_keys[${i}] has unknown properties: ${extra.join(', ')}`);
    }
    const parsed = typeof entry.key === 'string' ? parseKey(entry.key) : null;
    if (!parsed) {
      errors.push(`alternate_keys[${i}].key "${entry.key}" must match the canonical key format`);
    } else if (UNCONVENTIONAL_ROOTS.has(parsed.root)) {
      warnings.push(`alternate_keys[${i}].key root "${parsed.root}" is unconventional — prefer its enharmonic equivalent`);
    }
    if (typeof entry.context !== 'string' || entry.context.trim() === '') {
      errors.push(`alternate_keys[${i}].context must be a non-empty string`);
    }
    const sig = `${entry.key} ${entry.context}`;
    if (seen.has(sig)) {
      errors.push(`alternate_keys[${i}] duplicates an earlier entry ("${entry.key}")`);
    }
    seen.add(sig);
    if (typeof standardKey === 'string' && standardKey !== '' && entry.key === standardKey) {
      warnings.push(`alternate_keys[${i}].key equals standard_key — ensure the context explains why it is listed`);
    }
  });
  return { errors, warnings };
}

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
  if ('standard_key' in sanitized) {
    const r = validateStandardKey(sanitized.standard_key);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  if ('alternate_keys' in sanitized) {
    const r = validateAlternateKeys(sanitized.alternate_keys, sanitized.standard_key);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
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
