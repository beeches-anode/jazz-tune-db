# Jazz Tune DB — Backlog

Non-blocking issues surfaced during the v1 build. Loosely prioritized; tackle in any order. None block v1 from being declared shipped.

---

## Worth fixing soon (cheap wins, high value)

### B1. Diff-only save payload
**Status:** open · **Effort:** ~20 min · **Files:** `app/src/routes/Editor/TuneEditor/TuneEditor.jsx`

Currently the laptop editor's Save sends the entire `tune` object to the server. The commit message lists every field even when only one changed:

> Update Autumn Leaves: tune_name, composer, year, style, form, ...

Fix: in `handleSave`, diff the current `tune` against the originally loaded copy (snapshot it on mount) and only pass changed fields to `updateTune`. Commit messages become readable: `Update Autumn Leaves: style, rank`.

### B2. CLAUDE.md schema lock points to nonexistent file
**Status:** open · **Effort:** ~10 min · **Files:** `CLAUDE.md`, optionally `app/src/utils/schema.js`

`CLAUDE.md` says "Schema lock: see `app/src/utils/schema.js` for the canonical tune shape." That file doesn't exist. Two paths:
- **A (10 min):** Update `CLAUDE.md` to point at `app/netlify/functions/_shared/validation.js` (the actual de facto schema today).
- **B (30 min):** Extract `ALLOWED_FIELDS` + `TYPES` from `validation.js` into a new `app/src/utils/schema.js`, then both client and server import from it.

### B3. Restore YouTube paste-URL flow
**Status:** open · **Effort:** ~15 min · **Where:** Google Cloud Console + Netlify env var

The `VITE_YOUTUBE_API_KEY` currently set on Netlify may have been deleted from Google Cloud — the mobile "Paste YouTube URL" modal (and the laptop YouTubeCurator) will 403 on calls to `googleapis.com/youtube/v3/videos`.

Fix:
1. Cloud Console → APIs & Services → Credentials → Create credentials → API key.
2. Restrict: HTTP referrers → `jazz-tune-db.netlify.app/*` (and `localhost:*` if you use `netlify dev`).
3. Enable the YouTube Data API v3 for that project.
4. Replace `VITE_YOUTUBE_API_KEY` in Netlify dashboard. Redeploy.

---

## Data hygiene

### B4. Duplicate `key` / `standard_key` fields
**Status:** open · **Effort:** ~15 min · **Files:** `data/jazz-tunes.json`, validation, editor UI

526 tunes have both `key` and `standard_key`. They were both added to `ALLOWED_FIELDS` so the editor doesn't strip either, but this is technical debt. Decide which is canonical (probably `standard_key`), copy values from the other if missing, drop the redundant field, remove it from `ALLOWED_FIELDS`.

### B5. Orphan `backing_tracks` field on 1 tune
**Status:** open · **Effort:** ~5 min · **Files:** `data/jazz-tunes.json`

Exactly one tune has a `backing_tracks` field (presumably legacy). Decide: migrate into `youtube_backing_track_ids` if compatible, or just delete the field on that tune.

### B6. Tighten `validateNewTune`
**Status:** open · **Effort:** ~15 min · **Files:** `app/netlify/functions/_shared/validation.js`, `validation.test.js`

`validateNewTune` only checks that `tune_name` and `composer` are non-empty strings. It doesn't run other fields through the `ALLOWED_FIELDS` / type-check pipeline that `validateTuneUpdate` enforces. Not exploitable in practice (the editor only sends known fields) but a client mistake could pollute the data file. Fix: after the required-fields check, run the rest of the payload through `validateTuneUpdate`-style sanitization.

---

## Code quality / maintenance

### B7. Two `chordUtils.js` files
**Status:** open · **Effort:** ~1 hour · **Files:** `app/src/utils/chordUtils.js`, `app/src/routes/Editor/utils/chordUtils.js`

Reader has a 62-line `chordUtils` for parsing+transposition. Editor port has a 269-line version with `chordToSymbols`, `parseChord`, validation helpers, section-marker generation. Different APIs, separate maintenance. Consolidate when there's a reason to touch either.

### B8. Editor ESLint relaxation
**Status:** open · **Effort:** variable · **Files:** `app/eslint.config.js` + ported editor tree

`app/eslint.config.js` has an override scoped to `src/routes/Editor/**` that relaxes 4 rules to accommodate ported legacy code. Rule-by-rule cleanup of the ported components removes the need for the override, at which point delete it.

### B9. Pre-existing lint findings
**Status:** open · **Effort:** ~30 min total · **Files:** `app/src/hooks/useTunes*`, `app/src/components/ListenTab.jsx`, editor utils

Six errors, two warnings carried from earlier phases:
- `useTunes.test.jsx`: `global` is not defined (test setup issue)
- `useTunes.js`: `react-hooks/set-state-in-effect`
- `ListenTab.jsx`: unused variables
- `chordUtils.js` (editor port): unused `from` parameters

All cosmetic. Fix when touching the relevant file.

### B10. Bundle size — lazy-load the editor
**Status:** open · **Effort:** ~30 min · **Files:** `app/src/App.jsx`, `app/src/routes/EditorLaptop.jsx`, `EditorMobile.jsx`

Main chunk is 528 kB (137 kB gzipped) because the editor is eagerly imported. Reader-only users (most page loads on the public URL) pay for editor JS they don't need. Fix:

```jsx
const EditorLaptop = lazy(() => import('./routes/EditorLaptop'));
const EditorMobile = lazy(() => import('./routes/EditorMobile'));
// Wrap with <Suspense fallback={...}>
```

### B11. No tests for Function handlers
**Status:** open · **Effort:** ~1 hour · **Files:** `app/netlify/functions/auth-check.test.js` etc.

`auth-check`, `save-tune`, `create-tune` are tested transitively (via `_shared/*` tests). Integration tests that hit them with a stub `fetch` + env vars would catch regressions in auth/validation glue.

---

## Operational

### B12. `expected_sha` optimistic concurrency stub
**Status:** open · **Effort:** ~2 hours · **Files:** `app/netlify/functions/save-tune.js`

`save-tune.js` accepts `expected_sha` but doesn't actually use it — there's a comment that says concurrency policy "is a stub for v2." For single-user use this is fine; if you ever have two devices saving simultaneously, the second write could clobber an unrelated field change made between the first device's fetch and commit. Real fix: when `expected_sha !== sha`, check whether the updated fields overlap with fields changed between the two shas; reject only on overlap.

### B13. `jazz-db-app/` directory remnants
**Status:** open · **Effort:** 5 sec · **Action:** `rm -rf jazz-db-app/`

After Task 32, the directory still contains the gitignored `.env` and `node_modules/`. Safe to remove whenever; the `.env` value is in 1Password / Netlify.

---

## Notes

- Auto-deploy on push to `main` means any of these changes will go live within ~90 seconds of push. Sequence accordingly.
- The data file `data/jazz-tunes.json` is the canonical store. Run `git pull --rebase` before any local edit; the web editor commits in parallel.
- The original v1 spec (`docs/spec.md` Section 13 "Open questions") may overlap with some of these items.
