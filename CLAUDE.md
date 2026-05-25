# Jazz Tune Database

Personal web app for browsing and editing 525+ jazz tunes. Hosted on Netlify, data stored as JSON in this repo.

## Critical rules

1. **Canonical data file:** `data/jazz-tunes.json`. Never duplicate it elsewhere in the repo.
2. **Always `git pull --rebase` before editing the JSON** — the web app may have committed since your last pull.
3. **One tune per edit operation** when possible — easier to write meaningful commit messages and review history.
4. **Schema lock:** the canonical tune shape is defined by `ALLOWED_FIELDS` and `TYPES` in `app/netlify/functions/_shared/validation.js`. Server-side saves strip any field not in `ALLOWED_FIELDS`, so don't add fields anywhere without updating that file (and ideally a test in `validation.test.js`).
5. **Soft delete only** — set `is_archived: true`. Never remove tunes from the array.
6. **No secrets in repo** — `.env` is gitignored; Netlify env vars hold production secrets.

## Common Claude Code tasks

- **Add a tune:** read `data/jazz-tunes.json`, find a similar existing tune for schema reference, append the new entry with an alphanumeric ID matching existing format (~20 chars), commit, push.
- **Find tunes by criteria:** grep on `data/jazz-tunes.json` or write a small Python one-liner.
- **Update a tune field:** read the file, locate by `tune_name` or `id`, edit just the changed field, commit with message like `"Update <tune_name>: <field>"`, push.

## Architecture (quick)

- `app/` — Vite/React app (reader + editor in one)
- `data/jazz-tunes.json` — canonical data (525+ tunes)
- `app/netlify/functions/` — serverless save/create/auth handlers
- `docs/spec.md` — full design
- `docs/plan.md` — implementation plan (this build)

## Deployment

Netlify auto-deploys on push to `main`. Saves from the web app commit to GitHub via Contents API → trigger Netlify redeploy. Edits also visible without redeploy because the app fetches data at runtime from `raw.githubusercontent.com`.

## Test before committing

```bash
cd app && npm run lint && npm test
```
