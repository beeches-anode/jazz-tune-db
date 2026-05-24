import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabStrip } from './TabStrip';
import { OverviewTab } from './OverviewTab';
import { ListenTab } from './ListenTab';
import { ChordsTab } from './ChordsTab';

const tune = {
  id: 't1',
  tune_name: 'Stella by Starlight',
  composer: 'Victor Young',
  lyricist: 'Ned Washington',
  year: 1944,
  style: 'swing',
  rank: 22,
  standard_key: 'Bb major',
  form: 'AABA, 32 bars',
  history_and_facts: 'A jazz standard…',
  chords: '| Em7b5 | A7 | Cm7 | F7 |',
  famous_recordings: ['Miles Davis – 1958'],
  youtube_video_ids: [{ id: 'abc123', title: 'Miles Davis' }],
  section_markers: [{ label: 'A', start: 1, end: 8 }],
};

describe('TabStrip', () => {
  it('renders tab labels and calls onSelect', () => {
    const onSelect = vi.fn();
    render(
      <TabStrip
        tabs={[{ id: 'overview', label: 'Overview' }, { id: 'chords', label: 'Chords' }]}
        activeId="overview"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText('Chords'));
    expect(onSelect).toHaveBeenCalledWith('chords');
  });
});

describe('OverviewTab', () => {
  it('renders composer, year, key, history', () => {
    render(<OverviewTab tune={tune} />);
    expect(screen.getByText(/Victor Young/)).toBeInTheDocument();
    expect(screen.getByText('1944')).toBeInTheDocument();
    expect(screen.getByText('Bb major')).toBeInTheDocument();
    expect(screen.getByText(/jazz standard/)).toBeInTheDocument();
  });
});

describe('ListenTab', () => {
  it('renders famous recordings', () => {
    render(<ListenTab tune={tune} />);
    expect(screen.getByText(/Miles Davis – 1958/)).toBeInTheDocument();
  });
  it('renders YouTube playlist button when videos exist', () => {
    render(<ListenTab tune={tune} />);
    const btn = screen.getByText(/YouTube Performances/i);
    expect(btn.closest('a').href).toContain('watch_videos?video_ids=abc123');
  });
});

describe('ChordsTab', () => {
  it('renders chord grid', () => {
    render(<ChordsTab tune={tune} />);
    expect(screen.getByText('Em7b5')).toBeInTheDocument();
    expect(screen.getByText('A7')).toBeInTheDocument();
  });
  it('renders transpose buttons', () => {
    render(<ChordsTab tune={tune} />);
    expect(screen.getByText('Concert')).toBeInTheDocument();
    expect(screen.getByText('Bb')).toBeInTheDocument();
    expect(screen.getByText('Eb')).toBeInTheDocument();
  });
  it('transposes when Bb button clicked', () => {
    render(<ChordsTab tune={tune} />);
    fireEvent.click(screen.getByText('Bb'));
    expect(screen.getByText('F#m7b5')).toBeInTheDocument();
  });
});
