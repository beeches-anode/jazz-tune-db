import { describe, it, expect } from 'vitest';
import { validateTuneUpdate, ALLOWED_FIELDS } from './validation';

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
});
