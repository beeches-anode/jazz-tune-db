export function TabStrip({ tabs, activeId, onSelect }) {
  return (
    <div className="flex border-b border-zinc-200 bg-white">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
            activeId === tab.id
              ? 'border-sky-500 text-sky-700'
              : 'border-transparent text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
