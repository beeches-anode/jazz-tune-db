import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReaderDetail } from './ReaderDetail';

const base = { id: 't1', tune_name: 'Nardis', composer: 'Miles Davis', history_and_facts: 'x' };

describe('ReaderDetail', () => {
  it('shows a Chords tab when the tune has a bar-delimited chart', () => {
    render(<ReaderDetail tune={{ ...base, chords: '| Em7 | A7 |' }} />);
    expect(screen.getByRole('button', { name: 'Chords' })).toBeInTheDocument();
  });
  it('shows no Chords tab when chords is the placeholder "unknown"', () => {
    render(<ReaderDetail tune={{ ...base, chords: 'unknown' }} />);
    expect(screen.queryByRole('button', { name: 'Chords' })).not.toBeInTheDocument();
  });
  it('shows no Chords tab when chords is empty', () => {
    render(<ReaderDetail tune={{ ...base, chords: '' }} />);
    expect(screen.queryByRole('button', { name: 'Chords' })).not.toBeInTheDocument();
  });
});
