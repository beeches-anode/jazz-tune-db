import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from './OverviewTab';

describe('OverviewTab', () => {
  it('does not render the Key StatCard (or a stray "0") when there is no standard_key and no alternates', () => {
    const tune = { id: 't1', tune_name: 'Untitled', composer: 'Unknown', standard_key: '', alternate_keys: [] };
    render(<OverviewTab tune={tune} />);
    expect(screen.queryByText('Key')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows the Key StatCard with a "—" fallback and (+N) suffix when standard_key is empty but alternates exist', () => {
    const tune = {
      id: 't1',
      tune_name: 'Nardis',
      composer: 'Miles Davis',
      standard_key: '',
      alternate_keys: [{ key: 'C minor', context: 'common version' }, { key: 'E minor', context: 'trio version' }],
    };
    render(<OverviewTab tune={tune} />);
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('— (+2)')).toBeInTheDocument();
  });

  it('shows the plain standard_key with no suffix when there are no alternates', () => {
    const tune = { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', standard_key: 'Eb major' };
    render(<OverviewTab tune={tune} />);
    expect(screen.getByText('Eb major')).toBeInTheDocument();
  });
});
