import { describe, it, expect } from 'vitest';
import { splitComposer } from './tuneText';

describe('splitComposer', () => {
  it('splits the "(lyrics: …)" parenthetical into a lyricist', () => {
    expect(splitComposer('Jerome Kern (lyrics: Oscar Hammerstein II)')).toEqual({
      name: 'Jerome Kern',
      lyricist: 'Oscar Hammerstein II',
    });
  });
  it('returns the composer unchanged when there is no parenthetical', () => {
    expect(splitComposer('Duke Ellington, Billy Strayhorn')).toEqual({
      name: 'Duke Ellington, Billy Strayhorn',
      lyricist: null,
    });
  });
  it('trims stray whitespace', () => {
    expect(splitComposer('  Kurt Weill  ')).toEqual({ name: 'Kurt Weill', lyricist: null });
  });
  it('handles a missing composer', () => {
    expect(splitComposer(null)).toEqual({ name: '', lyricist: null });
    expect(splitComposer(undefined)).toEqual({ name: '', lyricist: null });
  });
});
