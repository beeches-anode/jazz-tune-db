import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SectionMarkerBadges } from './SectionMarkerBadges';

describe('SectionMarkerBadges', () => {
  it('renders each marker as "<label> <start>–<end>" with an en dash', () => {
    const { container } = render(
      <SectionMarkerBadges markers={[{ label: 'A', start: 1, end: 8 }, { label: 'B', start: 9, end: 16 }]} />
    );
    const badges = Array.from(container.querySelectorAll('[data-section-badge]')).map((el) => el.textContent);
    expect(badges).toEqual(['A 1–8', 'B 9–16']);
  });
  it('renders nothing when there are no markers', () => {
    const { container } = render(<SectionMarkerBadges markers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
