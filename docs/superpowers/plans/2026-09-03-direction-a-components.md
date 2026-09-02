# Direction A Component Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the reader surface (list, detail tabs, chord chart) to the approved Blue Note / Reid Miles treatment so the app ships fully in Direction A rather than the current half-migrated cream-around-white state.

**Architecture:** Pure re-skin plus three small behaviour additions (sort, style filter, composer/lyricist split). Every component keeps its props and its existing test hooks (`data-measure`, `data-section`); styling moves from zinc/sky utilities to the `paper / ink / rule / accent / muted` tokens added in `1b025a1`. New shared logic lives in one helper module (`src/utils/tuneText.js`) so `TuneCard` and `OverviewTab` do not duplicate it. Work happens on a branch and lands as one PR after Phase 5, so `main` never gets more half-migrated than it already is.

**Tech Stack:** React 19, Vite 7, Tailwind 3.4 (tokens in `app/tailwind.config.js`), vitest + @testing-library/react. Inter Tight is already loaded from `app/index.html`.

**Spec:** `docs/superpowers/specs/2026-09-03-direction-a-design.md` — read it first. The four artboards in `docs/superpowers/specs/2026-09-03-direction-a-artboards/` are the pixel reference; open them in a browser when a value in this plan seems ambiguous.

## Global Constraints

- Work on branch `direction-a` from `main`. Commit per task. Never commit `data/jazz-tunes.json` on this branch (the web editor writes to `main`).
- Only these colour classes may remain in in-scope files when a task finishes: `paper`, `ink`, `rule`, `accent`, `muted`, `muted-soft` (plus opacity modifiers like `bg-ink/5`, `text-paper/70`). Grep after each task: `grep -n "zinc-\|sky-\|gray-\|amber-\|bg-white\|green-\|red-\|rounded\|gradient" <file>` must return nothing.
- No `rounded-*`, no gradients, no shadows, no emoji, no `font-mono` in scope.
- Red (`accent`) only for: active tab, active sort/transpose, selected-row numeral, section letters.
- Label style string, copy verbatim: `text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted`.
- Rank numeral, copy verbatim: `text-5xl font-black leading-none tracking-[-0.05em] tabular-nums`.
- Existing test hooks stay: `data-measure` (chord cells), `data-section` (section labels). New hooks defined in tasks: `data-tune-card`, `data-rank`, `data-measure-number`, `data-section-start`.
- Test commands: from `app/`: `npx vitest run <file>` per task, and `npm run lint && npm test` before every commit. `npm run build` must pass at each phase boundary.
- Mobile (`max-width: 767px`) must keep working. Phase boundaries include a 375px check.
- Commit trailer on every commit: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **Phase boundaries are hard stops.** Summarise commits, then wait for Trent's "go".

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `app/src/components/TabStrip.jsx` | Content-width small-caps tabs, `aria-current` | 1 |
| `app/src/routes/ReaderDetail.jsx`, `ReaderHome.jsx` | Paper background, hairline rules, 44px mobile back button | 2 |
| `app/src/utils/tuneText.js` (new) | `splitComposer()` — composer/lyricist parsing | 3 |
| `app/src/components/TuneCard.jsx` | Dense 56px row with 48px rank gutter | 4 |
| `app/src/components/TuneList.jsx` | Masthead, search, sort, style chips | 5 |
| `app/src/components/OverviewTab.jsx` | Title block, facts strip `<dl>`, history | 6 |
| `app/src/components/SectionMarkerBadges.jsx` | Hairline section boxes | 7 |
| `app/src/components/ChordsTab.jsx` | Small-caps transpose toggle with ♭ labels | 8 |
| `app/src/components/ChordChart.jsx` | Lead-sheet grid with gutter and double bars | 9 |
| `app/src/components/ListenTab.jsx`, `YouTubePlaylistButton.jsx` | Flat hairline service rows | 10 |

---

## Phase 1 — Detail-pane chrome

### Task 0: Branch

- [ ] **Step 1: Create the branch**

```bash
cd /Users/trentjordan/code_projects/jazz-tune-db
git pull --rebase
git checkout -b direction-a
```

### Task 1: TabStrip — content-width small caps (closes review item 1.3)

**Files:**
- Modify: `app/src/components/TabStrip.jsx`
- Test: `app/src/components/tabs.test.jsx` (existing `describe('TabStrip')`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `TabStrip({ tabs, activeId, onSelect })` unchanged; the active `<button>` now has `aria-current="page"`.

- [ ] **Step 1: Write the failing test** — add inside `describe('TabStrip', …)` in `tabs.test.jsx`:

```jsx
  it('marks the active tab with aria-current and leaves the others unmarked', () => {
    render(
      <TabStrip
        tabs={[{ id: 'overview', label: 'Overview' }, { id: 'chords', label: 'Chords' }]}
        activeId="chords"
        onSelect={() => {}}
      />
    );
    expect(screen.getByText('Chords')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Overview')).not.toHaveAttribute('aria-current');
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd app && npx vitest run src/components/tabs.test.jsx`
Expected: FAIL — `expected <button> to have attribute "aria-current"`.

- [ ] **Step 3: Replace `TabStrip.jsx` with**

```jsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx vitest run src/components/tabs.test.jsx`
Expected: PASS (all TabStrip/OverviewTab/ListenTab/ChordsTab tests in the file).

- [ ] **Step 5: Grep the file for banned classes** — `grep -n "zinc-\|sky-\|bg-white\|flex-1" app/src/components/TabStrip.jsx` → no output.

- [ ] **Step 6: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/TabStrip.jsx app/src/components/tabs.test.jsx
git commit -m "style(reader): TabStrip as content-width small caps with red underline

Closes review item 1.3 (tabs no longer flex-1 across the pane). Active
tab carries aria-current=page.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 2: ReaderDetail / ReaderHome — paper, hairlines, mobile back button

Style-only task: no behaviour changes, so no new test (the existing suite must stay green). Verification is the grep in Step 3 and the visual check at the phase boundary.

**Files:**
- Modify: `app/src/routes/ReaderDetail.jsx:22`
- Modify: `app/src/routes/ReaderHome.jsx:14-15, 21-24, 41, 48`

- [ ] **Step 1: In `ReaderDetail.jsx` change the wrapper**

```jsx
    <div className="flex flex-col h-full bg-paper">
```

- [ ] **Step 2: In `ReaderHome.jsx` make these five edits**

Loading / error lines (14–15):
```jsx
  if (loading) return <div className="p-8 text-center text-muted">Loading tunes…</div>;
  if (error) return <div className="p-8 text-center text-accent">Failed to load: {error.message}</div>;
```

Mobile back bar (lines 21–24) becomes:
```jsx
          <div className="border-b border-rule bg-paper px-2">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 min-h-[44px] px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to list
            </button>
          </div>
```

Laptop list column (line 41):
```jsx
      <div className="w-1/3 max-w-md border-r border-rule">
```

Empty detail pane (line 48):
```jsx
          <div className="h-full flex items-center justify-center text-muted">
```

- [ ] **Step 3: Grep** — `grep -n "zinc-\|sky-\|bg-white" app/src/routes/ReaderHome.jsx app/src/routes/ReaderDetail.jsx` → no output.

- [ ] **Step 4: Run the suite** — `cd app && npm run lint && npm test` → all green (130+ tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/routes/ReaderDetail.jsx app/src/routes/ReaderHome.jsx
git commit -m "style(reader): paper background, hairline rules, 44px mobile back button

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Phase 1 boundary — STOP

Run `cd app && npm run build`, start the dev server (`.claude/launch.json` → `jazz-app`), open a tune, screenshot the tab strip at 1400×900 and the back bar at 375px. Report commit SHAs and screenshots; wait for "go".

---

## Phase 2 — The list

### Task 3: `splitComposer()` helper

**Files:**
- Create: `app/src/utils/tuneText.js`
- Create: `app/src/utils/tuneText.test.js`

**Interfaces:**
- Produces: `splitComposer(composer: string | null | undefined) → { name: string, lyricist: string | null }`. Used by Task 4 and Task 6.

- [ ] **Step 1: Write the failing tests** — `app/src/utils/tuneText.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { splitComposer } from './tuneText';

describe('splitComposer', () => {
  it('splits the "(lyrics: …)" parenthetical into a lyricist', () => {
    expect(splitComposer('Jerome Kern (lyrics: Oscar Hammerstein II)')).toEqual({
      name: 'Jerome Kern',
      lyricist: 'Oscar Hammerstein II',
    });
  });
  it('returns the composer unchanged when there is no parenthetical', () => {
    expect(splitComposer('Duke Ellington, Billy Strayhorn')).toEqual({
      name: 'Duke Ellington, Billy Strayhorn',
      lyricist: null,
    });
  });
  it('trims stray whitespace', () => {
    expect(splitComposer('  Kurt Weill  ')).toEqual({ name: 'Kurt Weill', lyricist: null });
  });
  it('handles a missing composer', () => {
    expect(splitComposer(null)).toEqual({ name: '', lyricist: null });
    expect(splitComposer(undefined)).toEqual({ name: '', lyricist: null });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `cd app && npx vitest run src/utils/tuneText.test.js` → FAIL, "Failed to resolve import ./tuneText".

- [ ] **Step 3: Create `app/src/utils/tuneText.js`**

```js
// "Jerome Kern (lyrics: Oscar Hammerstein II)" → { name: 'Jerome Kern', lyricist: 'Oscar Hammerstein II' }
// The data keeps lyricists inside the composer string for ~120 tunes; the
// dedicated `lyricist` field is usually null. Callers prefer the field when set.
export function splitComposer(composer) {
  const text = (composer ?? '').trim();
  const m = text.match(/^(.*?)\s*\(lyrics:\s*(.*?)\)\s*$/);
  if (!m) return { name: text, lyricist: null };
  return { name: m[1].trim(), lyricist: m[2].trim() };
}
```

- [ ] **Step 4: Run to verify pass** — same command → 4 passed.

- [ ] **Step 5: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/utils/tuneText.js app/src/utils/tuneText.test.js
git commit -m "feat(utils): splitComposer separates the lyrics parenthetical

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 4: TuneCard — dense row

**Files:**
- Modify: `app/src/components/TuneCard.jsx` (full rewrite)
- Test: `app/src/components/TuneCard.test.jsx`

**Interfaces:**
- Consumes: `splitComposer` from Task 3.
- Produces: `TuneCard({ tune, selected, onClick })` unchanged props. Root `<button>` gets `data-tune-card={tune.id}` and `aria-current="true"` when selected; the rank `<span>` gets `data-rank`. Task 5's tests rely on `data-tune-card`.

- [ ] **Step 1: Add failing tests** to `TuneCard.test.jsx` (keep the four existing tests):

```jsx
  it('renders the rank as the gutter numeral', () => {
    const tune = { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', rank: 22 };
    const { container } = render(<TuneCard tune={tune} onClick={() => {}} />);
    expect(container.querySelector('[data-rank]').textContent).toBe('22');
  });

  it('shows the composer without the lyrics parenthetical', () => {
    const tune = { id: 't1', tune_name: 'All the Things You Are', composer: 'Jerome Kern (lyrics: Oscar Hammerstein II)' };
    render(<TuneCard tune={tune} onClick={() => {}} />);
    expect(screen.getByText('Jerome Kern')).toBeInTheDocument();
    expect(screen.queryByText(/lyrics/)).not.toBeInTheDocument();
  });

  it('marks the selected row with aria-current and its id', () => {
    const tune = { id: 't9', tune_name: 'So What', composer: 'Miles Davis' };
    const { container } = render(<TuneCard tune={tune} selected onClick={() => {}} />);
    const row = container.querySelector('[data-tune-card="t9"]');
    expect(row).toHaveAttribute('aria-current', 'true');
  });
```

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/TuneCard.test.jsx` → 3 FAIL (null `[data-rank]`, "Jerome Kern" not found because the full string renders, null `[data-tune-card]`).

- [ ] **Step 3: Replace `TuneCard.jsx` with**

```jsx
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
```

- [ ] **Step 4: Verify pass** — same command → 7 passed. Also run `npx vitest run src/components/TuneList.test.jsx` (unchanged, must still pass: it finds cards by title text).

- [ ] **Step 5: Grep** — `grep -n "zinc-\|sky-\|amber-\|bg-white\|rounded" app/src/components/TuneCard.jsx` → no output.

- [ ] **Step 6: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/TuneCard.jsx app/src/components/TuneCard.test.jsx
git commit -m "style(reader): dense TuneCard with 48px rank gutter

Two-line 56px row (title / composer · key +N · style). Selected row
inverts to ink with a red numeral. Composer drops the lyrics
parenthetical via splitComposer.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 5: TuneList — masthead, search, sort, style chips

**Files:**
- Modify: `app/src/components/TuneList.jsx` (full rewrite)
- Test: `app/src/components/TuneList.test.jsx`

**Interfaces:**
- Consumes: `TuneCard` with `data-tune-card={id}` (Task 4).
- Produces: `TuneList({ tunes, selectedId, onSelect })` unchanged props. Sort buttons carry `aria-pressed`; chip buttons carry `aria-pressed` and `data-style-chip`.

- [ ] **Step 1: Add failing tests** to `TuneList.test.jsx`. First change the fixture so it exercises case-insensitive style matching and unranked ordering:

```jsx
const tunes = [
  { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', rank: 22, standard_key: 'Eb major', style: 'Swing', year: 1944 },
  { id: 't2', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', rank: 8, standard_key: 'G minor', style: 'swing', year: 1945 },
  { id: 't3', tune_name: 'Blue Bossa', composer: 'Kenny Dorham', rank: 19, standard_key: 'C minor', style: 'bossa nova', year: 1963 },
  { id: 't4', tune_name: 'Zebra Stripes', composer: 'Anon', standard_key: 'C major', style: 'ballad', year: 1930 },
];

const order = (container) =>
  Array.from(container.querySelectorAll('[data-tune-card]')).map((el) => el.getAttribute('data-tune-card'));
```

Then add these tests (keep the existing four; the fixture change does not break them):

```jsx
  it('sorts by rank by default, unranked tunes last', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    expect(order(container)).toEqual(['t2', 't3', 't1', 't4']);
  });

  it('sorts A–Z when that sort is chosen', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'A–Z' }));
    expect(order(container)).toEqual(['t2', 't3', 't1', 't4']);
    expect(screen.getByRole('button', { name: 'A–Z' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sorts by year when that sort is chosen', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Year' }));
    expect(order(container)).toEqual(['t4', 't1', 't2', 't3']);
  });

  it('filters by style chip, matching case-insensitively', () => {
    const { container } = render(<TuneList tunes={tunes} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'swing' }));
    expect(order(container)).toEqual(['t2', 't1']);
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(order(container)).toHaveLength(4);
  });

  it('shows the masthead count and a link to the editor', () => {
    render(<TuneList tunes={tunes} onSelect={() => {}} />);
    expect(screen.getByText('4 tunes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/edit');
  });
```

Note on the A–Z assertion: Autumn, Blue, Stella, Zebra happens to equal the rank order for this fixture — that is fine, the test still proves the button toggles `aria-pressed` and the Year test proves sorting actually re-orders.

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/TuneList.test.jsx` → the 5 new tests FAIL (no `[data-tune-card]` ordering by rank, no "A–Z"/"Year"/"swing"/"All" buttons, no "4 tunes").

- [ ] **Step 3: Replace `TuneList.jsx` with**

```jsx
import { useState, useMemo } from 'react';
import { TuneCard } from './TuneCard';

const SORTS = [
  { id: 'rank', label: 'Rank', cmp: (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999) },
  { id: 'name', label: 'A–Z', cmp: (a, b) => (a.tune_name ?? '').localeCompare(b.tune_name ?? '') },
  { id: 'composer', label: 'Composer', cmp: (a, b) => (a.composer ?? '').localeCompare(b.composer ?? '') },
  { id: 'year', label: 'Year', cmp: (a, b) => (a.year ?? 9999) - (b.year ?? 9999) },
];

// Top five styles by count. Matched case-insensitively — the data has
// "Ballad" and "ballad" side by side and we are not normalising it here.
const STYLE_CHIPS = ['ballad', 'swing', 'bebop', 'hard bop', 'bossa nova'];

const SMALL_CAPS = 'text-[11px] font-semibold uppercase tracking-[0.1em]';
const CHIP = 'border border-rule px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] leading-tight transition-colors';

export function TuneList({ tunes, selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const [sortId, setSortId] = useState('rank');
  const [style, setStyle] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const { cmp } = SORTS.find((s) => s.id === sortId);
    return tunes
      .filter((t) => !q || t.tune_name?.toLowerCase().includes(q) || t.composer?.toLowerCase().includes(q))
      .filter((t) => !style || t.style?.trim().toLowerCase() === style)
      .slice()
      .sort(cmp);
  }, [tunes, query, sortId, style]);

  return (
    <div className="flex flex-col h-full bg-paper">
      <div className="sticky top-0 bg-paper">
        {/* Masthead */}
        <div className="flex items-end justify-between px-4 pt-5 pb-3 border-b border-rule">
          <div className="text-3xl font-black uppercase leading-none tracking-[-0.035em]">Jazz Tunes</div>
          <div className="flex items-center gap-3.5">
            <span className={`${SMALL_CAPS} text-muted`}>{tunes.length} tunes</span>
            <a href="/edit" aria-label="Edit tunes" className="text-ink hover:text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 px-4 h-[46px] border-b border-rule">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search tunes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-muted-soft focus:outline-none"
          />
          <span className={`${SMALL_CAPS} text-muted whitespace-nowrap`}>{filtered.length} of {tunes.length}</span>
        </div>

        {/* Sort */}
        <div className={`flex items-center gap-4 px-4 h-9 border-b border-rule ${SMALL_CAPS}`}>
          <span className="text-muted">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSortId(s.id)}
              aria-pressed={sortId === s.id}
              className={`pb-0.5 -mb-0.5 border-b-2 transition-colors ${
                sortId === s.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Style chips */}
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-rule">
          <button
            onClick={() => setStyle(null)}
            aria-pressed={style === null}
            className={`${CHIP} ${style === null ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5'}`}
          >
            All
          </button>
          {STYLE_CHIPS.map((s) => (
            <button
              key={s}
              data-style-chip={s}
              onClick={() => setStyle(style === s ? null : s)}
              aria-pressed={style === s}
              className={`${CHIP} ${style === s ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5'}`}
            >
              {s}
            </button>
          ))}
          <span className={`${CHIP} border-transparent text-muted`}>+ more</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((tune) => (
          <TuneCard key={tune.id} tune={tune} selected={tune.id === selectedId} onClick={() => onSelect(tune.id)} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify pass** — `cd app && npx vitest run src/components/TuneList.test.jsx` → 9 passed.

- [ ] **Step 5: Grep** — `grep -n "zinc-\|sky-\|bg-white\|rounded" app/src/components/TuneList.jsx` → no output.

- [ ] **Step 6: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/TuneList.jsx app/src/components/TuneList.test.jsx
git commit -m "feat(reader): TuneList masthead, sort control and style chips

Default sort is rank (unranked last); A–Z / Composer / Year available.
Style chips match case-insensitively so the mixed-case data works
without a migration. Search is borderless with the count on the right.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Phase 2 boundary — STOP

`npm run build`; dev server; screenshot the list at 1400×900 with a row selected, and at 375px. Confirm the search still filters live and a chip + sort combine. Report SHAs; wait for "go".

---

## Phase 3 — Overview

### Task 6: OverviewTab — title block and facts strip

**Files:**
- Modify: `app/src/components/OverviewTab.jsx` (full rewrite)
- Test: `app/src/components/OverviewTab.test.jsx`, `app/src/components/tabs.test.jsx` (`describe('OverviewTab')` there stays as-is and must keep passing)

**Interfaces:**
- Consumes: `splitComposer` (Task 3).
- Produces: `OverviewTab({ tune })` unchanged.

- [ ] **Step 1: Update and add tests** in `OverviewTab.test.jsx`. Replace the second test's assertion and add two tests:

Replace
```jsx
    expect(screen.getByText('— (+2)')).toBeInTheDocument();
```
with
```jsx
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('also C minor, E minor')).toBeInTheDocument();
```

Add:
```jsx
  it('shows the lyricist parsed from the composer parenthetical', () => {
    const tune = { id: 't1', tune_name: 'All the Things You Are', composer: 'Jerome Kern (lyrics: Oscar Hammerstein II)' };
    render(<OverviewTab tune={tune} />);
    expect(screen.getByText('Jerome Kern')).toBeInTheDocument();
    expect(screen.getByText(/lyrics by Oscar Hammerstein II/)).toBeInTheDocument();
  });

  it('renders the facts strip as a definition list in Rank, Key, Style, Year order', () => {
    const tune = { id: 't1', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', rank: 1, standard_key: 'G minor', style: 'swing', year: 1945 };
    const { container } = render(<OverviewTab tune={tune} />);
    const labels = Array.from(container.querySelectorAll('dl dt')).map((el) => el.textContent);
    expect(labels).toEqual(['Rank', 'Key', 'Style', 'Year']);
    expect(container.querySelector('dl').textContent).toContain('1945');
  });
```

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/OverviewTab.test.jsx` → 3 FAIL ("—" alone not found; "Jerome Kern" not found — full string renders; no `dl dt`).

- [ ] **Step 3: Replace `OverviewTab.jsx` with**

```jsx
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
```

- [ ] **Step 4: Verify pass** — `cd app && npx vitest run src/components/OverviewTab.test.jsx src/components/tabs.test.jsx` → all pass (the `tabs.test.jsx` OverviewTab test finds `1944`, `Bb major`, `/Victor Young/`, `/jazz standard/` as their own elements).

- [ ] **Step 5: Grep** — `grep -n "zinc-\|sky-\|bg-white\|rounded\|prose" app/src/components/OverviewTab.jsx` → no output.

- [ ] **Step 6: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/OverviewTab.jsx app/src/components/OverviewTab.test.jsx
git commit -m "style(reader): OverviewTab title block and hairline facts strip

StatCards become a <dl> strip (Rank numeral, Key with alternates,
Style, Year). Lyricist is shown from the field or parsed from the
composer parenthetical.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Phase 3 boundary — STOP

Build; screenshot Overview for *All the Things You Are* (rank, key + alternates), a keyless tune such as *Nardis* (Key shows `—` only if it has alternates; otherwise no Key cell), and at 375px (2×2 facts). Report; wait for "go".

---

## Phase 4 — Chords

### Task 7: SectionMarkerBadges — hairline boxes

**Files:**
- Modify: `app/src/components/SectionMarkerBadges.jsx`
- Create: `app/src/components/SectionMarkerBadges.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
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
```

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/SectionMarkerBadges.test.jsx` → first test FAIL (`[]` — no `data-section-badge`; current text is `A: 1-8`).

- [ ] **Step 3: Replace `SectionMarkerBadges.jsx` with**

```jsx
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
```

- [ ] **Step 4: Verify pass** — same command → 2 passed.

- [ ] **Step 5: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/SectionMarkerBadges.jsx app/src/components/SectionMarkerBadges.test.jsx
git commit -m "style(reader): hairline section badges with red letters

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 8: ChordsTab — small-caps transpose toggle

**Files:**
- Modify: `app/src/components/ChordsTab.jsx` (full rewrite)
- Test: `app/src/components/tabs.test.jsx` (`describe('ChordsTab')`)

**Interfaces:**
- Produces: `ChordsTab({ tune })` unchanged. Transpose keys passed to `ChordChart` stay `'Concert' | 'Bb' | 'Eb'`; only the button labels change to `B♭` / `E♭`.

- [ ] **Step 1: Update the tests** in `tabs.test.jsx` `describe('ChordsTab')`:

```jsx
  it('renders transpose buttons with flat glyphs', () => {
    render(<ChordsTab tune={tune} />);
    expect(screen.getByRole('button', { name: 'Concert' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'B♭' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'E♭' })).toBeInTheDocument();
  });
  it('transposes when B♭ is clicked', () => {
    const { container } = render(<ChordsTab tune={tune} />);
    fireEvent.click(screen.getByRole('button', { name: 'B♭' }));
    expect(container.querySelector('[data-measure]').textContent).toBe('F♯ø');
    expect(screen.getByRole('button', { name: 'B♭' })).toHaveAttribute('aria-pressed', 'true');
  });
```

(These replace the existing `renders transpose buttons` and `transposes when Bb button clicked` tests. Keep `renders chord grid`.)

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/tabs.test.jsx` → 2 FAIL (no button named `B♭`).

- [ ] **Step 3: Replace `ChordsTab.jsx` with**

```jsx
import { useState } from 'react';
import { ChordChart } from './ChordChart';
import { SectionMarkerBadges } from './SectionMarkerBadges';

// `key` feeds transposeProgression; `label` is what the player reads.
const TRANSPOSE_OPTIONS = [
  { key: 'Concert', label: 'Concert' },
  { key: 'Bb', label: 'B♭' },
  { key: 'Eb', label: 'E♭' },
];

const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted';

export function ChordsTab({ tune }) {
  const [transposeKey, setTransposeKey] = useState('Concert');

  return (
    <div className="px-4 sm:px-10 py-7 flex flex-col gap-5">
      {tune.form && (
        <div className="flex flex-col gap-2.5 max-w-[800px]">
          <h3 className={LABEL}>Form &amp; Structure</h3>
          <p className="text-sm leading-relaxed text-pretty">{tune.form}</p>
          <SectionMarkerBadges markers={tune.section_markers} />
        </div>
      )}

      <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.1em]">
        <span className="text-muted">Transpose</span>
        {TRANSPOSE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTransposeKey(key)}
            aria-pressed={transposeKey === key}
            className={`pb-0.5 border-b-2 transition-colors ${
              transposeKey === key ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ChordChart chords={tune.chords} transposeKey={transposeKey} sectionMarkers={tune.section_markers ?? []} />

      {tune.chord_progression_notes && (
        <p className="text-xs leading-relaxed text-muted max-w-[800px] text-pretty">{tune.chord_progression_notes}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify pass** — same command → all pass.

- [ ] **Step 5: Grep** — `grep -n "zinc-\|sky-\|bg-white\|rounded\|italic" app/src/components/ChordsTab.jsx` → no output.

- [ ] **Step 6: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/ChordsTab.jsx app/src/components/tabs.test.jsx
git commit -m "style(reader): ChordsTab small-caps transpose toggle with ♭ labels

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 9: ChordChart — lead-sheet grid

**Files:**
- Modify: `app/src/components/ChordChart.jsx` (full rewrite)
- Test: `app/src/components/ChordChart.test.jsx`

**Interfaces:**
- Consumes: `parseChords`, `transposeProgression`, `splitMeasure` from `../utils/chordUtils`; `ChordSymbol` from `./ChordSymbol` (all shipped in `484bea0`).
- Produces: `ChordChart({ chords, transposeKey, sectionMarkers })` unchanged. Hooks: `data-measure` (cell), `data-section` (every label, gutter or inline), `data-measure-number` (gutter), `data-section-start` (row).

- [ ] **Step 1: Add failing tests** to `ChordChart.test.jsx` (keep the existing five):

```jsx
  it('shows the first measure number of every row in the gutter', () => {
    const { container } = render(
      <ChordChart
        chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Em7 | A7 | Dm7 | G7 |\n| Fmaj7 | Bb7 | Cmaj7 | Cmaj7 |"}
        transposeKey="Concert"
        sectionMarkers={[]}
      />
    );
    const numbers = Array.from(container.querySelectorAll('[data-measure-number]')).map((el) => el.textContent);
    expect(numbers).toEqual(['1', '5', '9']);
  });

  it('marks rows that begin a section', () => {
    const { container } = render(
      <ChordChart
        chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Em7 | A7 | Dm7 | G7 |"}
        transposeKey="Concert"
        sectionMarkers={[{ label: 'A', start: 1, end: 4 }, { label: 'B', start: 5, end: 8 }]}
      />
    );
    expect(container.querySelectorAll('[data-section-start]')).toHaveLength(2);
  });

  it('renders a marker that starts mid-row inside that cell', () => {
    const { container } = render(
      <ChordChart
        chords="| Cmaj7 | Dm7 | G7 | Cmaj7 |"
        transposeKey="Concert"
        sectionMarkers={[{ label: 'B', start: 3, end: 4 }]}
      />
    );
    expect(container.querySelectorAll('[data-section-start]')).toHaveLength(0);
    const cells = container.querySelectorAll('[data-measure]');
    expect(cells[2].querySelector('[data-section]').textContent).toBe('B');
  });
```

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/ChordChart.test.jsx` → 3 FAIL (no `data-measure-number`, no `data-section-start`, inline marker not inside the cell).

- [ ] **Step 3: Replace `ChordChart.jsx` with**

```jsx
import { parseChords, transposeProgression, splitMeasure } from '../utils/chordUtils';
import { ChordSymbol } from './ChordSymbol';

// Lead-sheet grid: 4 measures per row, measure numbers in a left gutter,
// section letters in red, double bars where a section starts.
export function ChordChart({ chords, transposeKey = 'Concert', sectionMarkers = [] }) {
  const grid = parseChords(transposeProgression(chords ?? '', transposeKey));
  const markersByMeasure = new Map(sectionMarkers.map((m) => [m.start, m.label]));

  let measureIdx = 0;
  return (
    <div className="flex flex-col">
      {grid.map((line, lineIdx) => {
        const firstMeasure = measureIdx + 1;
        const lineMarkers = [];
        for (let i = 0; i < line.length; i++) {
          measureIdx++;
          if (markersByMeasure.has(measureIdx)) {
            lineMarkers.push({ col: i, label: markersByMeasure.get(measureIdx) });
          }
        }
        const gutterLabel = lineMarkers.find((m) => m.col === 0)?.label;
        const inlineMarkers = lineMarkers.filter((m) => m.col > 0);
        const isLast = lineIdx === grid.length - 1;

        return (
          <div
            key={lineIdx}
            data-section-start={gutterLabel ? '' : undefined}
            className={`flex items-stretch border-rule ${gutterLabel ? 'border-t-[3px] border-double' : 'border-t'} ${
              isLast ? 'border-b-[3px] border-double' : ''
            }`}
          >
            <div className="w-10 sm:w-14 shrink-0 flex flex-col justify-center gap-0.5 pr-2 sm:pr-3">
              {gutterLabel && (
                <span data-section className="text-[22px] font-black leading-none tracking-[-0.03em] text-accent">
                  {gutterLabel}
                </span>
              )}
              <span data-measure-number className="text-[11px] leading-none text-muted-soft tabular-nums">
                {firstMeasure}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-4">
              {line.map((cell, colIdx) => {
                const inline = inlineMarkers.find((m) => m.col === colIdx);
                return (
                  <div
                    key={colIdx}
                    data-measure
                    className={`relative flex items-center gap-3 sm:gap-4 h-14 px-2 sm:px-3.5 border-l border-rule ${
                      colIdx === line.length - 1 ? 'border-r' : ''
                    } text-lg sm:text-2xl font-extrabold tracking-[-0.02em] leading-none`}
                  >
                    {inline && (
                      <span data-section className="absolute top-1 left-2 text-[11px] font-black leading-none text-accent">
                        {inline.label}
                      </span>
                    )}
                    {splitMeasure(cell).map((token, i) => (
                      <ChordSymbol key={i} token={token} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

Note: an inline marker adds its letter to the cell's `textContent`; the existing cell-text tests only use markers at column 0 (or none), so they are unaffected.

- [ ] **Step 4: Verify pass** — same command → 8 passed. Then `npx vitest run src/components/tabs.test.jsx` (ChordsTab's `renders chord grid` reads `[data-measure]` text) → pass.

- [ ] **Step 5: Grep** — `grep -n "zinc-\|sky-\|bg-white\|rounded\|font-mono" app/src/components/ChordChart.jsx` → no output.

- [ ] **Step 6: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/ChordChart.jsx app/src/components/ChordChart.test.jsx
git commit -m "style(reader): ChordChart as a lead sheet

Measure-number gutter, red section letters, double bars at section
boundaries, hairline barlines instead of boxed cells.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Phase 4 boundary — STOP

Build; screenshot Chords for *All the Things You Are* (Concert and E♭) at 1400×900 and 375px, and one tune whose sections don't align to rows (find one with `python3 -c` over `section_markers` where a `start` is not ≡ 1 mod 4) to confirm the inline label. Report; wait for "go".

---

## Phase 5 — Listen tab and PR

### Task 10: ListenTab / YouTubePlaylistButton — flat rows

**Files:**
- Modify: `app/src/components/YouTubePlaylistButton.jsx` (full rewrite; drop the `variant` prop)
- Modify: `app/src/components/ListenTab.jsx` (full rewrite)
- Test: `app/src/components/tabs.test.jsx` (`describe('ListenTab')`)

- [ ] **Step 1: Add a failing test** to `describe('ListenTab')`:

```jsx
  it('shows the track count caption on the playlist row', () => {
    render(<ListenTab tune={tune} />);
    expect(screen.getByText('1 track · opens in new tab')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Verify failure** — `cd app && npx vitest run src/components/tabs.test.jsx` → 1 FAIL (caption not found; the button currently renders `YouTube Performances (1)`).

- [ ] **Step 3: Replace `YouTubePlaylistButton.jsx` with**

```jsx
import { buildPlaylistUrl } from '../utils/youtubeUrl';

export function YouTubePlaylistButton({ videoIds, label }) {
  if (!videoIds || videoIds.length === 0) return null;
  const url = buildPlaylistUrl(videoIds.map((v) => v.id));
  const n = videoIds.length;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-baseline justify-between gap-4 border border-rule px-4 py-3 hover:bg-ink/5 transition-colors"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{label}</span>
      <span className="text-xs text-muted tabular-nums whitespace-nowrap">
        {n} {n === 1 ? 'track' : 'tracks'} · opens in new tab
      </span>
    </a>
  );
}
```

- [ ] **Step 4: Replace `ListenTab.jsx` with**

```jsx
import { YouTubePlaylistButton } from './YouTubePlaylistButton';

const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted';

export function ListenTab({ tune }) {
  const hasRecordings = tune.famous_recordings?.length > 0;

  return (
    <div className="px-4 sm:px-10 py-7 flex flex-col gap-6">
      {hasRecordings && (
        <div className="flex flex-col gap-2.5 max-w-[720px]">
          <h3 className={LABEL}>Famous Recordings</h3>
          <ul className="divide-y divide-rule border-y border-rule">
            {tune.famous_recordings.map((r, i) => (
              <li key={i} className="py-1.5 text-sm leading-snug">{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-[720px]">
        {tune.spotify_playlist_id && (
          <a
            href={`https://open.spotify.com/playlist/${tune.spotify_playlist_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline justify-between gap-4 border border-rule px-4 py-3 hover:bg-ink/5 transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Spotify Playlist</span>
            <span className="text-xs text-muted whitespace-nowrap">opens in new tab</span>
          </a>
        )}
        <YouTubePlaylistButton videoIds={tune.youtube_video_ids} label="YouTube Performances" />
        <YouTubePlaylistButton videoIds={tune.youtube_backing_track_ids} label="YouTube Backing Tracks" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify pass** — same command → all pass (the existing `/YouTube Performances/i` → `closest('a').href` test still works: the label is its own span inside the `<a>`).

- [ ] **Step 6: Grep** — `grep -n "zinc-\|sky-\|green-\|red-\|bg-white\|rounded\|gradient\|•\|▶" app/src/components/ListenTab.jsx app/src/components/YouTubePlaylistButton.jsx` → no output. Then `grep -rn "variant=" app/src/components/ListenTab.jsx` → no output.

- [ ] **Step 7: Commit**

```bash
cd app && npm run lint && npm test && cd ..
git add app/src/components/ListenTab.jsx app/src/components/YouTubePlaylistButton.jsx app/src/components/tabs.test.jsx
git commit -m "style(reader): ListenTab flat hairline rows, no gradients

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 11: Whole-surface sweep and PR

- [ ] **Step 1: Banned-class sweep across the whole reader surface**

```bash
cd app && grep -n "zinc-\|sky-\|gray-\|amber-\|green-\|red-\|bg-white\|rounded\|gradient\|font-mono" \
  src/components/{TabStrip,TuneCard,TuneList,OverviewTab,ChordChart,ChordSymbol,ChordsTab,SectionMarkerBadges,ListenTab,YouTubePlaylistButton}.jsx \
  src/routes/ReaderHome.jsx src/routes/ReaderDetail.jsx
```
Expected: no output. Fix any hit in place and amend the relevant task's commit message style (`style(reader): …`).

- [ ] **Step 2: Full verification** — `cd app && npm run lint && npm test && npm run build` → all green.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin direction-a
gh pr create --title "Direction A: Blue Note reader redesign" --body "$(cat <<'PRBODY'
## Summary
- Reader surface migrated to the approved Blue Note / Reid Miles treatment (spec: docs/superpowers/specs/2026-09-03-direction-a-design.md)
- Dense TuneCard, sort + style chips in TuneList, hairline facts strip in Overview, lead-sheet ChordChart, flat Listen rows
- Closes review item 1.3 (TabStrip overstretch)

## Test plan
- [ ] `cd app && npm run lint && npm test && npm run build`
- [ ] Desktop 1400×900: list, Overview, Chords (Concert + E♭), Listen
- [ ] Mobile 375px: list, back bar, Overview 2×2 facts, chord grid

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PRBODY
)"
```

### Phase 5 boundary — STOP

Hand Trent the PR link. Merge is his call; Netlify deploys on merge to `main`.

---

## Closing notes for the executor (flag with a verdict)

- **`+ more` chip is a placeholder.** Verdict: leave it until Trent has used the five chips for a while; if he asks for a style twice that isn't there, add a "more" popover then.
- **Sort/filter persistence** is not in this pass. Verdict: add after use — it is a 6-line `localStorage` read/write in `TuneList` and needs no design.
- **Transpose default** stays Concert. Verdict: promote to a persisted E♭ preference in the next phase (Trent plays sax); it is the highest-value follow-up.
- **`style` data normalisation** (115 raw values / 108 case-folded) is deliberately not done. Verdict: skip; case-insensitive matching makes it invisible, and the long tail is a curation job, not a migration.
- **Editor routes** keep `jazz-blue`. Verdict: separate decision; do not touch on this branch.
