import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChordChart } from './ChordChart';

describe('ChordChart', () => {
  it('renders each measure as a cell', () => {
    render(<ChordChart chords="| Cmaj7 | Dm7 | G7 | Cmaj7 |" transposeKey="Concert" sectionMarkers={[]} />);
    expect(screen.getAllByText('Cmaj7')).toHaveLength(2);
    expect(screen.getByText('Dm7')).toBeInTheDocument();
    expect(screen.getAllByText(/maj7/)).toHaveLength(2);
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
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('transposes when transposeKey changes', () => {
    const { rerender } = render(
      <ChordChart chords="| Cmaj7 | F7 |" transposeKey="Concert" sectionMarkers={[]} />
    );
    expect(screen.getByText('Cmaj7')).toBeInTheDocument();

    rerender(<ChordChart chords="| Cmaj7 | F7 |" transposeKey="Bb" sectionMarkers={[]} />);
    expect(screen.getByText('Dmaj7')).toBeInTheDocument();
  });
});
