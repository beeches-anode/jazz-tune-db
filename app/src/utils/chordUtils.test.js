import { describe, it, expect } from 'vitest';
import { parseChords, transposeProgression } from './chordUtils';

describe('parseChords', () => {
  it('parses a single line', () => {
    const result = parseChords('| Cmaj7 | Dm7 | G7 | Cmaj7 |');
    expect(result).toEqual([['Cmaj7', 'Dm7', 'G7', 'Cmaj7']]);
  });
  it('parses multiple lines', () => {
    const result = parseChords('| Cmaj7 | Dm7 |\n| G7 | Cmaj7 |');
    expect(result).toEqual([
      ['Cmaj7', 'Dm7'],
      ['G7', 'Cmaj7'],
    ]);
  });
  it('handles compound measures (two chords in one bar)', () => {
    const result = parseChords('| Am7 D7 | Gmaj7 |');
    expect(result).toEqual([['Am7 D7', 'Gmaj7']]);
  });
  it('returns empty array for empty input', () => {
    expect(parseChords('')).toEqual([]);
    expect(parseChords(null)).toEqual([]);
  });
});

describe('transposeProgression', () => {
  it('transposes Concert to Bb (down a major 2nd)', () => {
    const result = transposeProgression('| Cmaj7 | F7 |', 'Bb');
    expect(result).toBe('| Dmaj7 | G7 |');
  });
  it('transposes Concert to Eb (down a major 6th, equivalent to up a minor 3rd)', () => {
    const result = transposeProgression('| Cmaj7 | F7 |', 'Eb');
    expect(result).toBe('| Amaj7 | D7 |');
  });
  it('returns original when key is Concert', () => {
    expect(transposeProgression('| Cmaj7 | F7 |', 'Concert')).toBe('| Cmaj7 | F7 |');
  });
  it('handles compound measures', () => {
    expect(transposeProgression('| Am7 D7 |', 'Bb')).toBe('| Bm7 E7 |');
  });
  it('preserves chord quality suffixes', () => {
    expect(transposeProgression('| C7b9 |', 'Bb')).toBe('| D7b9 |');
    expect(transposeProgression('| Dm7b5 |', 'Bb')).toBe('| Em7b5 |');
  });
});
