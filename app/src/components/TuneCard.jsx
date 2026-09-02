import { splitComposer } from '../utils/tuneText';

// Dense row: 48px rank numeral in a 96px gutter, title over a one-line meta.
export function TuneCard({ tune, selected, onClick }) {
  const alternates = tune.alternate_keys?.length ?? 0;
  const keyLabel = tune.standard_key || (alternates > 0 ? '—' : null);
  const meta = selected ? 'text-paper/70' : 'text-muted';
  const soft = selected ? 'text-paper/50' : 'text-muted-soft';

  return (
    <button
      onClick={onClick}
      data-tune-card={tune.id}
      aria-current={selected ? 'true' : undefined}
      className={`w-full flex items-center h-14 pr-4 text-left border-b border-rule transition-colors ${
        selected ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-ink/5'
      }`}
    >
      <span
        data-rank
        className={`w-24 shrink-0 pr-3.5 text-right text-5xl font-black leading-none tracking-[-0.05em] tabular-nums ${
          selected ? 'text-accent' : ''
        }`}
      >
        {tune.rank ?? ''}
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="truncate text-base font-semibold leading-tight tracking-[-0.01em]">{tune.tune_name}</span>
        <span className={`truncate text-xs leading-tight ${meta}`}>
          <span>{splitComposer(tune.composer).name}</span>
          {keyLabel && <> · <span>{keyLabel}</span></>}
          {alternates > 0 && (
            <span className={`ml-1 ${soft}`} title={tune.alternate_keys.map((a) => a.key).join(', ')}>
              +{alternates}
            </span>
          )}
          {tune.style && <> · <span>{tune.style}</span></>}
        </span>
      </span>
    </button>
  );
}
