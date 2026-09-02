const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Transposition: target sounds the same as Concert when played on the instrument.
// Bb instrument: written pitch = concert + 2 semitones
// Eb instrument: written pitch = concert + 9 semitones (or -3)
const TRANSPOSITION_OFFSET = {
  Concert: 0,
  Bb: 2,
  Eb: 9,
};

export function parseChords(input) {
  if (typeof input !== 'string' || input.trim() === '') return [];
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split('|').map(s => s.trim()).filter(s => s.length > 0));
}

function transposeNote(note, offset) {
  let idx = NOTES_SHARP.indexOf(note);
  let useFlats = false;
  if (idx === -1) {
    idx = NOTES_FLAT.indexOf(note);
    useFlats = true;
  }
  if (idx === -1) return note;
  const newIdx = (idx + offset + 12) % 12;
  return useFlats ? NOTES_FLAT[newIdx] : NOTES_SHARP[newIdx];
}

function transposeChord(chord, offset) {
  if (offset === 0) return chord;
  // Match the root note (with optional sharp/flat) at the start
  const m = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!m) return chord;
  const [, root, suffix] = m;
  return transposeNote(root, offset) + suffix;
}

function transposeMeasure(measure, offset) {
  // A measure may contain multiple chords separated by spaces
  return measure.split(/\s+/).map(c => transposeChord(c, offset)).join(' ');
}

export function transposeProgression(input, targetKey) {
  const offset = TRANSPOSITION_OFFSET[targetKey] ?? 0;
  if (offset === 0) return input;
  return input
    .split('\n')
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      // Reconstruct line preserving pipe structure
      return parts.map((p, i) => {
        if (i === 0 || i === parts.length - 1) return p;
        return ` ${transposeMeasure(p, offset)} `;
      }).join('|');
    })
    .join('\n');
}

// --- Chord symbol formatting (Real Book shorthand) ---------------------------
// Data stores chords as plain text ("Bbm7", "F#m7b5", "Db^7"), with a few iReal
// leftovers: ^ = maj7, h = half-diminished, o = diminished, - = minor.
// formatChord splits a token into the pieces ChordSymbol renders:
//   root + accidental glyph, quality glyph (– Δ ø °), superscript extension, bass.

const ACCIDENTAL_GLYPH = { b: '♭', '#': '♯', '': '' };

function glyphAccidentals(ext) {
  // Only b/# directly before a digit are accidentals (keeps "sus", "add" intact)
  return ext.replace(/[b#](?=\d)/g, (m) => ACCIDENTAL_GLYPH[m]);
}

function parseNote(text) {
  const m = text.match(/^([A-G])([b#]?)(.*)$/);
  if (!m) return null;
  return { root: m[1], accidental: ACCIDENTAL_GLYPH[m[2]], rest: m[3] };
}

// Returns [qualityGlyph, remainingExtension] for a suffix, or null if plain.
function splitQuality(suffix) {
  const dropSeventh = (s) => s.replace(/^7/, '');
  if (/^(m7b5|-7b5|h)/.test(suffix)) return ['ø', dropSeventh(suffix.replace(/^(m7b5|-7b5|h)/, ''))];
  if (/^dim/.test(suffix)) return ['°', dropSeventh(suffix.slice(3))];
  if (/^o(7|$)/.test(suffix)) return ['°', dropSeventh(suffix.slice(1))];
  if (/^maj/.test(suffix)) return ['Δ', dropSeventh(suffix.slice(3))];
  if (/^\^/.test(suffix)) return ['Δ', dropSeventh(suffix.slice(1))];
  if (/^[m-]/.test(suffix)) return ['–', suffix.slice(1)];
  return ['', suffix];
}

export function formatChord(token) {
  const empty = { raw: token, root: null, accidental: '', quality: '', ext: '', bass: null };
  const [main, bassText] = token.split('/');
  const note = parseNote(main);
  if (!note) return empty;
  const [quality, ext] = splitQuality(note.rest);
  const bassNote = bassText ? parseNote(bassText) : null;
  return {
    raw: token,
    root: note.root,
    accidental: note.accidental,
    quality,
    ext: glyphAccidentals(ext),
    bass: bassNote ? { root: bassNote.root, accidental: bassNote.accidental } : null,
  };
}

// A measure may hold several chords; a slash chord is stored as "Bb7/ D"
// (trailing slash, then the bass note as its own token — see transposeMeasure).
export function splitMeasure(measure) {
  const parts = (measure ?? '').trim().split(/\s+/).filter(Boolean);
  const tokens = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].endsWith('/') && i + 1 < parts.length) {
      tokens.push(parts[i] + parts[++i]);
    } else {
      tokens.push(parts[i]);
    }
  }
  return tokens;
}
