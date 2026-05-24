// Chord root notes in chromatic order
const NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Jazz chord symbol conversions (text to Unicode symbols)
// △ = major (U+25B3), ø = half-diminished (U+00F8), ° = diminished (U+00B0)
const CHORD_SYMBOL_REPLACEMENTS = [
  // Half-diminished (m7b5) → ø7 - must come before minor replacements
  { pattern: /m7b5/g, replacement: 'ø7' },
  { pattern: /m7♭5/g, replacement: 'ø7' },
  // Diminished - dim7 before dim to avoid partial replacement
  { pattern: /dim7/g, replacement: '°7' },
  { pattern: /dim/g, replacement: '°' },
  // Major 7th variants → triangle
  { pattern: /maj7/gi, replacement: '△7' },
  { pattern: /maj9/gi, replacement: '△9' },
  { pattern: /maj13/gi, replacement: '△13' },
  { pattern: /maj6/gi, replacement: '△6' },
  { pattern: /M7/g, replacement: '△7' },
  { pattern: /M9/g, replacement: '△9' },
];

// Convert chord text to display symbols
export const chordToSymbols = (chordText) => {
  if (!chordText) return chordText;

  let result = chordText;
  for (const { pattern, replacement } of CHORD_SYMBOL_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
};

// Parse a chord symbol into root and quality
export const parseChord = (chordSymbol) => {
  if (!chordSymbol || chordSymbol.trim() === '') return null;

  const chord = chordSymbol.trim();

  // Match root note (with possible sharp or flat)
  const rootMatch = chord.match(/^([A-G][b#]?)/);
  if (!rootMatch) return null;

  const root = rootMatch[1];
  const quality = chord.slice(root.length);

  return { root, quality, original: chord };
};

// Transpose a chord by semitones
export const transposeChord = (chordSymbol, semitones) => {
  const parsed = parseChord(chordSymbol);
  if (!parsed) return chordSymbol;

  const { root, quality } = parsed;

  // Find current note index (try both flat and sharp notation)
  let noteIndex = NOTES.indexOf(root);
  if (noteIndex === -1) {
    noteIndex = NOTES_SHARP.indexOf(root);
  }
  if (noteIndex === -1) return chordSymbol;

  // Calculate new index
  let newIndex = (noteIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Prefer flats in flat keys, sharps in sharp keys
  const newRoot = root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(root)
    ? NOTES[newIndex]
    : (NOTES_SHARP[newIndex] || NOTES[newIndex]);

  return newRoot + quality;
};

// Transpose an entire chord progression
export const transposeProgression = (progression, fromKey, toKey) => {
  const semitones = getSemitoneDistance(fromKey, toKey);

  // Split by line breaks and measures
  const lines = progression.split('\n');

  return lines.map(line => {
    // Split by measure delimiters |
    const parts = line.split('|');

    return parts.map((measure, idx) => {
      if (idx === 0 || idx === parts.length - 1) {
        // Keep opening and closing |
        return measure;
      }

      // Transpose each chord in the measure
      const chords = measure.trim().split(/\s+/);
      const transposed = chords.map(chord =>
        chord ? transposeChord(chord, semitones) : ''
      );

      return ' ' + transposed.join(' ') + ' ';
    }).join('|');
  }).join('\n');
};

// Get semitone distance between two keys
export const getSemitoneDistance = (fromKey, toKey) => {
  const keyMap = {
    'C': 0, 'C major': 0, 'C maj': 0,
    'Db': 1, 'Db major': 1, 'C#': 1, 'C# major': 1,
    'D': 2, 'D major': 2,
    'Eb': 3, 'Eb major': 3, 'D#': 3, 'D# major': 3,
    'E': 4, 'E major': 4,
    'F': 5, 'F major': 5,
    'Gb': 6, 'Gb major': 6, 'F#': 6, 'F# major': 6,
    'G': 7, 'G major': 7,
    'Ab': 8, 'Ab major': 8, 'G#': 8, 'G# major': 8,
    'A': 9, 'A major': 9,
    'Bb': 10, 'Bb major': 10, 'A#': 10, 'A# major': 10,
    'B': 11, 'B major': 11,
  };

  // Handle transposing instruments - these are RELATIVE offsets, not absolute keys
  if (toKey === 'Bb instrument') {
    // Bb instruments always read a whole step (2 semitones) higher than concert
    // So we always ADD 2 semitones regardless of the concert key
    const from = keyMap[fromKey] ?? 0;
    return 2; // Always +2 semitones
  }

  if (toKey === 'Eb instrument') {
    // Eb instruments always read a minor third (3 semitones) lower than concert
    // So we always SUBTRACT 3 semitones (or add 9, same thing) regardless of the concert key
    const from = keyMap[fromKey] ?? 0;
    return -3; // Always -3 semitones
  }

  // For regular key-to-key transposition
  const from = keyMap[fromKey] ?? 0;
  const to = keyMap[toKey] ?? 0;

  return to - from;
};

// Validate chord syntax
export const validateChordProgression = (progression) => {
  const errors = [];

  if (!progression || progression.trim() === '') {
    return { valid: false, errors: ['Chord progression is empty'] };
  }

  // Check if it starts and ends with |
  const trimmed = progression.trim();
  if (!trimmed.startsWith('|')) {
    errors.push('Chord progression should start with |');
  }
  if (!trimmed.endsWith('|')) {
    errors.push('Chord progression should end with |');
  }

  // Split into lines and validate each
  const lines = progression.split('\n');
  lines.forEach((line, lineIdx) => {
    if (line.trim() === '') return;

    // Extract measures
    const measures = line.split('|').filter((m, i, arr) =>
      i > 0 && i < arr.length - 1 && m.trim()
    );

    measures.forEach((measure, measureIdx) => {
      const chords = measure.trim().split(/\s+/);

      chords.forEach(chord => {
        if (chord && !isValidChordSymbol(chord)) {
          errors.push(`Potentially invalid chord "${chord}" at line ${lineIdx + 1}, measure ${measureIdx + 1}`);
        }
      });
    });
  });

  return { valid: errors.length === 0, errors };
};

// Check if a chord symbol is valid
export const isValidChordSymbol = (chord) => {
  // Basic chord pattern: Root + optional quality/extensions
  const pattern = /^[A-G][b#]?(maj|min|m|dim|aug|sus)?\d*(b\d+|#\d+|add\d+|alt|(\([^)]+\)))*$/i;
  return pattern.test(chord);
};

// Count measures in a progression
export const countMeasures = (progression) => {
  const lines = progression.split('\n');
  let count = 0;

  lines.forEach(line => {
    const measures = line.split('|').filter((m, i, arr) =>
      i > 0 && i < arr.length - 1
    );
    count += measures.length;
  });

  return count;
};

// Generate section markers based on measure count and form
export const generateSectionMarkers = (measureCount, formText) => {
  const form = formText?.toLowerCase() || '';

  // 32-bar AABA
  if (measureCount === 32 && form.includes('aaba')) {
    return [
      { label: 'A', start: 1, end: 8 },
      { label: 'A', start: 9, end: 16 },
      { label: 'B', start: 17, end: 24 },
      { label: 'A', start: 25, end: 32 }
    ];
  }

  // 32-bar ABAC
  if (measureCount === 32 && form.includes('abac')) {
    return [
      { label: 'A', start: 1, end: 8 },
      { label: 'B', start: 9, end: 16 },
      { label: 'A', start: 17, end: 24 },
      { label: 'C', start: 25, end: 32 }
    ];
  }

  // 32-bar AABC (like Autumn Leaves)
  if (measureCount === 32 && form.includes('aabc')) {
    return [
      { label: 'A', start: 1, end: 8 },
      { label: 'A', start: 9, end: 16 },
      { label: 'B', start: 17, end: 24 },
      { label: 'C', start: 25, end: 32 }
    ];
  }

  // 12-bar Blues
  if (measureCount === 12 && (form.includes('blues') || form.includes('12'))) {
    return [
      { label: 'A', start: 1, end: 4 },
      { label: 'A', start: 5, end: 8 },
      { label: 'B', start: 9, end: 12 }
    ];
  }

  // 16-bar
  if (measureCount === 16) {
    return [
      { label: 'A', start: 1, end: 8 },
      { label: 'B', start: 9, end: 16 }
    ];
  }

  // Fallback: 32-bar tunes without specific form pattern
  // Default to AABA structure as it's most common
  if (measureCount === 32) {
    return [
      { label: 'A', start: 1, end: 8 },
      { label: 'A', start: 9, end: 16 },
      { label: 'B', start: 17, end: 24 },
      { label: 'A', start: 25, end: 32 }
    ];
  }

  return [];
};
