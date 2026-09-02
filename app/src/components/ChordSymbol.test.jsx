import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChordSymbol } from './ChordSymbol';

describe('ChordSymbol', () => {
  it('renders root, quality glyph and superscript extension', () => {
    const { container } = render(<ChordSymbol token="Bbm7" />);
    expect(container.textContent).toBe('B♭–7');
    expect(container.querySelector('sup').textContent).toBe('7');
  });
  it('omits the superscript when there is no extension', () => {
    const { container } = render(<ChordSymbol token="Abmaj7" />);
    expect(container.textContent).toBe('A♭Δ');
    expect(container.querySelector('sup')).toBeNull();
  });
  it('renders the slash-chord bass as a subscript', () => {
    const { container } = render(<ChordSymbol token="Bb7/D" />);
    expect(container.textContent).toBe('B♭7/D');
    expect(container.querySelector('sub').textContent).toBe('/D');
  });
  it('renders non-chord text verbatim', () => {
    const { container } = render(<ChordSymbol token="unknown" />);
    expect(container.textContent).toBe('unknown');
    expect(container.querySelector('sup')).toBeNull();
  });
});
