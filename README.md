# Trent's Jazz Tune Database

Personal web app for browsing and editing 525+ jazz tunes.

## Use

- **Browse:** https://jazz-tune-db.netlify.app — public, mobile-first, no auth
- **Edit:** https://jazz-tune-db.netlify.app/edit — password-gated; mobile = light form, laptop = rich editor
- **From Claude Code:** ask Claude to read or edit `data/jazz-tunes.json` directly

## Architecture

- `app/` — Vite/React app
- `data/jazz-tunes.json` — canonical data (525+ tunes)
- `app/netlify/functions/` — save-tune, create-tune, auth-check
- `docs/spec.md` — full design
- `docs/plan.md` — implementation plan

Edits from the web app commit to GitHub via the Contents API. The app fetches data at runtime from `raw.githubusercontent.com` so saves are visible within ~10 seconds across devices.

## Local dev

```bash
cd app
npm install
npm run dev          # reader works; saves fail (no Netlify Functions locally)
npx netlify dev      # full local with functions (requires `netlify-cli` and a local .env)
```

## Tests

```bash
cd app && npm test
```

## Adding a tune via Claude Code

```
cd /Users/trentjordan/code_projects/jazz-tune-db
git pull --rebase
# Tell Claude: "add a tune for Stablemates by Benny Golson, swing, 1955"
# Claude reads data/jazz-tunes.json, appends, commits, pushes.
```
