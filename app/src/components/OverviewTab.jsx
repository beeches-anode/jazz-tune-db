export function OverviewTab({ tune }) {
  return (
    <div className="px-3 sm:px-5 py-4 space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{tune.tune_name}</h1>
        <p className="text-zinc-600 mt-1">
          {tune.composer}
          {tune.lyricist && <span className="text-zinc-500"> · lyrics by {tune.lyricist}</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tune.style && <StatCard label="Style" value={tune.style} />}
        {tune.standard_key && <StatCard label="Key" value={tune.standard_key} />}
        {tune.year && <StatCard label="Year" value={tune.year} />}
        {tune.rank && <StatCard label="Rank" value={`#${tune.rank}`} />}
      </div>

      {tune.history_and_facts && (
        <div className="prose prose-zinc max-w-none">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">History &amp; Facts</h3>
          {tune.history_and_facts.split('\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-zinc-700">{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded border border-zinc-200 px-3 py-2">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="text-base font-semibold text-zinc-900 mt-0.5">{value}</div>
    </div>
  );
}
