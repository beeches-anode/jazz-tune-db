export function TuneCard({ tune, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-zinc-200 hover:bg-zinc-50 transition ${
        selected ? 'bg-sky-50' : 'bg-white'
      }`}
    >
      <div className="font-semibold text-zinc-900">{tune.tune_name}</div>
      <div className="text-sm text-zinc-500">{tune.composer}</div>
      <div className="flex gap-2 mt-1">
        {tune.rank && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">#{tune.rank}</span>}
        {tune.standard_key && <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">{tune.standard_key}</span>}
        {tune.style && <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">{tune.style}</span>}
      </div>
    </button>
  );
}
