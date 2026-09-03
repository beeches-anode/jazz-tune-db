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

  it('shows the first measure number of every row in the gutter', () => {
    const { container } = render(
      <ChordChart
        chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Em7 | A7 | Dm7 | G7 |\n| Fmaj7 | Bb7 | Cmaj7 | Cmaj7 |"}
        transposeKey="Concert"
        sectionMarkers={[]}
      />
    );
    const numbers = Array.from(container.querySelectorAll('[data-measure-number]')).map((el) => el.textContent);
    expect(numbers).toEqual(['1', '5', '9']);
  });

  it('marks rows that begin a section', () => {
    const { container } = render(
      <ChordChart
        chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Em7 | A7 | Dm7 | G7 |"}
        transposeKey="Concert"
        sectionMarkers={[{ label: 'A', start: 1, end: 4 }, { label: 'B', start: 5, end: 8 }]}
      />
    );
    expect(container.querySelectorAll('[data-section-start]')).toHaveLength(2);
  });

  it('renders a marker that starts mid-row inside that cell', () => {
    const { container } = render(
      <ChordChart
        chords="| Cmaj7 | Dm7 | G7 | Cmaj7 |"
        transposeKey="Concert"
        sectionMarkers={[{ label: 'B', start: 3, end: 4 }]}
      />
    );
    expect(container.querySelectorAll('[data-section-start]')).toHaveLength(0);
    const cells = container.querySelectorAll('[data-measure]');
    expect(cells[2].querySelector('[data-section]').textContent).toBe('B');
  });

  it('keeps a short row on the same four-column grid, bars left-aligned', () => {
    const { container } = render(
      <ChordChart chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Dmaj7 | Dmaj7 |"} transposeKey="Concert" sectionMarkers={[]} />
    );
    const rows = container.querySelectorAll('[data-measure]:first-child');
    expect(rows[0].parentElement.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(rows[1].parentElement.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(rows[1].parentElement.querySelectorAll('[data-measure]')).toHaveLength(2);
  });

  it('widens the grid only when a row has more than four measures', () => {
    const { container } = render(
      <ChordChart chords="| C7 | F7 | C7 | G7 | C7 |" transposeKey="Concert" sectionMarkers={[]} />
    );
    expect(container.querySelector('[data-measure]').parentElement.style.gridTemplateColumns).toBe('repeat(5, minmax(0, 1fr))');
  });
});
