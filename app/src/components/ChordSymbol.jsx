import { formatChord } from '../utils/chordUtils';

// One chord in Real Book shorthand: B♭–⁷, A♭Δ, F♯ø, B°, C⁷♭⁹, B♭⁷/D
export function ChordSymbol({ token }) {
  const c = formatChord(token);
  if (!c.root) return <span>{c.raw}</span>;
  return (
    <span className="whitespace-nowrap">
      {c.root}
      {c.accidental && <span className="text-[0.7em] align-[0.3em]">{c.accidental}</span>}
      {c.quality && <span className="font-medium">{c.quality}</span>}
      {c.ext && <sup className="text-[0.6em] font-medium">{c.ext}</sup>}
      {c.bass && (
        <sub className="text-[0.6em] font-medium">
          /{c.bass.root}{c.bass.accidental}
        </sub>
      )}
    </span>
  );
}
