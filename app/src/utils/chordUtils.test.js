import { describe, it, expect } from 'vitest';
import { parseChords, transposeProgression, formatChord, splitMeasure } from './chordUtils';

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

describe('formatChord', () => {
  const fmt = (s) => {
    const result = formatChord(s);
    delete result.raw;
    return result;
  };

  it('renders a minor seventh as dash with superscript 7', () => {
    expect(fmt('Fm7')).toEqual({ root: 'F', accidental: '', quality: '–', ext: '7', bass: null });
  });
  it('converts a flat root to the ♭ glyph', () => {
    expect(fmt('Bbm7')).toMatchObject({ root: 'B', accidental: '♭', quality: '–', ext: '7' });
  });
  it('converts a sharp root to the ♯ glyph', () => {
    expect(fmt('F#m7b5')).toMatchObject({ root: 'F', accidental: '♯' });
  });
  it('renders maj7 as Δ with no 7', () => {
    expect(fmt('Abmaj7')).toMatchObject({ accidental: '♭', quality: 'Δ', ext: '' });
  });
  it('accepts iReal ^7 as maj7', () => {
    expect(fmt('Db^7')).toMatchObject({ quality: 'Δ', ext: '' });
  });
  it('keeps extensions beyond the 7th on a major chord', () => {
    expect(fmt('Cmaj9')).toMatchObject({ quality: 'Δ', ext: '9' });
    expect(fmt('Cmaj7#11')).toMatchObject({ quality: 'Δ', ext: '♯11' });
  });
  it('renders m7b5 and its aliases as ø with no 7', () => {
    expect(fmt('Gm7b5')).toMatchObject({ quality: 'ø', ext: '' });
    expect(fmt('A-7b5')).toMatchObject({ quality: 'ø', ext: '' });
    expect(fmt('Bh')).toMatchObject({ quality: 'ø', ext: '' });
  });
  it('renders dim7 and its aliases as ° with no 7', () => {
    expect(fmt('Bdim7')).toMatchObject({ quality: '°', ext: '' });
    expect(fmt('F#o')).toMatchObject({ quality: '°', ext: '' });
  });
  it('accepts a hyphen as minor', () => {
    expect(fmt('C-7')).toMatchObject({ quality: '–', ext: '7' });
  });
  it('keeps minor extensions and converts their accidentals', () => {
    expect(fmt('Dm6')).toMatchObject({ quality: '–', ext: '6' });
    expect(fmt('Dm11')).toMatchObject({ quality: '–', ext: '11' });
    expect(fmt('Dmb6')).toMatchObject({ quality: '–', ext: '♭6' });
  });
  it('puts dominant alterations in the extension with glyph accidentals', () => {
    expect(fmt('B7b9')).toMatchObject({ quality: '', ext: '7♭9' });
    expect(fmt('C7b13')).toMatchObject({ quality: '', ext: '7♭13' });
    expect(fmt('G7#9#5')).toMatchObject({ quality: '', ext: '7♯9♯5' });
    expect(fmt('Eb7')).toMatchObject({ accidental: '♭', quality: '', ext: '7' });
  });
  it('renders a bare triad with empty quality and extension', () => {
    expect(fmt('C')).toEqual({ root: 'C', accidental: '', quality: '', ext: '', bass: null });
  });
  it('passes unrecognised suffixes through unchanged', () => {
    expect(fmt('F+')).toMatchObject({ quality: '', ext: '+' });
    expect(fmt('A7at')).toMatchObject({ quality: '', ext: '7at' });
    expect(fmt('Bb7sus')).toMatchObject({ quality: '', ext: '7sus' });
  });
  it('does not treat the o in Coda as diminished', () => {
    expect(fmt('Coda')).toMatchObject({ root: 'C', quality: '', ext: 'oda' });
  });
  it('parses a slash chord bass note', () => {
    expect(fmt('Bb7/D')).toMatchObject({ root: 'B', accidental: '♭', ext: '7', bass: { root: 'D', accidental: '' } });
    expect(fmt('Fmaj7/Ab')).toMatchObject({ quality: 'Δ', bass: { root: 'A', accidental: '♭' } });
  });
  it('returns a rootless token for non-chord text', () => {
    expect(formatChord('unknown')).toEqual({ raw: 'unknown', root: null, accidental: '', quality: '', ext: '', bass: null });
    expect(formatChord('—').root).toBeNull();
  });
});

describe('splitMeasure', () => {
  it('splits a compound measure into chord tokens', () => {
    expect(splitMeasure('Am7 D7')).toEqual(['Am7', 'D7']);
  });
  it('joins a trailing-slash token with the following bass note', () => {
    expect(splitMeasure('Bb7/ D')).toEqual(['Bb7/D']);
  });
  it('handles a slash chord alongside other chords', () => {
    expect(splitMeasure('Fmaj7/ A Dm7')).toEqual(['Fmaj7/A', 'Dm7']);
  });
  it('returns an empty list for an empty measure', () => {
    expect(splitMeasure('')).toEqual([]);
  });
});
