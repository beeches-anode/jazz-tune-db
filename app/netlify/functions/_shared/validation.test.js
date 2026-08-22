import { describe, it, expect } from 'vitest';
import {
  validateTuneUpdate, ALLOWED_FIELDS,
  KEY_REGEX, parseKey, validateStandardKey, validateAlternateKeys,
} from './validation';

describe('validateTuneUpdate', () => {
  it('accepts valid update', () => {
    const result = validateTuneUpdate({ tune_name: 'New Name', composer: 'Someone' });
    expect(result.valid).toBe(true);
  });

  it('rejects update with id mutation', () => {
    const result = validateTuneUpdate({ id: 'new-id', tune_name: 'X' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id is immutable');
  });

  it('strips unknown fields', () => {
    const result = validateTuneUpdate({ tune_name: 'X', bogus_field: 'y' });
    expect(result.valid).toBe(true);
    expect(result.sanitized).not.toHaveProperty('bogus_field');
    expect(result.warnings).toContain("unknown field 'bogus_field' stripped");
  });

  it('rejects wrong types', () => {
    const result = validateTuneUpdate({ year: 'not a number' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('year must be an integer');
  });

  it('accepts is_archived as boolean', () => {
    const result = validateTuneUpdate({ is_archived: true });
    expect(result.valid).toBe(true);
  });

  it('accepts validated as boolean', () => {
    const result = validateTuneUpdate({ validated: true });
    expect(result.valid).toBe(true);
    expect(result.sanitized).toHaveProperty('validated', true);
  });
});

describe('canonical key format', () => {
  it.each([
    'C major', 'Eb minor', 'F blues', 'D dorian',
    'F# mixolydian', 'Bb lydian', 'C# phrygian', 'G locrian',
  ])('accepts %s', (k) => {
    expect(validateStandardKey(k).errors).toEqual([]);
  });

  it('accepts empty string (keyless tune)', () => {
    expect(validateStandardKey('').errors).toEqual([]);
  });

  it.each([
    'C major (vocal)', 'C', 'Cmaj', 'various', 'E-flat major',
    'c major', 'C Major', 'H major', 'C  major', 'D Dorian',
  ])('rejects %s', (k) => {
    expect(validateStandardKey(k).errors.length).toBeGreaterThan(0);
  });

  it('warns on unconventional enharmonic roots but does not error', () => {
    const r = validateStandardKey('A# major');
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBe(1);
  });

  it('parseKey extracts root and quality', () => {
    expect(parseKey('Eb minor')).toEqual({ root: 'Eb', quality: 'minor' });
    expect(parseKey('F blues')).toEqual({ root: 'F', quality: 'blues' });
    expect(parseKey('garbage')).toBeNull();
    expect(parseKey('')).toBeNull();
  });
});

describe('alternate_keys validation', () => {
  const good = [{ key: 'C major', context: 'common vocal call key' }];

  it('accepts an empty array', () => {
    expect(validateAlternateKeys([], 'F major').errors).toEqual([]);
  });

  it('accepts well-formed entries', () => {
    expect(validateAlternateKeys(good, 'F major').errors).toEqual([]);
  });

  it('rejects non-arrays', () => {
    expect(validateAlternateKeys('C major', 'F major').errors.length).toBeGreaterThan(0);
  });

  it('rejects an entry with a bad key', () => {
    const r = validateAlternateKeys([{ key: 'C', context: 'x' }], '');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects an entry with an empty key', () => {
    const r = validateAlternateKeys([{ key: '', context: 'x' }], '');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects an entry with missing or empty context', () => {
    expect(validateAlternateKeys([{ key: 'C major' }], '').errors.length).toBeGreaterThan(0);
    expect(validateAlternateKeys([{ key: 'C major', context: '  ' }], '').errors.length).toBeGreaterThan(0);
  });

  it('rejects unknown properties on entries', () => {
    const r = validateAlternateKeys([{ key: 'C major', context: 'x', extra: 1 }], '');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects exact duplicate entries', () => {
    const r = validateAlternateKeys([...good, ...good], 'F major');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('warns (not errors) when an alternate equals standard_key', () => {
    const r = validateAlternateKeys([{ key: 'F major', context: 'same but noted' }], 'F major');
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBe(1);
  });
});

describe('schema lock changes', () => {
  it('alternate_keys is an allowed array field', () => {
    expect(ALLOWED_FIELDS.has('alternate_keys')).toBe(true);
    const r = validateTuneUpdate({ alternate_keys: [{ key: 'C major', context: 'x' }] });
    expect(r.valid).toBe(true);
  });

  it('key is no longer allowed and is stripped with a warning', () => {
    expect(ALLOWED_FIELDS.has('key')).toBe(false);
    const r = validateTuneUpdate({ tune_name: 'X', key: 'F' });
    expect(r.valid).toBe(true);
    expect(r.sanitized).not.toHaveProperty('key');
    expect(r.warnings).toContain("unknown field 'key' stripped");
  });

  it('validateTuneUpdate rejects a narrative standard_key', () => {
    const r = validateTuneUpdate({ standard_key: 'Ab major (concert); also C or F' });
    expect(r.valid).toBe(false);
  });

  it('validateTuneUpdate accepts a canonical standard_key', () => {
    const r = validateTuneUpdate({ standard_key: 'Ab major' });
    expect(r.valid).toBe(true);
  });

  it('validateTuneUpdate rejects malformed alternate_keys', () => {
    const r = validateTuneUpdate({ alternate_keys: [{ key: 'nope', context: '' }] });
    expect(r.valid).toBe(false);
  });

  it('validateTuneUpdate surfaces enharmonic warnings while staying valid', () => {
    const r = validateTuneUpdate({ standard_key: 'D# minor' });
    expect(r.valid).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
