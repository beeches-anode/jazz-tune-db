# Trent's Jazz Tune Database — v1 Design Spec

**Date:** 2026-05-24
**Status:** Approved for implementation
**Repo:** `beeches-anode/jazz-tune-manager` (to be renamed `jazz-tune-db`)
**Spec owner:** Trent Jordan

---

## 1. Purpose

A personal Netlify-hosted web app that provides:

- **Mobile-first browsing** of a curated database of 525+ jazz tunes (composer, year, style, key, form, chord progressions, history, famous recordings, YouTube performances and backing tracks)
- **Edit access from any device** — laptop for deep curation work, mobile for quick captures (paste a YouTube URL, fix a typo, mark approved)
- **Direct Claude Code access** to the same data via local file edits — *"Add Stablemates to the tune list"* works naturally from a terminal session
- Single source of truth: one JSON file in a GitHub repo, version-controlled, never duplicated

This supersedes the prior `jazz-db-app/` editor (localStorage-only, single-device) and the JPP-internal `jazz-tune-editor/` PWA.

## 2. Goals

| Goal | How v1 achieves it |
|---|---|
| Browse 525+ tunes from anywhere | Public Netlify deploy, mobile-first reader UI |
| Edit from anywhere | Password-gated `/edit` route with mobile-light and laptop-rich modes |
| Single source of truth | One JSON file in GitHub repo; all three clients read/write it |
| Claude Code can manipulate tunes | Local file in git repo; Claude uses `Read`/`Edit` directly |
| Never lose data | Soft delete only (`is_archived: true`); GitHub commit history |
| No new infrastructure to maintain | GitHub-as-database — no DB, no separate API service |

## 3. Non-goals (v1)

- Multi-user / sharing with other musicians
- Real-time collaboration / live concurrent editing
- Audio file storage (YouTube IDs only)
- Practice session logging (lives in Atlas: `music/practice-data/jpp-data.json`)
- Native iOS / Android app
- MCP server for Claude Code (deferred to a possible Phase 3)
- Custom domain (using Netlify subdomain in v1; can move later)

## 4. Architecture

### 4.1 One app, two routes

A single Vite/React app deployed to Netlify with React Router. Two top-level routes:

| Route | Purpose | Access | Layout strategy |
|---|---|---|---|
| `/` | Reader — browse and review tunes | Public | Mobile-first; master-detail on laptop, list → full-screen detail on mobile |
| `/edit` | Editor | Password-gated (single shared password in Netlify env var) | Mode auto-switches by viewport: mobile = lightweight form, laptop = existing rich editor |

The reader bundle and editor bundle are code-split — `/edit` only loads its code when you visit it.

### 4.2 Three clients, one source of truth

```
                  GitHub: beeches-anode/jazz-tune-manager
                  data/jazz-tunes.json
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
  Browser (any device)     Netlify Function           Laptop file system
  GET raw.githubusercontent  /api/save-tune          (Claude Code reads/
  on app load (CDN-cached,   POST → GitHub            edits/commits/pushes
  ~5s freshness)             Contents API             directly)
                             (PAT in env var)
```

**Critical:** The app fetches data **at runtime from `raw.githubusercontent.com`**, not from the static Netlify bundle. This means edits become visible within ~5 seconds (raw GitHub CDN cache TTL) without a redeploy.

### 4.3 Repo structure (post-restructure)

```
jazz-tune-db/                          (renamed from jazz-tune-manager)
├── data/
│   └── jazz-tunes.json                Canonical file (525+ tunes)
├── app/                               The unified Vite app (was jazz-db-app/)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── Reader/                Reader views (list, detail, tabs)
│   │   │   └── Editor/                Editor views (laptop rich + mobile light)
│   │   ├── components/                Shared (ChordChart, YouTubeButton, etc.)
│   │   ├── hooks/                     useTunes, useSaveTune, useAuth
│   │   ├── utils/                     chordUtils.js, transpose.js, validation.js
│   │   └── api/                       Client-side wrapper for Netlify Functions
│   ├── netlify/functions/
│   │   ├── save-tune.js               POST update to a tune
│   │   ├── create-tune.js             POST new tune
│   │   └── auth-check.js              Validate editor password
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docs/
│   ├── spec.md                        This document
│   ├── instructions.md                (existing)
│   └── archive/
│       ├── jazz-db-manager-specification.md   Old v1 spec (Nov 2025)
│       └── AUDIT_REPORT_It_Could_Happen_to_You.md
├── netlify.toml                       Top-level Netlify config
└── README.md
```

## 5. Data model

### 5.1 Canonical file format

`data/jazz-tunes.json` is a JSON array of tune objects. (Note: this is the array format from `jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json`, NOT the `{metadata, tunes:[]}` wrapper from `jazzpracticepro/docs/jazz-tunes-jpp.json`. The migration normalises to the array format.)

### 5.2 Tune schema

```json
{
  "id": "mewjccgw3gewozxug8s",
  "tune_name": "There Will Never Be Another You",
  "composer": "Harry Warren",
  "lyricist": "Mack Gordon",
  "year": 1942,
  "style": "swing",
  "rank": 5,
  "standard_key": "Eb major",
  "form": "ABAC, 32 bars (8-8-8-8). Overall in Eb major...",
  "history_and_facts": "Written by Harry Warren with lyrics by Mack Gordon...",
  "famous_recordings": [
    "Chet Baker - 1954",
    "Nat King Cole – 1955",
    "Stan Getz - 1956"
  ],
  "chords": "| Ebmaj7 | Ebmaj7 | Dm7b5 | G7b9 |\n| Cm7 | Cm7 | Bbm7 | Eb7 |\n...",
  "section_markers": [
    { "label": "A", "start": 1, "end": 8 },
    { "label": "B", "start": 9, "end": 16 },
    { "label": "A", "start": 17, "end": 24 },
    { "label": "C", "start": 25, "end": 32 }
  ],
  "youtube_video_ids": [
    {
      "id": "ytHMBYLwgVU",
      "title": "There Will Never Be Another You (Vocal Version)",
      "channelTitle": "Chet Baker - Topic",
      "verified": true,
      "added_date": "2025-11-16"
    }
  ],
  "youtube_backing_track_ids": [...],
  "spotify_playlist_id": "2wMhfMkGGJcGaCMq0IoXP2",
  "chord_progression_notes": "...",
  "is_approved": true,
  "is_archived": false,
  "last_updated": "2025-11-16T07:05:25.445Z"
}
```

### 5.3 Field requirements

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | string | Immutable once set; preserved format from existing data |
| `tune_name` | yes | string | |
| `composer` | yes | string | |
| `lyricist` | no | string | |
| `year` | no | integer | |
| `style` | no | string | Free text; common values: swing, bossa, ballad, latin, bebop |
| `rank` | no | integer | Popularity ranking, lower = more popular |
| `standard_key` | no | string | e.g. "Eb major", "Bb minor" |
| `form` | no | string | Prose description of musical form |
| `history_and_facts` | no | string | Multi-paragraph prose |
| `famous_recordings` | no | string[] | |
| `chords` | no | string | Pipe-delimited measures, `\n` between rows |
| `section_markers` | no | `{label, start, end}[]` | |
| `youtube_video_ids` | no | `{id, title, channelTitle, verified, added_date}[]` | Performances |
| `youtube_backing_track_ids` | no | same shape | Backing tracks |
| `spotify_playlist_id` | no | string | |
| `chord_progression_notes` | no | string | |
| `is_approved` | yes | boolean | Default false |
| `is_archived` | yes | boolean | Default false; soft-delete flag |
| `last_updated` | yes | ISO datetime | Server-set on every save |

### 5.4 Coverage targets (existing dataset)

From the 525-tune dataset, current field population (informational, not a v1 deliverable):
- 100%: tune_name, composer, famous_recordings, rank
- 99%: style, history_and_facts, chords, is_approved
- 95%: year
- 75%: form
- 69%: standard_key
- 7%: youtube_video_ids — **biggest curation gap**, primary editor use case
- 6%: youtube_backing_track_ids, last_updated, verified

## 6. Reader UX

### 6.1 Layout

**Mobile (< 768px):** List screen → tap tune → full-screen detail with back button.

**Laptop (≥ 768px):** Master-detail. List on left (~30%), detail on right (~70%). Selecting a list item updates the right pane.

### 6.2 List view

Each row shows: **tune_name** (bold), **composer** (muted subtitle), three chips: rank, standard_key, style.

Controls at top of list:
- Live search input (real-time filter on `tune_name` + `composer`)
- Sort dropdown: Rank (default) / Name / Composer / Year
- Filter sheet (slide-up on mobile, sidebar on laptop): style, key, has-YouTube, has-chords, approved-only

Archived tunes (`is_archived: true`) are hidden from the reader entirely (no toggle to show them — that lives in the editor).

### 6.3 Tune detail — 3 tabs

Tabs modelled on the JPP `RepertoireDetailPage` component. Each tab renders **only if its content exists** (a tune with no chords doesn't get a Chords tab).

**Overview tab**
- Hero header: tune name (large), composer + lyricist below
- 2×2 grid (mobile) / 1×4 row (laptop) of stat cards: Style · Standard Key · Year · Rank
- History & Facts (prose, renders `\n` as paragraph breaks)

**Listen tab** (hidden if no recordings, no YouTube, no Spotify)
- Famous Recordings: bullet list (`"Chet Baker — 1954"` style)
- Spotify playlist button (green gradient, opens `open.spotify.com/playlist/<id>`)
- YouTube Performances button — aggregates `youtube_video_ids` into one URL: `youtube.com/watch_videos?video_ids=id1,id2,...` (one tap → playlist plays in YouTube app)
- YouTube Backing Tracks button (same pattern, darker gradient, play icon)
- Below buttons: optional thumbnail strip showing first 3-5 videos (tap to jump to that one)

**Chords tab** (hidden if no `chords` data)
- "Form & Structure" header: `form` text + section-marker pill badges (`A: 1-8`, `B: 9-16`)
- Transposition toggle: **Concert · Bb · Eb** (drop the F from JPP — Trent plays sax)
- `<ChordChart>`: 4-column responsive grid parsing pipe-delimited chord string; cells monospace, bordered; section labels render above their starting measure
- Optional footer: `chord_progression_notes`

### 6.4 Visual style

Tailwind, calm content-first design, no chrome. Section-marker pill badges in a brand accent colour. Generous whitespace. Section dividers between cards. Safe-area padding on iOS.

## 7. Editor UX

### 7.1 Mode split

Same `/edit` route, two views auto-chosen by viewport. Share state, data fetching, validation, save pipeline.

### 7.2 Laptop mode (≥ 768px) — existing rich editor, migrated

The current `jazz-db-app/` editor stays largely as-is. Only the persistence layer changes:

| Before (current) | After (v1) |
|---|---|
| localStorage auto-save | Debounced (2s) POST to `/.netlify/functions/save-tune` |
| `jazz-database` localStorage key holds whole file | Client holds tune state; sends only changed fields per save |
| Manual import/export of JSON | Initial load: GET from `raw.githubusercontent.com`; saves: POST through Netlify Function |
| Column widths, UI prefs in localStorage | Stay in localStorage (these are per-device prefs) |

All existing rich-editor features stay: table view, split-pane with live preview, drag-drop YouTube curator, chord-progression editor, section-marker builder, validation dashboard, transposition preview.

### 7.3 Mobile mode (< 768px) — lightweight form

From any tune in the reader, an Edit pencil icon takes you to the mobile editor for that tune.

The mobile editor is a vertical scroll of sections matching the reader tabs. Sticky Save button at top.

**Mobile supports:**
- Paste YouTube URL → auto-fetch title + channel → one-tap add as Performance or Backing Track (the marquee mobile flow)
- Add a famous recording (single-line input)
- Fix any text field (composer, history, lyricist, etc.)
- Edit standard_key (dropdown of common keys)
- Toggle is_approved
- Edit chord progression as **raw pipe-delimited text** (textarea — no visual grid editor on phone)
- Set style, year, rank

**Mobile defers to laptop** (shows a friendly *"Open this on your laptop for full editing"* message):
- Section marker builder
- Drag-drop reordering of YouTube videos or recordings
- Bulk operations
- Validation dashboard
- Visual chord grid editing

### 7.4 YouTube paste flow (mobile)

The most common mobile edit — deserves a polished UX:

1. Tap **+ Paste YouTube URL** in the Listen section
2. iOS keyboard opens; paste from clipboard
3. App parses video ID from any YouTube URL format (`youtu.be/X`, `youtube.com/watch?v=X`, `youtube.com/shorts/X`)
4. App calls YouTube Data API v3 (`VITE_YOUTUBE_API_KEY` env var) for title + channelTitle
5. Modal shows: thumbnail + auto-filled title + channel + radio: **Performance** or **Backing Track**
6. Tap Add → debounced save fires → modal dismisses
7. Target: under 3 seconds end-to-end, one paste + one tap

### 7.5 Add / delete tunes

**Add:** POST `/.netlify/functions/create-tune` with minimal fields (`tune_name`, `composer`). Function generates an ID matching existing format (lowercase alphanumeric, ~20 chars), sets `is_approved: false`, inserts into array, commits with message `"Add tune: <name>"`.

**Delete:** Soft delete only — sets `is_archived: true`. Reader and editor filter archived tunes by default. The editor has a "show archived" toggle to surface them. Nothing is ever truly deleted; restoration is a single field flip.

## 8. Save pipeline

### 8.1 Netlify Function: `save-tune`

```
POST /.netlify/functions/save-tune
Headers:
  Authorization: Bearer <password-or-jwt>
  Content-Type: application/json
Body:
  {
    tune_id: "mewjccgw3gewozxug8s",
    updated_fields: { youtube_video_ids: [...], last_updated: "..." },
    expected_sha: "abc123..."   // SHA of the file the client loaded
  }

Function logic:
  1. Validate Authorization header against EDITOR_PASSWORD env var
  2. GET current file: github.com/repos/{repo}/contents/{path}
     → returns { content (base64), sha }
  3. If expected_sha mismatches latest sha:
       try field-level merge (no overlap → safe; overlap → 409)
  4. Decode + parse JSON, locate tune by id, merge updated_fields
  5. Set tune.last_updated = now()
  6. Validate schema (required fields, types, no unknown fields)
  7. Encode + base64, PUT to GitHub Contents API with:
       commit message: "Update <tune_name>: <field summary>"
       branch: main
       sha: <latest sha>
  8. On 409 from GitHub: one auto-retry from step 2
  9. Return { sha: <new sha>, tune: <updated tune> }
```

### 8.2 Netlify Function: `create-tune`

Similar to `save-tune` but appends to the array and generates a new ID. Returns the new tune.

### 8.3 Netlify Function: `auth-check`

POST with a password in body. Returns 200 + a short-lived signed token, or 401. Client stores the token in localStorage and includes it in subsequent save calls. Token validation logic lives in `save-tune` and `create-tune` (shared helper).

For v1, token can be a simple HMAC over a 7-day expiry timestamp — no need for full JWT.

### 8.4 Validation rules (server-side)

| Rule | Enforcement |
|---|---|
| Required fields present | reject with 400 if missing |
| `id` immutable | reject any payload trying to change `id` |
| Types match schema | reject with 400 if wrong |
| Unknown fields | strip + log warning (don't reject — forward-compat) |
| `last_updated` server-set | overwrite any client-provided value |
| Soft-delete only | `is_archived` is the only delete mechanism; no DELETE endpoint |

## 9. Auth model

**Reader:** Public, no auth.

**Editor:** Single shared password (`EDITOR_PASSWORD` env var in Netlify).

Flow:
1. User visits `/edit`
2. If no valid token in localStorage → password prompt
3. POST password to `/.netlify/functions/auth-check`
4. On success, store token in localStorage (7-day TTL)
5. Every save includes `Authorization: Bearer <token>` header
6. Token expiry triggers re-prompt

This is "password gate, not enterprise auth". Acceptable for personal-use solo app. Upgrade path: Netlify Identity, magic link, or Cloudflare Access if ever needed.

## 10. Deployment

### 10.1 Netlify configuration

`netlify.toml` at repo root:

```toml
[build]
  base = "app"
  command = "npm install && npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 10.2 Environment variables (Netlify dashboard)

| Variable | Purpose | Source |
|---|---|---|
| `GITHUB_TOKEN` | Fine-grained PAT, `Contents: read+write` scope, repo-limited | Generated in GitHub Settings → Developer settings → PATs |
| `GITHUB_REPO` | `beeches-anode/jazz-tune-manager` (or post-rename) | Manual |
| `DATA_PATH` | `data/jazz-tunes.json` | Manual |
| `EDITOR_PASSWORD` | Shared password for `/edit` | User-chosen |
| `EDITOR_TOKEN_SECRET` | HMAC secret for editor session tokens | Random 32-byte hex |
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key for video metadata | Already in existing `.env` |

`VITE_` prefix exposes the key to the client bundle (acceptable for YouTube API — rate-limit-only, no auth implications).

### 10.3 URL

v1: free Netlify subdomain (e.g. `trents-jazz-tunes.netlify.app`). Custom domain (`tunes.jordancorner.com`) is a possible v1.1 enhancement; not needed for v1.

### 10.4 CI

GitHub → Netlify auto-deploy on push to `main`. Each editor save commits to `main`, but rebuilds are not on the critical path for save visibility — the app fetches data at runtime from `raw.githubusercontent.com`, so saves are visible to other devices within ~5 seconds without a redeploy.

## 11. Claude Code integration

Claude reads/edits the file directly on the laptop. No MCP server in v1.

**Workflow rule:** Always `git pull` before editing. Claude's edit pipeline:

```
1. cd /Users/trentjordan/code_projects/jazz-tune-db
2. git pull --rebase
3. Read data/jazz-tunes.json (or grep for the tune)
4. Edit/append the tune entry
5. git add data/jazz-tunes.json
6. git commit -m "Update <tune_name>: <change summary>"
7. git push
```

Conflict story: if mobile/laptop browser editing wins between Claude's pull and push, Claude's push fails non-fast-forward, pulls --rebase, retries. Standard git.

## 12. Migration plan

### 12.1 Build sequence

Reader and editor build together, but internally sequenced to derisk:

| Step | Work | Time |
|---|---|---|
| 1 | Repo rename + folder restructure; move JSON to `data/`; archive old spec/audit docs | 30 min |
| 2 | New Vite app shell in `app/` with React Router + Tailwind + base layout | 1 hr |
| 3 | Data fetch hook: GET from `raw.githubusercontent.com` with SHA tracking + localStorage cache | 1 hr |
| 4 | Reader UI: list view, search/filter, 3-tab detail, chord chart renderer with transposition, YouTube playlist URL builder, section-marker pill badges (mobile-first) | 4–6 hrs |
| 5 | Deploy reader to Netlify; env vars set; **first viewable milestone — mobile-ready** | 30 min |
| 6 | Port existing `jazz-db-app/src/` into `app/src/routes/Editor/`; strip localStorage; add password gate | 3–4 hrs |
| 7 | Netlify Function `save-tune`: GitHub Contents API, schema validation, retry logic | 2 hrs |
| 8 | Wire editor saves to function; replace localStorage; add save status indicator | 1 hr |
| 9 | Mobile editor view: lightweight form + YouTube paste flow + soft-delete UI | 3–4 hrs |
| 10 | Polish: empty states, error messages, responsive tweaks, README | 2 hrs |
| **Total** | | **~18–25 hrs** |

### 12.2 Decommissioning

After v1 ships and is stable for ~2 weeks:
- Archive the old `jazz-tune-editor/` PWA inside JPP (it stays in the JPP repo as historical reference; no action needed)
- Confirm Atlas references to JPP tune data are updated if relevant (likely none — Atlas tracks practice sessions, not tune definitions)

## 13. Open questions and future work (v1.1+)

| Item | When to revisit |
|---|---|
| Custom domain (`tunes.jordancorner.com`) | After v1 ships and is in active use |
| MCP server for Claude Code (semantic tools like `find_tunes_by_key`) | If file-edit workflow feels clunky for repeat operations |
| Curation pass to fill YouTube IDs across all 525 tunes | Separate batch project, possibly NotebookLM-assisted |
| Magic-link auth instead of shared password | If password-on-each-device becomes annoying |
| Practice tracking integration (link tune detail to Atlas `jpp-data.json`) | If/when useful |
| Export to printable lead sheets (PDF) | User demand |
| Tempo and time signature fields | Schema extension when needed |

## 14. Success criteria for v1

The build is done when:

- [ ] Reader loads on mobile and laptop, displays all 525 tunes
- [ ] Tune detail shows 3-tab UI (Overview / Listen / Chords) with conditional rendering
- [ ] Chord chart renders correctly with Concert/Bb/Eb transposition
- [ ] YouTube playlist buttons open aggregated playlists in YouTube app
- [ ] Editor on laptop performs all operations the existing `jazz-db-app/` does, but saves persist to GitHub
- [ ] Editor on mobile supports paste-URL YouTube add, text edits, approval toggle
- [ ] Edits made on mobile show up on laptop within 10 seconds of refresh, and vice versa
- [ ] Claude Code can read, add, and edit tunes via local file operations
- [ ] Soft delete works; archived tunes hidden from reader; restorable from editor
- [ ] Single password gates `/edit`; no other auth needed
