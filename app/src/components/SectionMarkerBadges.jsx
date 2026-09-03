export function SectionMarkerBadges({ markers }) {
  if (!markers || markers.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {markers.map((m, i) => (
        <span
          key={i}
          data-section-badge
          className="border border-rule px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em] leading-tight"
        >
          <span className="text-accent">{m.label}</span> {m.start}–{m.end}
        </span>
      ))}
    </div>
  );
}
