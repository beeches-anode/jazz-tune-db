import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChordChart } from './ChordChart';

describe('ChordChart', () => {
  it('renders each measure as a cell in Real Book shorthand', () => {
    const { container } = render(
      <ChordChart chords="| Cmaj7 | Dm7 | G7 | Cmaj7 |" transposeKey="Concert" sectionMarkers={[]} />
    );
    const cells = container.querySelectorAll('[data-measure]');
    expect(Array.from(cells).map((c) => c.textContent)).toEqual(['CΔ', 'D–7', 'G7', 'CΔ']);
  });

  it('renders both chords of a compound measure in one cell', () => {
    const { container } = render(
      <ChordChart chords="| Am7 D7 | Gmaj7 |" transposeKey="Concert" sectionMarkers={[]} />
    );
    const cells = container.querySelectorAll('[data-measure]');
    expect(cells).toHaveLength(2);
    expect(cells[0].textContent).toBe('A–7D7');
  });

  it('renders a slash chord with its bass note in the same cell', () => {
    const { container } = render(
      <ChordChart chords="| Bb7/ D | Ebmaj7 |" transposeKey="Concert" sectionMarkers={[]} />
    );
    const cells = container.querySelectorAll('[data-measure]');
    expect(cells).toHaveLength(2);
    expect(cells[0].textContent).toBe('B♭7/D');
  });

  it('renders section labels above start measures', () => {
    render(
      <ChordChart
        chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Em7 | A7 | Dm7 | G7 |"}
        transposeKey="Concert"
        sectionMarkers={[
          { label: 'A', start: 1, end: 4 },
          { label: 'B', start: 5, end: 8 },
        ]}
      />
    );
    const labels = Array.from(document.querySelectorAll('[data-section]')).map((el) => el.textContent);
    expect(labels).toEqual(['A', 'B']);
  });

  it('transposes when transposeKey changes', () => {
    const { container, rerender } = render(
      <ChordChart chords="| Cmaj7 | F7 |" transposeKey="Concert" sectionMarkers={[]} />
    );
    expect(container.querySelector('[data-measure]').textContent).toBe('CΔ');

    rerender(<ChordChart chords="| Cmaj7 | F7 |" transposeKey="Bb" sectionMarkers={[]} />);
    expect(container.querySelector('[data-measure]').textContent).toBe('DΔ');
  });
});
