# Direction A (Blue Note / Reid Miles) — Reader Design Spec

**Date:** 2026-09-03
**Status:** Approved by Trent on the design canvas; steps 1–2 shipped (`484bea0`, `1b025a1`). This spec covers step 3, the component pass.
**Canvas:** https://claude.ai/code/artifact/9729aaf1-a73d-4419-a1d7-af9fe6155755 (four artboards). The artboard sources are copied verbatim into `2026-09-03-direction-a-artboards/` — they are the pixel reference; this document records the decisions behind them.
**Origin:** `docs/ui-review-2026-05.md` Section 2 (Direction A) and Section 3. Section 1 bugs 1.1 and 1.2 were fixed by the `standard_key` migration; 1.3 (TabStrip overstretch) is closed by this spec.

## Scope

Reader surface only: `ReaderHome`, `ReaderDetail`, `TabStrip`, `TuneList`, `TuneCard`, `OverviewTab`, `ChordsTab`, `ChordChart`, `SectionMarkerBadges`, `ListenTab`, `YouTubePlaylistButton`. The Editor (`/edit/*`) is **out of scope** and keeps `jazz-blue`.

## Tokens (already in `app/src/index.css` and `app/tailwind.config.js`)

| Token | Value | Tailwind |
|---|---|---|
| paper | `#f4ede1` | `bg-paper` `text-paper` |
| ink | `#141210` | `bg-ink` `text-ink` |
| rule | `#141210` (1px hairline) | `border-rule` `divide-rule` |
| accent (Blue Note red) | `#d8321f` | `text-accent` `border-accent` |
| muted | `#6b6459` | `text-muted` |
| muted-soft | `#a39a8c` | `text-muted-soft` |

Font: Inter Tight (Google Fonts), the default `font-sans`. Weights loaded: 400 500 600 800 900.

**Rules that apply everywhere in scope**
- Red is the *only* accent and means "current": active tab, active sort/transpose, selected-row numeral, section letters. Nothing else is red.
- 1px `border-rule` hairlines replace every zinc border. No `rounded-*`, no gradients, no shadows, no emoji.
- No `zinc-*`, `sky-*`, `gray-*`, `amber-*`, `bg-white`, `green-*`, `red-*` classes remain in in-scope files after the pass.
- Small-caps label style, used for every eyebrow/label/tab: `text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted` (tabs and sort/transpose use `text-xs`/`text-[11px]` and `tracking-[0.1em]`–`[0.12em]`).
- Display numerals (rank): 48px = `text-5xl font-black leading-none tracking-[-0.05em] tabular-nums`.
- Mobile (`max-width: 767px`, see `useViewport`) must keep working; artboards are desktop (1400×900) so mobile reductions are stated per component below.

## Components

### TabStrip
Content-width tabs, `gap-7`, small caps, active = `border-b-2 border-accent text-ink`, inactive `text-muted`. Strip has `border-b border-rule bg-paper`. Active tab carries `aria-current="page"`. This is the fix for review item 1.3 — no `flex-1`.

### TuneCard (dense — the only variant)
56px row (`h-14`), hairline below. Left 96px gutter (`w-24`) holds the rank at 48px, right-aligned. Right column: title (`text-base font-semibold`, truncated) over a meta line (`text-xs text-muted`, truncated): `Composer · Key +N · style`.
- Composer shows only the composer: `"Jerome Kern (lyrics: Oscar Hammerstein II)"` → `Jerome Kern` via `splitComposer()`.
- Key shows `standard_key` in full (`Ab major`, ≤ 9 chars by schema); `—` when empty but alternates exist; nothing when neither.
- `+N` alternates count in `text-muted-soft` with the keys in `title`.
- Selected: `bg-ink text-paper`, numeral `text-accent`, meta `text-paper/70`; `aria-current="true"`.
- Hover: `hover:bg-ink/5`.
- Rationale: a true single line does not fit 448px with a 48px numeral; two lines at 56px is ~40% denser than today's ~93px rows.

### TuneList
Column stays `w-1/3 max-w-md` (448px) with `border-r border-rule`. Stacked header, each block `border-b border-rule`:
1. Masthead: `JAZZ TUNES` (`text-3xl font-black uppercase tracking-[-0.035em]`), right side `{n} tunes` small caps + a 18px pencil icon linking to `/edit` (plain `<a>`; the editor is a separate route tree).
2. Search: magnifier icon + borderless input (`bg-transparent`, no border, `text-base`, placeholder `Search tunes…`) + `{filtered} of {total}` small caps on the right.
3. Sort: `SORT` label + `Rank · A–Z · Composer · Year`; active = `border-b-2 border-accent text-ink`, `aria-pressed`. **Default sort is Rank** (unranked last).
4. Style chips: `All` + `ballad swing bebop hard bop bossa nova` (top 5 styles by count) + `+ more` text (non-functional placeholder for now). Chip = `border border-rule px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]`; active `bg-ink text-paper`. Match is **case-insensitive and trimmed** against `tune.style` — the data has 115 distinct raw values (108 after case-folding); do not normalise the data in this pass.
Sort/filter live in component state; localStorage persistence is a follow-up.

### OverviewTab
`px-4 sm:px-10 py-8`. Title `text-4xl sm:text-[56px] font-black leading-[0.98] tracking-[-0.04em] text-balance`. Composer line `text-[17px]`; lyricist shown as `· lyrics by …` in `text-muted`, taken from `tune.lyricist` or parsed from the composer parenthetical.
Facts strip replaces StatCards: a `<dl>` grid, `grid-cols-2 sm:grid-cols-4`, `border-y border-rule`, cells separated by `sm:border-r border-rule`. Order: **Rank** (48px numeral) · **Key** (`text-[26px] font-extrabold`, plus `also C major, F major` in `text-xs text-muted` with contexts in `title`) · **Style** (capitalised) · **Year**. A fact is omitted when its value is empty; Key is omitted only when both `standard_key` and `alternate_keys` are empty (existing guard, keep the test).
History & Facts: small-caps heading, paragraphs `text-[15.5px] leading-relaxed max-w-[720px] text-pretty`. Drop the no-op `prose` classes.

### ChordsTab
Small-caps headings. Form paragraph `text-sm leading-relaxed max-w-[800px]`. Transpose = small-caps underline toggle like the tabs: `Transpose  Concert · B♭ · E♭` (labels use ♭ glyphs; the keys passed to `transposeProgression` stay `'Concert' | 'Bb' | 'Eb'`), active `border-b-2 border-accent`, `aria-pressed`. Progression notes `text-xs text-muted leading-relaxed max-w-[800px]`, not italic.

### SectionMarkerBadges
Hairline boxes: `border border-rule px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em]`, label letter in `text-accent`, range with an en dash: `A 1–8`.

### ChordChart (lead sheet)
One row per chart line, 4 measures per row (existing `parseChords` output). Left gutter `w-10 sm:w-14`: section letter (`text-[22px] font-black text-accent`) on rows that start a section, and the row's first measure number (`text-[11px] text-muted-soft tabular-nums`) on every row. Row rules: `border-t-[3px] border-double` where a section starts, `border-t` hairline otherwise, `border-b-[3px] border-double` after the last row. Cells: `h-14`, `border-l border-rule` (last cell also `border-r`), chords `text-lg sm:text-2xl font-extrabold tracking-[-0.02em]` via `ChordSymbol` (shipped in step 1), `gap-3 sm:gap-4` between chords in a compound measure. No boxes, no `rounded`, no mono. A marker that starts mid-row renders its letter as a small red label inside that cell (keeps existing behaviour for odd forms).
Test hooks: `data-measure` on cells, `data-section` on every section label, `data-measure-number` on gutter numbers, `data-section-start` on rows that begin a section.

### ListenTab / YouTubePlaylistButton
Flat hairline rows instead of gradient slabs: `border border-rule px-4 py-3`, left = label in small caps (`YouTube Performances`, `YouTube Backing Tracks`, `Spotify Playlist`), right = caption `12 tracks · opens in new tab` in `text-xs text-muted`. `hover:bg-ink/5`. Famous recordings: a `divide-y divide-rule` list, `text-sm`, no bullets. The `variant` prop on `YouTubePlaylistButton` goes away.

### ReaderHome / ReaderDetail
`bg-white` → `bg-paper`; `border-zinc-200` → `border-rule`; loading/empty text → `text-muted`. Mobile back bar: `min-h-[44px]` button with a chevron icon and small-caps `Back to list`.

## Out of scope (follow-ups, each with a verdict in the plan's closing notes)
Transpose persistence + E♭ default, keyboard navigation, `+ more` styles, localStorage for sort/filter, structured famous-recordings rows, Editor re-skin, `style` data normalisation.
