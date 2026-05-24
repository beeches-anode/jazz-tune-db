import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TuneList } from './TuneList';

const tunes = [
  { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', rank: 22, standard_key: 'Eb major', style: 'swing' },
  { id: 't2', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', rank: 8, standard_key: 'G minor', style: 'swing' },
  { id: 't3', tune_name: 'Blue Bossa', composer: 'Kenny Dorham', rank: 19, standard_key: 'C minor', style: 'bossa' },
];

describe('TuneList', () => {
  it('renders all tunes', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} />);
    expect(screen.getByText('Stella by Starlight')).toBeInTheDocument();
    expect(screen.getByText('Autumn Leaves')).toBeInTheDocument();
    expect(screen.getByText('Blue Bossa')).toBeInTheDocument();
  });

  it('filters live as you type in search', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'autumn' } });
    expect(screen.queryByText('Stella by Starlight')).not.toBeInTheDocument();
    expect(screen.getByText('Autumn Leaves')).toBeInTheDocument();
  });

  it('filters by composer too', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'dorham' } });
    expect(screen.getByText('Blue Bossa')).toBeInTheDocument();
    expect(screen.queryByText('Autumn Leaves')).not.toBeInTheDocument();
  });

  it('calls onSelect when a card is clicked', () => {
    const onSelect = vi.fn();
    render(<TuneList tunes={tunes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Blue Bossa'));
    expect(onSelect).toHaveBeenCalledWith('t3');
  });
});
