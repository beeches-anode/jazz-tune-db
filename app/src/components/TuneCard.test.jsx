import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TuneCard } from './TuneCard';

describe('TuneCard', () => {
  it('renders the standard key badge when standard_key is set', () => {
    const tune = { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', standard_key: 'Eb major' };
    render(<TuneCard tune={tune} onClick={() => {}} />);
    expect(screen.getByText('Eb major')).toBeInTheDocument();
  });

  it('renders the +N alternate-key badge when standard_key is empty but alternates exist', () => {
    const tune = {
      id: 't1',
      tune_name: 'Nardis',
      composer: 'Miles Davis',
      standard_key: '',
      alternate_keys: [{ key: 'C minor', context: 'common version' }, { key: 'E minor', context: 'trio version' }],
    };
    render(<TuneCard tune={tune} onClick={() => {}} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not render any key badge when neither standard_key nor alternate_keys are set', () => {
    const tune = { id: 't1', tune_name: 'Untitled', composer: 'Unknown' };
    render(<TuneCard tune={tune} onClick={() => {}} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const tune = { id: 't1', tune_name: 'Blue Bossa', composer: 'Kenny Dorham' };
    render(<TuneCard tune={tune} onClick={onClick} />);
    screen.getByText('Blue Bossa').click();
    expect(onClick).toHaveBeenCalled();
  });
});
