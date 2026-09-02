export function TabStrip({ tabs, activeId, onSelect }) {
  return (
    <div className="flex gap-7 px-4 sm:px-10 border-b border-rule bg-paper">
      {tabs.map(tab => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`py-3 -mb-px text-xs font-semibold uppercase tracking-[0.12em] border-b-2 transition-colors ${
              active ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
