import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TuneList } from './TuneList';

const tunes = [
  { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', rank: 22, standard_key: 'Eb major', style: 'Swing', year: 1944 },
  { id: 't2', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', rank: 8, standard_key: 'G minor', style: 'swing', year: 1945 },
  { id: 't3', tune_name: 'Blue Bossa', composer: 'Kenny Dorham', rank: 19, standard_key: 'C minor', style: 'bossa nova', year: 1963 },
  { id: 't4', tune_name: 'Zebra Stripes', composer: 'Anon', standard_key: 'C major', style: 'ballad', year: 1930 },
];

const order = (container) =>
  Array.from(container.querySelectorAll('[data-tune-card]')).map((el) => el.getAttribute('data-tune-card'));

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

  it('sorts by rank by default, unranked tunes last', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    expect(order(container)).toEqual(['t2', 't3', 't1', 't4']);
  });

  it('sorts A–Z when that sort is chosen', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'A–Z' }));
    expect(order(container)).toEqual(['t2', 't3', 't1', 't4']);
    expect(screen.getByRole('button', { name: 'A–Z' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sorts by year when that sort is chosen', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Year' }));
    expect(order(container)).toEqual(['t4', 't1', 't2', 't3']);
  });

  it('filters by style chip, matching case-insensitively', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'swing' }));
    expect(order(container)).toEqual(['t2', 't1']);
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(order(container)).toHaveLength(4);
  });

  it('shows the masthead count and a link to the editor', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} />);
    expect(screen.getByText('4 tunes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/edit');
  });

  it('labels the search input for assistive tech', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} />);
    expect(screen.getByRole('searchbox', { name: 'Search tunes' })).toBeInTheDocument();
  });

  it('hides the masthead when showMasthead is false', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} showMasthead={false} />);
    expect(screen.queryByText('Jazz Tunes')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
