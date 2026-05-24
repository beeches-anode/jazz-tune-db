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
