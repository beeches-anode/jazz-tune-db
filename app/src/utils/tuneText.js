// "Jerome Kern (lyrics: Oscar Hammerstein II)" → { name: 'Jerome Kern', lyricist: 'Oscar Hammerstein II' }
// The data keeps lyricists inside the composer string for ~120 tunes; the
// dedicated `lyricist` field is usually null. Callers prefer the field when set.
export function splitComposer(composer) {
  const text = (composer ?? '').trim();
  const m = text.match(/^(.*?)\s*\(lyrics:\s*(.*?)\)\s*$/);
  if (!m) return { name: text, lyricist: null };
  return { name: m[1].trim(), lyricist: m[2].trim() };
}
