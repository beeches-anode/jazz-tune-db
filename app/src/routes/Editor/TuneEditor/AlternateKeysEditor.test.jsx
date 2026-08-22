import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlternateKeysEditor } from './AlternateKeysEditor';

describe('AlternateKeysEditor', () => {
  it('renders existing entries', () => {
    render(<AlternateKeysEditor tuneId="t1" value={[{ key: 'C major', context: 'vocal' }]} onChange={() => {}} />);
    expect(screen.getByDisplayValue('C major')).toBeTruthy();
    expect(screen.getByDisplayValue('vocal')).toBeTruthy();
  });

  it('does not propagate incomplete rows', () => {
    const onChange = vi.fn();
    render(<AlternateKeysEditor tuneId="t1" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add alternate key'));
    fireEvent.change(screen.getByPlaceholderText('C major'), { target: { value: 'C' } });
    // 'C' fails KEY_REGEX and context is empty — nothing valid to save yet
    expect(onChange).not.toHaveBeenCalledWith([expect.objectContaining({ key: 'C' })]);
  });

  it('propagates a row once key and context are complete', () => {
    const onChange = vi.fn();
    render(<AlternateKeysEditor tuneId="t1" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add alternate key'));
    fireEvent.change(screen.getByPlaceholderText('C major'), { target: { value: 'C major' } });
    fireEvent.change(screen.getByPlaceholderText('why (e.g. common vocal call key)'), { target: { value: 'vocal' } });
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'C major', context: 'vocal' }]);
  });

  it('removes a row', () => {
    const onChange = vi.fn();
    render(<AlternateKeysEditor tuneId="t1" value={[{ key: 'C major', context: 'vocal' }]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove alternate key 1'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('preserves a half-typed row across a save-echo re-render (same tuneId)', () => {
    const onChange = vi.fn();
    const { rerender } = render(<AlternateKeysEditor tuneId="t1" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add alternate key'));
    fireEvent.change(screen.getByPlaceholderText('C major'), { target: { value: 'C' } });
    expect(screen.getByDisplayValue('C')).toBeTruthy();

    // Simulate the debounced autosave echo: parent re-renders with a new
    // `value` array reference but the same tuneId. The half-typed row must
    // survive — it was never emitted (incomplete) so `value` doesn't contain it.
    rerender(<AlternateKeysEditor tuneId="t1" value={[]} onChange={onChange} />);

    expect(screen.getByDisplayValue('C')).toBeTruthy();
  });

  it('resets local state when tuneId changes (tune switch)', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <AlternateKeysEditor tuneId="t1" value={[{ key: 'C major', context: 'vocal' }]} onChange={onChange} />
    );
    expect(screen.getByDisplayValue('C major')).toBeTruthy();

    rerender(<AlternateKeysEditor tuneId="t2" value={[]} onChange={onChange} />);

    expect(screen.queryByDisplayValue('C major')).not.toBeInTheDocument();
  });
});
