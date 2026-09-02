# UI Review & Improvement Ideas — Handoff

**Reviewed:** 2026-05-25
**Against commit:** `78b0ca9` (`fix(editor): use react-player v3 'src' prop instead of 'url'`)
**Reviewer:** Claude (frontend-design skill)
**Status:** Findings only — nothing implemented. Trent is using the app for a few days first to surface real bugs before picking this up.

---

## How to use this document

This is a snapshot from a point-in-time code + visual review. Before acting on anything below:

1. **Re-verify the current state of the codebase.** Pull latest. Then for every finding that cites a file/line, re-open that file and confirm the issue still exists. Several things here are observations about specific JSX that may have been refactored.
2. **Cross-check against `docs/backlog.md`.** That file already tracks non-blocking issues from the v1 build; some items below may overlap.
3. **Prioritize against what Trent actually hit while using the app.** Bugs Trent surfaces during real use trump anything in this doc.
4. **Pick a direction before touching styling.** The aesthetic section asks you to commit to a flavor. Don't half-implement both directions.

When picking up this doc, the suggested re-orientation flow is:

```bash
git pull --rebase
cd app && npm run dev
# Open http://localhost:5173/
# Spot-check the "Critical bugs/layout issues" section against the live app
```

---

## What was reviewed

- Reader home (`app/src/routes/ReaderHome.jsx`) — master/detail layout at 1400×900 and at mobile width
- Reader detail and its three tabs: Overview, Listen, Chords (`app/src/routes/ReaderDetail.jsx`, `app/src/components/*Tab.jsx`)
- `TuneList`, `TuneCard`, `TabStrip`, `ChordChart`, `SectionMarkerBadges`, `YouTubePlaylistButton`
- Global styling: `app/src/index.css`, `app/tailwind.config.js`, `app/index.html`
- Editor was NOT reviewed in depth (`app/src/routes/Editor*.jsx` only skimmed)

---

## Section 1 — Critical bugs / layout issues

These are concrete, observable problems — not style opinions. Fix these regardless of which aesthetic direction you eventually pick.

### 1.1 `standard_key` field is being rendered as a tag but contains paragraphs

**Severity:** High — visibly broken layout on multiple tunes.
**Files:** `app/src/components/TuneCard.jsx:13`, `app/src/routes/OverviewTab.jsx:14`

Many tunes have a `standard_key` value that is a full sentence, not a short label. Examples observed at review time:

- All the Things You Are → `"Ab major (concert); also commonly performed by vocalists in C or F"`
- Alone Together → `"D minor (concert) is most common on bandstands; also called in C minor; vocal charts frequently in G minor."`
- Autumn Leaves → `"G minor (most common instrumental call), E minor (widely published in lead sheets/Real Book)"`

The list-card chip and the Overview "Key" StatCard both display the raw value, blowing out the chip row and creating mismatched StatCard heights.

**Options to consider:**

- **(a) Add `display_key` (short canonical label like "Ab major") to the schema** and keep the long sentence in `standard_key` for the overview body. Update `ALLOWED_FIELDS` in `app/netlify/functions/_shared/validation.js` per the schema-lock rule in `CLAUDE.md`. Add a validation test.
- **(b)** Render only the first segment before `;` / `,` / `(` as the chip label, and show the full sentence as a "key notes" line in Overview. Cheaper but less clean.
- **(c)** Treat `standard_key` as long-form and remove it from the chip / StatCard slots; add a separate short-key field.

**Recommended: (a)** — it makes the data model match how the UI is actually used.

### 1.2 StatCard row collapses when one card has long content

**File:** `app/src/routes/OverviewTab.jsx:12-17`

Symptom: when Key is 3 lines, Style/Year/Rank stay 1 line, leaving three tall empty boxes. The 4-column equal-width grid + `items-stretch` is the cause.

**Fix:** after 1.1 most of this disappears. As a defensive change, use `items-start` and let StatCards size to content, OR switch to a definition-list layout that flows naturally.

### 1.3 TabStrip overstretches at desktop width

**File:** `app/src/components/TabStrip.jsx:8`

Three tabs with `flex-1` each take ~300px at 900px-wide pane. The active blue underline floats far from the tab label and the row feels empty.

**Fix:** constrain to `max-w-2xl` and left-align, OR convert to pill-style tabs (compact, content-width).

### 1.4 Empty detail pane is wasted real estate

**File:** `app/src/routes/ReaderHome.jsx:48`

"Select a tune from the list" centered in a ~1000×900 white pane. Could be a useful landing surface:

- Top-10 ranked tunes (you have `rank`)
- Random pick of the day
- Counts: "527 tunes · N composers · M styles"
- Recently edited tunes (would require a `last_edited` field)

### 1.5 Mobile back affordance is too quiet

**File:** `app/src/routes/ReaderHome.jsx:22-24`

Small `text-sky-600 text-sm` link in a thin top bar. Easy to miss on touch.

**Fix:** left-chevron icon, bigger tap target (44×44 minimum), maybe show current tune title in the bar.

### 1.6 No keyboard navigation

**Where:** none currently exists.

For a 527-row list the sole user manages daily, this hurts. Wishlist:

- `/` focuses search
- `↑` / `↓` moves selection in the list
- `Enter` opens the selected tune
- `Esc` clears search

Small `useKeyboardNav` hook in `app/src/hooks/` would cover it.

---

## Section 2 — Aesthetic direction (the bigger opportunity)

Current state: system sans-serif (`ui-sans-serif, system-ui`), sky-blue accent (`--brand: #0ea5e9`), zinc grays, sky→sky and red→red gradient buttons. Reads as "generic admin tool." Nothing communicates *jazz*.

Note: `jazz-blue` (#1e3a8a) and `jazz-gold` (#f59e0b) are defined in `app/tailwind.config.js:11` but **never used anywhere in the codebase**. Either delete them or use them.

### Direction A — Blue Note Records (Reid Miles era)

Cream/off-white paper background (~#f4ede1), deep ink black, one saturated accent (Blue Note red OR teal).

- **Display font:** heavy geometric — *Neue Haas Grotesk Display*, *Söhne Breit*, or *ITC Avant Garde Gothic*
- **Body font:** refined humanist — *Söhne*, *Inter Tight*, or *GT America*
- **Big tune numerals** (rank chips become bold display numbers)
- Hairline rules (1px black) instead of light zinc borders
- Tabs as small caps with a single underline accent

Gives instant jazz cred. Photographs well. Distinctive without being thematic-overkill.

### Direction B — Editorial / lead-sheet inspired

Same cream paper background, but:

- **Display font:** serif — *GT Sectra*, *Tiempos Headline*, or *EB Garamond*
- **Body font:** light sans — *Söhne*, *Inter Tight*
- **Chord font:** mono — *JetBrains Mono* or *Berkeley Mono*
- Chord grid drawn as a real lead sheet: thick double bars at section boundaries, italic section labels above the staff, repeat barlines where appropriate
- Treats the database as a personal *book* rather than a SaaS dashboard

Quieter than A, more "library." Equally valid.

### Recommendation

**Direction A.** A working musician will read it as "this is my thing"; the visual identity is more recognizable; it's harder to slip back into AI-generic territory once committed. But pick what feels right when you re-read this — both are valid.

**Whichever you pick:** commit fully. Don't half-implement. Update `:root` CSS variables, swap fonts globally via `index.html`, refactor `TuneCard`/`TabStrip`/buttons in one pass.

---

## Section 3 — Specific component upgrades

### TuneCard density

**File:** `app/src/components/TuneCard.jsx`

Two variants:

- **Comfortable** (current): title, composer, chip row
- **Dense** (new): single line — `#5  There Will Never Be Another You · Harry Warren · Eb · swing`

Toggle in the search header. Default to dense — 527 tunes is a lot of scrolling.

### List header — sort + filter

**File:** `app/src/components/TuneList.jsx`

Currently search-only. Add:

- **Sort:** Rank / A–Z / Composer / Year / Style
- **Filter chips:** style (swing / bossa / ballad / blues / modal / bebop / etc.)
- Persist selection to localStorage

For 527 tunes filters earn their keep fast.

### Listen tab — drop the gradients

**Files:** `app/src/components/ListenTab.jsx:31`, `app/src/components/YouTubePlaylistButton.jsx:8`

Current: Spotify (green→darkgreen), YouTube Performances (red→darkred), YouTube Backing (zinc→black) — three big gradient slabs that read as 2014 web design.

**Fix:** flat color blocks with the service's brand color as a 4px left rule, a mono caption underneath: `"12 tracks · opens in new tab"`. Reads editorial, not SaaS.

### Famous Recordings — structured rows

**File:** `app/src/components/ListenTab.jsx:14`

Currently a bulleted text list. Parse the JSON into rows: *Artist · Album · Year*, with a small "▶" icon linking to a YouTube/Spotify search for that recording. Already structured in `data/jazz-tunes.json` (`famous_recordings` is an array); just render it richly.

### Chord grid — real lead-sheet feel

**File:** `app/src/components/ChordChart.jsx`

- Measure numbers in a left gutter
- Thicker bar between sections (use `section_markers`)
- Render slash chords in the documented `Bb7/ D` format with the bass note as a smaller subscript (see [data-slash-chord-format.md](../../.claude/projects/-Users-trentjordan-code-projects-jazz-tune-db/memory/data-slash-chord-format.md) — 155 tunes use this convention)
- Highlight current measure if playback sync ever gets added

### Transpose persistence

**File:** `app/src/components/ChordsTab.jsx:8`

Trent plays sax. Promote Bb / Eb to a persistent user preference (localStorage) so the chord chart doesn't reset to Concert on every tune. Add a global setting too (top of TuneList?) so the preference applies before any tune is opened.

### App header / branding

**Where:** nowhere currently — page starts at the search box.

Thin top bar:

- App title in display font
- Edit icon → `/edit`
- Tune count
- Optional: sax-key preference toggle (Concert / Bb / Eb)

Anchors the page and gives the branding direction (Section 2) somewhere to live.

---

## Section 4 — Nice-to-haves

Not on the critical path. Park these here for later.

- Hover preview on TuneCard showing first 8 bars of chords
- Dark mode (jazz looks great in dark — ink/cream inverts to charcoal/bone)
- Subtle paper grain texture on the cream background (one SVG noise layer at low opacity) — atmospheric, not gimmicky
- `Cmd-K` palette: jump to tune by name, "play backing track for X," etc.
- Print stylesheet for the Chords tab so a tune prints as a clean lead sheet on letter-size paper
- Shareable per-tune URL with deep link into a specific tab (`/?tune=all-the-things-you-are&tab=chords`)

---

## Section 5 — Suggested implementation order

If picking up cold, here's a sane sequence:

1. **Re-verify findings against current `main`.** ~30 min.
2. **Section 1 bug fixes first** (no aesthetic changes). 1.1 → 1.2 → 1.5 → 1.3 → 1.4 → 1.6. Each as its own commit per `CLAUDE.md` one-tune-per-edit ethos. Probably 1–2 sessions total.
3. **Pick aesthetic direction** (A or B from Section 2). Build a single sandbox page (`/?preview=design`) that shows TuneList + TuneCard + Overview + Chord grid in the new aesthetic. Iterate until it feels right *before* touching the real routes.
4. **Migrate routes to new aesthetic** in one PR — fonts, palette, components. Don't ship a half-migrated app.
5. **Section 3 component upgrades** — order by what hurts most in daily use.
6. **Section 4** — only after the above feels finished.

---

## Section 6 — Open questions for Trent

When picking this up, decide:

- [ ] Direction A (Blue Note) or Direction B (editorial)?
- [ ] Add `display_key` to the schema, or parse out from existing `standard_key`?
- [ ] Default sax-key preference: Concert, Bb, or Eb?
- [ ] Worth adding `last_edited` timestamp to tune records for "recently edited" surfaces?
- [ ] Do you want the dense list variant as default, or comfortable?

---

*End of handoff. Re-read Section "How to use this document" before acting on any specific finding.*
