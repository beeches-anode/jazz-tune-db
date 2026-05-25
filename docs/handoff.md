# Hand-off notes — v1 ship session

Written immediately after the session that shipped v1. Read this in a few days when deciding whether to invest in further fixes.

## Where things stand

- **Reader:** https://jazz-tune-db.netlify.app — live, public, mobile-first.
- **Editor:** https://jazz-tune-db.netlify.app/edit — live, password-gated. Saves commit to GitHub. Verified end-to-end.
- **Canonical data:** `data/jazz-tunes.json` in the repo. The web editor commits to it. Claude Code can edit it directly.
- **Repo:** `/Users/trentjordan/code_projects/jazz-tune-db` (local), `beeches-anode/jazz-tune-db` (GitHub).

v1 is done. Everything below is optional.

## What we agreed at the end of the session

- **Don't grind through the backlog.** Most items are speculative engineering polish that won't matter until you actually feel friction.
- **Use the app for a few days first.** Open it before gigs. Edit tunes when you spot errors. Track new annoyances as they happen.
- **Add to `docs/backlog.md` as you discover things.** Don't trust memory — your future self won't remember a vague "the chord chart felt weird that one time."

## Triage protocol for backlog items

When you're tempted to fix something, ask:

1. **Did I feel this in real use, or am I imagining it from code review?** Real signal beats theoretical signal every time.
2. **What's it costing me each time it bites?** If the answer is "git log looks ugly" — skip. If it's "I couldn't add the tune I wanted to add" — fix.
3. **Will another session reveal more of this kind of issue?** If yes, batch fix later when you have 3 related items.

## Items I think you'll actually hit

Ordered by my honest estimate of probability you'll feel them in normal use:

1. **B3 (YouTube key restrictions) for `netlify dev` locally.** If you ever want to run the app locally with full Functions support, the localhost referrer entry uses a non-standard syntax — may not actually work. Add `http://localhost:8888/*` explicitly if you hit a 403.

2. **B1 (verbose commit messages).** Every save lists all ~18 fields in the commit message. If you make 30+ edits and then want to read git log to remember what you changed, you'll hate it. Fix: diff the tune against the loaded copy in `TuneEditor.handleSave`, send only changed fields. ~20 min.

3. **B4 (`key` / `standard_key` duplication).** Most tunes have both. Both are now editable. You'll eventually edit one and not the other and get confused which is "right." Pick one as canonical; pull values across; remove the other. ~15 min of Python/Claude Code work.

4. **B10 (bundle size on phone).** First load of `/` on a slow connection downloads ~140 kB of editor JS that reader users don't need. May or may not be noticeable. Fix: `React.lazy()` on EditorLaptop and EditorMobile. ~30 min.

## Items I think you'll NOT feel

- **B2** — done in this session.
- **B5** (orphan `backing_tracks` field on 1 tune) — invisible unless you go looking for it.
- **B6** (loose `validateNewTune`) — only matters if you create tunes via something other than the editor.
- **B7** (two `chordUtils.js` files) — separate consumers, separate APIs, no actual bug.
- **B8** (Editor ESLint relaxation) — cosmetic.
- **B9** (pre-existing lint findings) — nobody's lint score is perfect.
- **B11** (no integration tests for Functions) — the unit tests already cover the helpers; integration tests guard against regressions in glue code that you're unlikely to change.
- **B12** (`expected_sha` concurrency stub) — only matters with two simultaneous saves from two devices. You're one person.

## Three things we never tested

These should work but you have no evidence of it. Worth a quick check next time you're in the app:

1. **Cross-device edit visibility.** Edit a tune on your laptop, refresh on your phone within ~10 seconds — does the change appear? It should, because `useTunes` revalidates on every mount and the GitHub raw URL CDN has ~5s freshness.

2. **Soft delete + restore.** In the laptop editor, archive a tune (set `is_archived: true`). Confirm it disappears from the reader at `/`. Find it again in the editor (it should still be visible there because the editor uses `allTunes`). Set `is_archived: false`. Confirm it reappears in the reader.

3. **Claude Code data edit flow.** In a new Claude Code session, ask Claude to add a small tune to `data/jazz-tunes.json`. Verify the file format matches existing tunes, Claude commits cleanly, and the new tune appears in the reader after Netlify rebuilds. This is the workflow CLAUDE.md describes; it should work but we've never run it end-to-end in this build.

## How to resume work in a new Claude Code session

1. `cd /Users/trentjordan/code_projects/jazz-tune-db`
2. `git pull --rebase` — the web app may have committed since you were last here
3. Open Claude Code. Reference `docs/handoff.md` (this file), `docs/backlog.md`, or `docs/plan.md` as needed.
4. For a backlog item: tell Claude "implement B1" (or whichever) — Claude can read backlog.md and pick up from there.
5. For a new bug: just describe it. Claude has the project context via `CLAUDE.md`.

## Pre-flight checks if something feels broken

- **`git log --oneline -5`** — what changed recently? Maybe a save committed something unexpected.
- **Network tab on `/edit`** — if a save fails, the response body of the POST to `save-tune` tells you why (401 = token issue, 400 = validation, 500 = GitHub API issue).
- **Netlify dashboard → Logs → Functions** — runtime errors from `save-tune`, `auth-check`, `create-tune` show here.
- **`cat data/jazz-tunes.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))"`** — sanity check the file is valid JSON and has 527+ tunes.

## Key context the conversation generated

- The original plan envisioned a clean architecture but the ported editor (~5,000 lines in `app/src/routes/Editor/`) is legacy code copied over verbatim from `jazz-db-app/`. ESLint is relaxed for that subtree. The code works but isn't pretty.
- Three bugs almost got missed because of layered failure modes: editor sent `id` in payload → server rejected silently → UI lied with a fake success alert. They were caught and fixed in commit `6d4b99c`. If saves ever stop committing again, check the Network tab first — the UI may lie about success.
- The `VITE_*` env var convention bakes the value into the client bundle at build time. Netlify's secret scanner blocked the first deploy because of this; the fix was the `SECRETS_SCAN_OMIT_KEYS` entry in `netlify.toml`. Keep this in mind if you add another `VITE_*` env var later.

## Commit history of this session

```
78b0ca9 fix(editor): use react-player v3 'src' prop instead of 'url'
0093971 (a save from your testing)
8111870 docs(CLAUDE.md): fix schema lock reference to point at validation.js
be31d5e docs: add backlog of non-blocking issues from v1 build
c8aaf46 chore: remove jazz-db-app — superseded by app/
8cb1cb5 feat(editor): add calypso as a style option
5d5e406 (a save from your testing)
828b0bf (a save from your testing)
6d4b99c fix(editor): strip id from save payload + flush save on click + expose curator_notes/validated/key fields
c1945a4 fix(netlify): allow VITE_YOUTUBE_API_KEY in build output
95ed714 docs: add project README
a855284 feat(mobile): EditorMobile — lightweight per-tune form with YouTube paste
e373506 feat(mobile): PasteYouTubeModal — paste URL → auto-fetch title → add
3ff97d2 feat(editor): EditorLaptop route wired with AuthGate
4b76420 feat(editor): wire DatabaseContext to debounced saves via useSaveTune
4ce25fb feat(hooks): useSaveTune and useCreateTune — POST to Netlify Functions
efb74dc feat(components): AuthGate — password prompt for editor
ecf0227 feat(hooks): useAuth — editor password gate + token storage
eb8546a feat(functions): create-tune — add new tune with generated ID
0f74e2e feat(functions): save-tune — commit field updates via GitHub Contents API
e49942c feat(functions): auth-check — validate password, mint HMAC token
85d885d feat(functions): server-side tune schema validation
4e665d3 feat(functions): GitHub Contents API client (fetch + commit)
d335bfd feat(functions): HMAC token sign/verify helper
378c180 refactor(editor): swap localStorage for useTunes in DatabaseContext
aa09f5e feat(editor): port existing editor components
```

Roughly 25 commits across Phases 5-9. Search any one to see exact diffs.
