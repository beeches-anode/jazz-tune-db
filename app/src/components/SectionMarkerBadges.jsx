export function SectionMarkerBadges({ markers }) {
  if (!markers || markers.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {markers.map((m, i) => (
        <span
          key={i}
          className="px-2 py-1 text-xs font-semibold bg-sky-100 text-sky-700 rounded"
        >
          {m.label}: {m.start}-{m.end}
        </span>
      ))}
    </div>
  );
}
