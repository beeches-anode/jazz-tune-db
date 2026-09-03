import { splitComposer } from '../utils/tuneText';

const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted';
const VALUE = 'text-[26px] font-extrabold leading-none tracking-[-0.03em]';

export function OverviewTab({ tune }) {
  const composer = splitComposer(tune.composer);
  const lyricist = tune.lyricist || composer.lyricist;
  const alternates = tune.alternate_keys ?? [];
  const showKey = Boolean(tune.standard_key) || alternates.length > 0;

  return (
    <div className="px-4 sm:px-10 py-8 flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-4xl sm:text-[56px] font-black leading-[0.98] tracking-[-0.04em] max-w-[760px] text-balance">
          {tune.tune_name}
        </h1>
        <p className="text-[17px] leading-snug">
          {composer.name}
          {lyricist && <span className="text-muted"> · lyrics by {lyricist}</span>}
        </p>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 border-y border-rule">
        {tune.rank && (
          <Fact label="Rank">
            <span className="text-5xl font-black leading-none tracking-[-0.05em] tabular-nums">{tune.rank}</span>
          </Fact>
        )}
        {showKey && (
          <Fact label="Key">
            <span className={VALUE}>{tune.standard_key || '—'}</span>
            {alternates.length > 0 && (
              <span
                className="text-xs text-muted leading-snug"
                title={alternates.map((a) => `${a.key}: ${a.context}`).join('\n')}
              >
                also {alternates.map((a) => a.key).join(', ')}
              </span>
            )}
          </Fact>
        )}
        {tune.style && (
          <Fact label="Style">
            <span className={`${VALUE} capitalize`}>{tune.style}</span>
          </Fact>
        )}
        {tune.year && (
          <Fact label="Year">
            <span className={`${VALUE} tabular-nums`}>{tune.year}</span>
          </Fact>
        )}
      </dl>

      {tune.history_and_facts && (
        <div className="flex flex-col gap-3.5 max-w-[720px]">
          <h3 className={LABEL}>History &amp; Facts</h3>
          {tune.history_and_facts.split('\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-[15.5px] leading-relaxed text-pretty">{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="flex flex-col gap-2 py-3.5 pr-4 sm:[&:not(:first-child)]:pl-4 sm:[&:not(:last-child)]:border-r sm:border-rule">
      <dt className={LABEL}>{label}</dt>
      <dd className="m-0 flex flex-col gap-1">{children}</dd>
    </div>
  );
}
