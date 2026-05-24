# Jazz Tune Database — v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Netlify-hosted personal web app that lets Trent browse 525+ jazz tunes from anywhere (public reader), edit them from anywhere (password-gated editor with mobile-light + laptop-rich modes), and manipulate the canonical JSON file directly via Claude Code.

**Architecture:** Single Vite/React app with React Router. Two routes: `/` (public reader, mobile-first) and `/edit` (password-gated editor, viewport-adaptive). The GitHub repo is the canonical data store — no separate database. The app fetches data at runtime from `raw.githubusercontent.com` (CDN-cached, ~5s freshness). Edits POST to Netlify Functions which commit to GitHub via the Contents API.

**Tech Stack:** Vite 7, React 19, React Router 7, Tailwind CSS 3, React Hook Form 7, React Player 3, @hello-pangea/dnd 18, Netlify Functions (Node 20), GitHub Contents API v3, YouTube Data API v3.

**Spec:** See `docs/spec.md` in this repo for the full design. This plan implements it.

**Pre-conditions:** This plan assumes the repo has already been renamed `jazz-tune-manager` → `jazz-tune-db` on GitHub, and locally moved to `/Users/trentjordan/code_projects/jazz-tune-db`. If not yet renamed, do so first (see Pre-flight below).

---

## Pre-flight checklist

Complete these before starting Task 1. Each takes 2–5 minutes.

### P1. Rename the repo (if not done)

- [ ] Rename on GitHub: github.com/beeches-anode/jazz-tune-manager → Settings → rename to `jazz-tune-db`
- [ ] Local rename:
  ```bash
  cd /Users/trentjordan/code_projects
  mv jazz-tune-manager jazz-tune-db
  cd jazz-tune-db
  git remote set-url origin git@github.com:beeches-anode/jazz-tune-db.git
  git fetch origin
  ```

### P2. Generate a GitHub fine-grained PAT

- [ ] github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new
- [ ] Token name: `jazz-tune-db editor`
- [ ] Resource owner: `beeches-anode`
- [ ] Repository access: select `beeches-anode/jazz-tune-db` only
- [ ] Permissions:
  - Contents: **Read and write**
  - Metadata: **Read** (auto-required)
- [ ] Expiration: 90 days (set a calendar reminder to rotate)
- [ ] Copy the token; save in 1Password as `jazz-tune-db GitHub PAT`

### P3. Decide editor password and generate token secret

- [ ] Choose an editor password (passphrase, save in 1Password as `jazz-tune-db editor password`)
- [ ] Generate a 32-byte hex secret for HMAC token signing:
  ```bash
  openssl rand -hex 32
  ```
- [ ] Save secret in 1Password as `jazz-tune-db editor token secret`

### P4. Confirm YouTube API key is available

- [ ] Verify `jazz-db-app/.env` contains `VITE_YOUTUBE_API_KEY` (from existing editor)
- [ ] Copy the value; save in 1Password as `jazz-tune-db YouTube API key`

### P5. Create a Netlify site (deferred to Phase 4 — do not do yet)

This will happen during Phase 4 after the reader is buildable. Listed here so you know it's coming.

---

## File structure

The final layout after all phases:

```
jazz-tune-db/
├── CLAUDE.md                          NEW — project instructions for Claude Code
├── README.md                          NEW — quick start, deploy guide
├── netlify.toml                       NEW — Netlify config (base = app/)
├── .gitignore                         from existing repo + Vite additions
├── data/
│   └── jazz-tunes.json                MOVED from jazz-db-app/jazz-tunes-jpp.json
├── docs/
│   ├── spec.md                        EXISTS
│   ├── plan.md                        EXISTS (this document)
│   └── archive/
│       ├── jazz-db-manager-specification.md     MOVED from repo root
│       └── AUDIT_REPORT_It_Could_Happen_to_You.md   MOVED from repo root
├── app/                               NEW — the unified Vite app
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   ├── netlify/
│   │   └── functions/
│   │       ├── save-tune.js           POST update to a tune
│   │       ├── create-tune.js         POST new tune
│   │       ├── auth-check.js          Verify editor password, mint token
│   │       └── _shared/
│   │           ├── github.js          GitHub Contents API client
│   │           ├── auth.js            HMAC token sign/verify
│   │           └── validation.js      Server-side tune schema validation
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                    Router root
│       ├── index.css                  Tailwind directives
│       ├── routes/
│       │   ├── ReaderHome.jsx         Reader: list + detail layout
│       │   ├── ReaderDetail.jsx       Reader: tune detail (3 tabs)
│       │   ├── EditorHome.jsx         Editor: list + dispatcher
│       │   ├── EditorLaptop.jsx       Editor: laptop rich (port of existing)
│       │   └── EditorMobile.jsx       Editor: mobile lightweight form
│       ├── components/
│       │   ├── TuneList.jsx           Sortable/filterable list
│       │   ├── TuneCard.jsx           One row in the list
│       │   ├── SearchBar.jsx
│       │   ├── FilterSheet.jsx        Slide-up filter on mobile
│       │   ├── TabStrip.jsx           3-tab UI (Overview/Listen/Chords)
│       │   ├── OverviewTab.jsx
│       │   ├── ListenTab.jsx
│       │   ├── ChordsTab.jsx
│       │   ├── ChordChart.jsx         Pipe-delimited → 4-col grid
│       │   ├── SectionMarkerBadges.jsx
│       │   ├── YouTubePlaylistButton.jsx   Aggregated watch_videos URL
│       │   ├── AuthGate.jsx           Password prompt + token storage
│       │   ├── PasteYouTubeModal.jsx  Mobile editor: paste-URL flow
│       │   └── SaveIndicator.jsx      "Saved" / "Saving..." status pill
│       ├── hooks/
│       │   ├── useTunes.js            Fetch from GitHub raw + cache
│       │   ├── useTune.js             Select one tune by id
│       │   ├── useSaveTune.js         POST to save-tune function
│       │   ├── useCreateTune.js       POST to create-tune function
│       │   ├── useAuth.js             Token state + auth-check call
│       │   ├── useViewport.js         Mobile vs laptop detection (md breakpoint)
│       │   └── useYouTubeMetadata.js  Fetch title + channel for a video ID
│       ├── utils/
│       │   ├── chordUtils.js          Parse pipe-delimited; transpose
│       │   ├── youtubeUrl.js          Parse video ID from any URL; build playlist
│       │   ├── tuneFilters.js         Search/sort/filter pure functions
│       │   └── schema.js              Client-side schema (mirror of server)
│       ├── api/
│       │   └── client.js              Wrapper for /.netlify/functions/* calls
│       └── styles/
│           └── brand.css              CSS vars: brand colors, gradients
└── tests/                             Vitest unit tests, mirroring src/
    └── ...
```

---

## Phase 1 — Repo prep and Vite scaffold

### Task 1: Restructure repo folders

**Files:**
- Create: `data/jazz-tunes.json` (copy from `jazz-db-app/jazz-tunes-jpp.json`)
- Create: `docs/archive/`
- Move: `jazz-db-manager-specification.md` → `docs/archive/jazz-db-manager-specification.md`
- Move: `AUDIT_REPORT_It_Could_Happen_to_You.md` → `docs/archive/AUDIT_REPORT_It_Could_Happen_to_You.md`

The existing `jazz-db-app/` stays in place for now — we'll port files from it in Phase 5. Delete it only at the end of Phase 9.

- [ ] **Step 1: Verify clean working tree**

  Run:
  ```bash
  git status
  ```

  Expected: only the spec and plan in `docs/` show as modified or new (if you committed them earlier, status is clean).

- [ ] **Step 2: Create new directories and move files**

  Run:
  ```bash
  mkdir -p data docs/archive
  cp jazz-db-app/jazz-tunes-jpp.json data/jazz-tunes.json
  git mv jazz-db-manager-specification.md docs/archive/jazz-db-manager-specification.md
  git mv AUDIT_REPORT_It_Could_Happen_to_You.md docs/archive/AUDIT_REPORT_It_Could_Happen_to_You.md 2>/dev/null || mv AUDIT_REPORT_It_Could_Happen_to_You.md docs/archive/
  ```

- [ ] **Step 3: Verify the JSON file is the array format**

  Run:
  ```bash
  python3 -c "import json; d=json.load(open('data/jazz-tunes.json')); print(type(d).__name__, len(d))"
  ```

  Expected: `list 525` (or similar count — anything over 500 confirms it's the array form, not a `{metadata, tunes:[]}` wrapper). If it's a dict, fail this task and ask the user.

- [ ] **Step 4: Commit**

  ```bash
  git add data/jazz-tunes.json docs/archive/
  git commit -m "chore: restructure repo — canonical data to data/, archive prior specs"
  ```

---

### Task 2: Add CLAUDE.md for project-scoped instructions

**Files:**
- Create: `CLAUDE.md`

The fresh session executing this plan needs project context. This file is loaded when Claude Code starts in this repo.

- [ ] **Step 1: Write CLAUDE.md**

  Create `/Users/trentjordan/code_projects/jazz-tune-db/CLAUDE.md`:

  ```markdown
  # Jazz Tune Database

  Personal web app for browsing and editing 525+ jazz tunes. Hosted on Netlify, data stored as JSON in this repo.

  ## Critical rules

  1. **Canonical data file:** `data/jazz-tunes.json`. Never duplicate it elsewhere in the repo.
  2. **Always `git pull --rebase` before editing the JSON** — the web app may have committed since your last pull.
  3. **One tune per edit operation** when possible — easier to write meaningful commit messages and review history.
  4. **Schema lock:** see `app/src/utils/schema.js` for the canonical tune shape. Don't add fields without updating the schema.
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add CLAUDE.md
  git commit -m "docs: add project-scoped CLAUDE.md"
  ```

---

### Task 3: Scaffold the Vite app

**Files:**
- Create: `app/package.json`
- Create: `app/vite.config.js`
- Create: `app/tailwind.config.js`
- Create: `app/postcss.config.js`
- Create: `app/eslint.config.js`
- Create: `app/index.html`
- Create: `app/src/main.jsx`
- Create: `app/src/index.css`
- Create: `app/src/App.jsx`

Mirror the existing `jazz-db-app/` setup since it works and uses the same versions. Don't run `npm create vite` — manually create the files so we have exact control.

- [ ] **Step 1: Create app directory and copy configs from existing app**

  ```bash
  mkdir -p app/src app/public
  cp jazz-db-app/vite.config.js app/vite.config.js
  cp jazz-db-app/tailwind.config.js app/tailwind.config.js
  cp jazz-db-app/postcss.config.js app/postcss.config.js
  cp jazz-db-app/eslint.config.js app/eslint.config.js
  cp jazz-db-app/index.html app/index.html
  ```

- [ ] **Step 2: Write app/package.json**

  Create `app/package.json`:

  ```json
  {
    "name": "jazz-tune-db",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "lint": "eslint .",
      "preview": "vite preview",
      "test": "vitest run",
      "test:watch": "vitest"
    },
    "dependencies": {
      "@hello-pangea/dnd": "^18.0.1",
      "react": "^19.2.0",
      "react-dom": "^19.2.0",
      "react-hook-form": "^7.66.0",
      "react-player": "^3.4.0",
      "react-router-dom": "^7.9.6"
    },
    "devDependencies": {
      "@eslint/js": "^9.39.1",
      "@testing-library/jest-dom": "^6.6.3",
      "@testing-library/react": "^16.1.0",
      "@testing-library/user-event": "^14.5.2",
      "@types/react": "^19.2.2",
      "@types/react-dom": "^19.2.2",
      "@vitejs/plugin-react": "^5.1.0",
      "autoprefixer": "^10.4.22",
      "eslint": "^9.39.1",
      "eslint-plugin-react-hooks": "^7.0.1",
      "eslint-plugin-react-refresh": "^0.4.24",
      "globals": "^16.5.0",
      "jsdom": "^25.0.1",
      "postcss": "^8.5.6",
      "tailwindcss": "^3.4.18",
      "vite": "^7.2.2",
      "vitest": "^2.1.8"
    }
  }
  ```

- [ ] **Step 3: Write app/src/main.jsx**

  ```jsx
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { BrowserRouter } from 'react-router-dom';
  import App from './App';
  import './index.css';

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
  ```

- [ ] **Step 4: Write app/src/index.css**

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  :root {
    --brand: #0ea5e9;
    --brand-dark: #0284c7;
    --bg: #fafafa;
    --surface: #ffffff;
    --text: #18181b;
    --text-muted: #71717a;
    --border: #e4e4e7;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  ```

- [ ] **Step 5: Write app/src/App.jsx**

  ```jsx
  import { Routes, Route } from 'react-router-dom';

  export default function App() {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<div className="p-8">Reader placeholder — Phase 3 will fill this in.</div>} />
          <Route path="/edit/*" element={<div className="p-8">Editor placeholder — Phase 5 will fill this in.</div>} />
        </Routes>
      </div>
    );
  }
  ```

- [ ] **Step 6: Update app/index.html**

  Edit `app/index.html` to set the title:

  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <title>Trent's Jazz Tune Database</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.jsx"></script>
    </body>
  </html>
  ```

- [ ] **Step 7: Install dependencies**

  ```bash
  cd app && npm install
  ```

  Expected: ~250 packages installed, no errors. Allow a few peer-dep warnings.

- [ ] **Step 8: Start dev server and verify it loads**

  ```bash
  cd app && npm run dev
  ```

  Open `http://localhost:5173`. Expected: "Reader placeholder" text shown. Visit `http://localhost:5173/edit` — expected: "Editor placeholder". Stop the server (Ctrl-C).

- [ ] **Step 9: Configure vitest**

  Edit `app/vite.config.js` to add a `test` block:

  ```js
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.js'],
    },
  });
  ```

  Create `app/src/test-setup.js`:

  ```js
  import '@testing-library/jest-dom';
  ```

- [ ] **Step 10: Verify tests run (no tests yet, but framework works)**

  ```bash
  cd app && npm test
  ```

  Expected: vitest reports "No tests found" — that's fine.

- [ ] **Step 11: Commit**

  ```bash
  git add app/ .gitignore
  git commit -m "feat: scaffold Vite/React app with router, Tailwind, Vitest"
  ```

  If `.gitignore` doesn't yet exclude `app/node_modules/`, `app/dist/`, and `app/.netlify/`, add them now and amend the commit.

---

## Phase 2 — Data layer

### Task 4: `utils/youtubeUrl.js` — parse video IDs and build playlist URLs

**Files:**
- Create: `app/src/utils/youtubeUrl.js`
- Test: `app/src/utils/youtubeUrl.test.js`

Pure functions, easy to TDD.

- [ ] **Step 1: Write the failing test**

  Create `app/src/utils/youtubeUrl.test.js`:

  ```js
  import { describe, it, expect } from 'vitest';
  import { parseVideoId, buildPlaylistUrl } from './youtubeUrl';

  describe('parseVideoId', () => {
    it('extracts id from youtu.be short URL', () => {
      expect(parseVideoId('https://youtu.be/ytHMBYLwgVU')).toBe('ytHMBYLwgVU');
    });
    it('extracts id from youtube.com watch URL', () => {
      expect(parseVideoId('https://www.youtube.com/watch?v=ytHMBYLwgVU')).toBe('ytHMBYLwgVU');
    });
    it('extracts id from youtube.com watch URL with extra params', () => {
      expect(parseVideoId('https://www.youtube.com/watch?v=ytHMBYLwgVU&t=42s')).toBe('ytHMBYLwgVU');
    });
    it('extracts id from shorts URL', () => {
      expect(parseVideoId('https://www.youtube.com/shorts/ytHMBYLwgVU')).toBe('ytHMBYLwgVU');
    });
    it('returns null for non-YouTube URL', () => {
      expect(parseVideoId('https://example.com/watch?v=ytHMBYLwgVU')).toBe(null);
    });
    it('returns null for garbage input', () => {
      expect(parseVideoId('not a url')).toBe(null);
    });
  });

  describe('buildPlaylistUrl', () => {
    it('builds watch_videos URL from id array', () => {
      const url = buildPlaylistUrl(['id1', 'id2', 'id3']);
      expect(url).toBe('https://www.youtube.com/watch_videos?video_ids=id1,id2,id3');
    });
    it('handles single video', () => {
      expect(buildPlaylistUrl(['id1'])).toBe('https://www.youtube.com/watch_videos?video_ids=id1');
    });
    it('returns null for empty array', () => {
      expect(buildPlaylistUrl([])).toBe(null);
    });
  });
  ```

- [ ] **Step 2: Run test — verify it fails**

  ```bash
  cd app && npm test -- youtubeUrl
  ```

  Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement**

  Create `app/src/utils/youtubeUrl.js`:

  ```js
  const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

  export function parseVideoId(input) {
    if (typeof input !== 'string') return null;
    let url;
    try {
      url = new URL(input);
    } catch {
      return null;
    }
    if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      return /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.slice('/shorts/'.length);
      return /^[\w-]{6,}$/.test(id) ? id : null;
    }
    const id = url.searchParams.get('v');
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }

  export function buildPlaylistUrl(videoIds) {
    if (!Array.isArray(videoIds) || videoIds.length === 0) return null;
    return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
  }
  ```

- [ ] **Step 4: Run test — verify it passes**

  ```bash
  cd app && npm test -- youtubeUrl
  ```

  Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

  ```bash
  git add app/src/utils/youtubeUrl.js app/src/utils/youtubeUrl.test.js
  git commit -m "feat(utils): YouTube URL parsing and playlist URL building"
  ```

---

### Task 5: `utils/chordUtils.js` — parse and transpose chord progressions

**Files:**
- Create: `app/src/utils/chordUtils.js`
- Test: `app/src/utils/chordUtils.test.js`

The `chords` field is a string like `"| Ebmaj7 | Ebmaj7 | Dm7b5 | G7b9 |\n| Cm7 | Cm7 | Bbm7 | Eb7 |"`. We need to parse it into a 2-D grid of measures, and transpose by a semitone offset.

Note: existing `jazz-db-app/src/utils/chordUtils.js` (~60 lines) is a starting reference. Port its logic but write fresh tests.

- [ ] **Step 1: Read the reference implementation**

  ```bash
  cat jazz-db-app/src/utils/chordUtils.js
  ```

  Note the existing functions: probably `parseChords`, `transposeChord`. Adapt for our schema.

- [ ] **Step 2: Write the failing test**

  Create `app/src/utils/chordUtils.test.js`:

  ```js
  import { describe, it, expect } from 'vitest';
  import { parseChords, transposeProgression } from './chordUtils';

  describe('parseChords', () => {
    it('parses a single line', () => {
      const result = parseChords('| Cmaj7 | Dm7 | G7 | Cmaj7 |');
      expect(result).toEqual([['Cmaj7', 'Dm7', 'G7', 'Cmaj7']]);
    });
    it('parses multiple lines', () => {
      const result = parseChords('| Cmaj7 | Dm7 |\n| G7 | Cmaj7 |');
      expect(result).toEqual([
        ['Cmaj7', 'Dm7'],
        ['G7', 'Cmaj7'],
      ]);
    });
    it('handles compound measures (two chords in one bar)', () => {
      const result = parseChords('| Am7 D7 | Gmaj7 |');
      expect(result).toEqual([['Am7 D7', 'Gmaj7']]);
    });
    it('returns empty array for empty input', () => {
      expect(parseChords('')).toEqual([]);
      expect(parseChords(null)).toEqual([]);
    });
  });

  describe('transposeProgression', () => {
    it('transposes Concert to Bb (down a major 2nd)', () => {
      const result = transposeProgression('| Cmaj7 | F7 |', 'Bb');
      expect(result).toBe('| Dmaj7 | G7 |');
    });
    it('transposes Concert to Eb (down a major 6th, equivalent to up a minor 3rd)', () => {
      const result = transposeProgression('| Cmaj7 | F7 |', 'Eb');
      expect(result).toBe('| Amaj7 | D7 |');
    });
    it('returns original when key is Concert', () => {
      expect(transposeProgression('| Cmaj7 | F7 |', 'Concert')).toBe('| Cmaj7 | F7 |');
    });
    it('handles compound measures', () => {
      expect(transposeProgression('| Am7 D7 |', 'Bb')).toBe('| Bm7 E7 |');
    });
    it('preserves chord quality suffixes', () => {
      expect(transposeProgression('| C7b9 |', 'Bb')).toBe('| D7b9 |');
      expect(transposeProgression('| Dm7b5 |', 'Bb')).toBe('| Em7b5 |');
    });
  });
  ```

- [ ] **Step 3: Run test — verify it fails**

  ```bash
  cd app && npm test -- chordUtils
  ```

  Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

  Create `app/src/utils/chordUtils.js`:

  ```js
  const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Transposition: target sounds the same as Concert when played on the instrument.
  // Bb instrument: written pitch = concert + 2 semitones
  // Eb instrument: written pitch = concert + 9 semitones (or -3)
  const TRANSPOSITION_OFFSET = {
    Concert: 0,
    Bb: 2,
    Eb: 9,
  };

  export function parseChords(input) {
    if (typeof input !== 'string' || input.trim() === '') return [];
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split('|').map(s => s.trim()).filter(s => s.length > 0));
  }

  function transposeNote(note, offset) {
    let idx = NOTES_SHARP.indexOf(note);
    let useFlats = false;
    if (idx === -1) {
      idx = NOTES_FLAT.indexOf(note);
      useFlats = true;
    }
    if (idx === -1) return note;
    const newIdx = (idx + offset + 12) % 12;
    return useFlats ? NOTES_FLAT[newIdx] : NOTES_SHARP[newIdx];
  }

  function transposeChord(chord, offset) {
    if (offset === 0) return chord;
    // Match the root note (with optional sharp/flat) at the start
    const m = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!m) return chord;
    const [, root, suffix] = m;
    return transposeNote(root, offset) + suffix;
  }

  function transposeMeasure(measure, offset) {
    // A measure may contain multiple chords separated by spaces
    return measure.split(/\s+/).map(c => transposeChord(c, offset)).join(' ');
  }

  export function transposeProgression(input, targetKey) {
    const offset = TRANSPOSITION_OFFSET[targetKey] ?? 0;
    if (offset === 0) return input;
    return input
      .split('\n')
      .map(line => {
        const parts = line.split('|').map(p => p.trim());
        // Reconstruct line preserving pipe structure
        return parts.map((p, i) => {
          if (i === 0 || i === parts.length - 1) return p;
          return ` ${transposeMeasure(p, offset)} `;
        }).join('|');
      })
      .join('\n');
  }
  ```

- [ ] **Step 5: Run test — verify it passes**

  ```bash
  cd app && npm test -- chordUtils
  ```

  Expected: PASS. If any transposition test fails, the offsets need adjusting — double-check against the test expectations and fix.

- [ ] **Step 6: Commit**

  ```bash
  git add app/src/utils/chordUtils.js app/src/utils/chordUtils.test.js
  git commit -m "feat(utils): chord progression parsing and transposition (Concert/Bb/Eb)"
  ```

---

### Task 6: `hooks/useTunes.js` — fetch JSON from GitHub raw with caching

**Files:**
- Create: `app/src/hooks/useTunes.js`
- Test: `app/src/hooks/useTunes.test.jsx`

This hook fetches `data/jazz-tunes.json` from `raw.githubusercontent.com/beeches-anode/jazz-tune-db/main/data/jazz-tunes.json` on mount. It caches in localStorage with a SHA-aware staleness check (compare cached SHA with `If-None-Match` 304 response).

- [ ] **Step 1: Write the failing test**

  Create `app/src/hooks/useTunes.test.jsx`:

  ```jsx
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { renderHook, waitFor } from '@testing-library/react';
  import { useTunes } from './useTunes';

  describe('useTunes', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.restoreAllMocks();
    });

    it('fetches tunes from GitHub raw URL on mount', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', is_archived: false },
          { id: 't2', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', is_archived: false },
        ]),
        headers: new Headers({ ETag: 'abc123' }),
      });

      const { result } = renderHook(() => useTunes());

      await waitFor(() => expect(result.current.tunes).toHaveLength(2));
      expect(result.current.loading).toBe(false);
      expect(result.current.tunes[0].tune_name).toBe('Stella by Starlight');
    });

    it('filters out archived tunes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          { id: 't1', tune_name: 'Active', is_archived: false },
          { id: 't2', tune_name: 'Archived', is_archived: true },
        ]),
        headers: new Headers({ ETag: 'abc123' }),
      });

      const { result } = renderHook(() => useTunes());

      await waitFor(() => expect(result.current.tunes).toHaveLength(1));
      expect(result.current.tunes[0].tune_name).toBe('Active');
    });

    it('serves from localStorage cache while revalidating', async () => {
      localStorage.setItem('jazz-tunes-cache', JSON.stringify({
        sha: 'old-sha',
        tunes: [{ id: 't1', tune_name: 'Cached', is_archived: false }],
      }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          { id: 't1', tune_name: 'Fresh', is_archived: false },
        ]),
        headers: new Headers({ ETag: 'new-sha' }),
      });

      const { result } = renderHook(() => useTunes());

      // Should immediately show cached data
      expect(result.current.tunes[0].tune_name).toBe('Cached');

      // Then revalidate
      await waitFor(() => expect(result.current.tunes[0].tune_name).toBe('Fresh'));
    });
  });
  ```

- [ ] **Step 2: Run test — verify it fails**

  ```bash
  cd app && npm test -- useTunes
  ```

  Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

  Create `app/src/hooks/useTunes.js`:

  ```js
  import { useState, useEffect, useCallback } from 'react';

  const RAW_URL = 'https://raw.githubusercontent.com/beeches-anode/jazz-tune-db/main/data/jazz-tunes.json';
  const CACHE_KEY = 'jazz-tunes-cache';

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveCache(sha, tunes) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ sha, tunes, savedAt: Date.now() }));
    } catch {
      // localStorage full — ignore
    }
  }

  export function useTunes() {
    const cached = loadCache();
    const [tunes, setTunes] = useState(cached?.tunes ?? []);
    const [sha, setSha] = useState(cached?.sha ?? null);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState(null);

    const refetch = useCallback(async () => {
      try {
        const res = await fetch(RAW_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const newSha = res.headers.get('ETag')?.replace(/"/g, '') ?? null;
        const data = await res.json();
        setTunes(data);
        setSha(newSha);
        saveCache(newSha, data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      refetch();
    }, [refetch]);

    const visibleTunes = tunes.filter(t => !t.is_archived);

    return { tunes: visibleTunes, allTunes: tunes, sha, loading, error, refetch };
  }
  ```

- [ ] **Step 4: Run test — verify it passes**

  ```bash
  cd app && npm test -- useTunes
  ```

  Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

  ```bash
  git add app/src/hooks/useTunes.js app/src/hooks/useTunes.test.jsx
  git commit -m "feat(hooks): useTunes — fetch JSON from GitHub raw with localStorage cache"
  ```

---

### Task 7: `hooks/useViewport.js` — detect mobile vs laptop

**Files:**
- Create: `app/src/hooks/useViewport.js`
- Test: `app/src/hooks/useViewport.test.jsx`

Tailwind's `md` breakpoint is 768px. Return `{ isMobile: boolean }`.

- [ ] **Step 1: Write the failing test**

  Create `app/src/hooks/useViewport.test.jsx`:

  ```jsx
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { renderHook } from '@testing-library/react';
  import { useViewport } from './useViewport';

  describe('useViewport', () => {
    beforeEach(() => {
      // Mock window.matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
    });

    it('returns isMobile=true when viewport < 768px', () => {
      window.matchMedia = vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      const { result } = renderHook(() => useViewport());
      expect(result.current.isMobile).toBe(true);
    });

    it('returns isMobile=false when viewport >= 768px', () => {
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      const { result } = renderHook(() => useViewport());
      expect(result.current.isMobile).toBe(false);
    });
  });
  ```

- [ ] **Step 2: Run test — verify it fails**

  ```bash
  cd app && npm test -- useViewport
  ```

- [ ] **Step 3: Implement**

  Create `app/src/hooks/useViewport.js`:

  ```js
  import { useState, useEffect } from 'react';

  const MOBILE_QUERY = '(max-width: 767px)';

  export function useViewport() {
    const [isMobile, setIsMobile] = useState(() =>
      typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
    );

    useEffect(() => {
      const mql = window.matchMedia(MOBILE_QUERY);
      const handler = (e) => setIsMobile(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }, []);

    return { isMobile };
  }
  ```

- [ ] **Step 4: Run test — verify it passes**

  ```bash
  cd app && npm test -- useViewport
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add app/src/hooks/useViewport.js app/src/hooks/useViewport.test.jsx
  git commit -m "feat(hooks): useViewport — mobile vs laptop breakpoint detection"
  ```

---

## Phase 3 — Reader UI

> From here, each task is a UI component. Tests use @testing-library/react. Render → query → assert.

### Task 8: `components/ChordChart.jsx` — render pipe-delimited chords as a 4-col grid

**Files:**
- Create: `app/src/components/ChordChart.jsx`
- Test: `app/src/components/ChordChart.test.jsx`

Renders a grid of measure cells, with section labels above their start measures.

- [ ] **Step 1: Write the failing test**

  ```jsx
  import { describe, it, expect } from 'vitest';
  import { render, screen } from '@testing-library/react';
  import { ChordChart } from './ChordChart';

  describe('ChordChart', () => {
    it('renders each measure as a cell', () => {
      render(<ChordChart chords="| Cmaj7 | Dm7 | G7 | Cmaj7 |" transposeKey="Concert" sectionMarkers={[]} />);
      expect(screen.getAllByText('Cmaj7')).toHaveLength(2);
      expect(screen.getByText('Dm7')).toBeInTheDocument();
      expect(screen.getAllByText(/maj7/)).toHaveLength(2);
    });

    it('renders section labels above start measures', () => {
      render(
        <ChordChart
          chords={"| Cmaj7 | Dm7 | G7 | Cmaj7 |\n| Em7 | A7 | Dm7 | G7 |"}
          transposeKey="Concert"
          sectionMarkers={[
            { label: 'A', start: 1, end: 4 },
            { label: 'B', start: 5, end: 8 },
          ]}
        />
      );
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('transposes when transposeKey changes', () => {
      const { rerender } = render(
        <ChordChart chords="| Cmaj7 | F7 |" transposeKey="Concert" sectionMarkers={[]} />
      );
      expect(screen.getByText('Cmaj7')).toBeInTheDocument();

      rerender(<ChordChart chords="| Cmaj7 | F7 |" transposeKey="Bb" sectionMarkers={[]} />);
      expect(screen.getByText('Dmaj7')).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run — verify FAIL**

  ```bash
  cd app && npm test -- ChordChart
  ```

- [ ] **Step 3: Implement**

  Create `app/src/components/ChordChart.jsx`:

  ```jsx
  import { parseChords, transposeProgression } from '../utils/chordUtils';

  export function ChordChart({ chords, transposeKey = 'Concert', sectionMarkers = [] }) {
    const transposed = transposeProgression(chords ?? '', transposeKey);
    const grid = parseChords(transposed);
    const markersByMeasure = new Map();
    for (const m of sectionMarkers) {
      markersByMeasure.set(m.start, m.label);
    }

    let measureIdx = 0;
    return (
      <div className="space-y-1">
        {grid.map((line, lineIdx) => {
          // Each line might have a section label above one of its measures
          const lineMarkers = [];
          for (let i = 0; i < line.length; i++) {
            measureIdx++;
            if (markersByMeasure.has(measureIdx)) {
              lineMarkers.push({ col: i, label: markersByMeasure.get(measureIdx) });
            }
          }
          return (
            <div key={lineIdx}>
              {lineMarkers.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-1">
                  {Array.from({ length: 4 }).map((_, col) => {
                    const marker = lineMarkers.find(m => m.col === col);
                    return (
                      <div key={col} className="text-xs font-bold text-sky-700">
                        {marker?.label ?? ''}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {line.map((cell, colIdx) => (
                  <div
                    key={colIdx}
                    className="border border-zinc-300 rounded px-2 py-2 min-h-[2.5rem] sm:min-h-[3rem] font-mono text-sm flex items-center justify-center bg-white"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  ```

- [ ] **Step 4: Run — verify PASS**

  ```bash
  cd app && npm test -- ChordChart
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add app/src/components/ChordChart.jsx app/src/components/ChordChart.test.jsx
  git commit -m "feat(components): ChordChart with transposition and section markers"
  ```

---

### Task 9: `components/TuneList.jsx` and `TuneCard.jsx` — list view with search

**Files:**
- Create: `app/src/components/TuneList.jsx`
- Create: `app/src/components/TuneCard.jsx`
- Test: `app/src/components/TuneList.test.jsx`

The list takes `tunes` (array) and `onSelect` (function). Renders a list with live search input.

- [ ] **Step 1: Write the failing test**

  Create `app/src/components/TuneList.test.jsx`:

  ```jsx
  import { describe, it, expect, vi } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { TuneList } from './TuneList';

  const tunes = [
    { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', rank: 22, standard_key: 'Eb major', style: 'swing' },
    { id: 't2', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', rank: 8, standard_key: 'G minor', style: 'swing' },
    { id: 't3', tune_name: 'Blue Bossa', composer: 'Kenny Dorham', rank: 19, standard_key: 'C minor', style: 'bossa' },
  ];

  describe('TuneList', () => {
    it('renders all tunes', () => {
      render(<TuneList tunes={tunes} onSelect={() => {}} />);
      expect(screen.getByText('Stella by Starlight')).toBeInTheDocument();
      expect(screen.getByText('Autumn Leaves')).toBeInTheDocument();
      expect(screen.getByText('Blue Bossa')).toBeInTheDocument();
    });

    it('filters live as you type in search', () => {
      render(<TuneList tunes={tunes} onSelect={() => {}} />);
      const input = screen.getByPlaceholderText(/search/i);
      fireEvent.change(input, { target: { value: 'autumn' } });
      expect(screen.queryByText('Stella by Starlight')).not.toBeInTheDocument();
      expect(screen.getByText('Autumn Leaves')).toBeInTheDocument();
    });

    it('filters by composer too', () => {
      render(<TuneList tunes={tunes} onSelect={() => {}} />);
      const input = screen.getByPlaceholderText(/search/i);
      fireEvent.change(input, { target: { value: 'dorham' } });
      expect(screen.getByText('Blue Bossa')).toBeInTheDocument();
      expect(screen.queryByText('Autumn Leaves')).not.toBeInTheDocument();
    });

    it('calls onSelect when a card is clicked', () => {
      const onSelect = vi.fn();
      render(<TuneList tunes={tunes} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('Blue Bossa'));
      expect(onSelect).toHaveBeenCalledWith('t3');
    });
  });
  ```

- [ ] **Step 2: Run — verify FAIL**

- [ ] **Step 3: Implement TuneCard**

  Create `app/src/components/TuneCard.jsx`:

  ```jsx
  export function TuneCard({ tune, selected, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-3 border-b border-zinc-200 hover:bg-zinc-50 transition ${
          selected ? 'bg-sky-50' : 'bg-white'
        }`}
      >
        <div className="font-semibold text-zinc-900">{tune.tune_name}</div>
        <div className="text-sm text-zinc-500">{tune.composer}</div>
        <div className="flex gap-2 mt-1">
          {tune.rank && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">#{tune.rank}</span>}
          {tune.standard_key && <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">{tune.standard_key}</span>}
          {tune.style && <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">{tune.style}</span>}
        </div>
      </button>
    );
  }
  ```

- [ ] **Step 4: Implement TuneList**

  Create `app/src/components/TuneList.jsx`:

  ```jsx
  import { useState, useMemo } from 'react';
  import { TuneCard } from './TuneCard';

  export function TuneList({ tunes, selectedId, onSelect }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
      if (!query.trim()) return tunes;
      const q = query.toLowerCase();
      return tunes.filter(t =>
        t.tune_name?.toLowerCase().includes(q) ||
        t.composer?.toLowerCase().includes(q)
      );
    }, [tunes, query]);

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-zinc-200 bg-white sticky top-0">
          <input
            type="search"
            placeholder="Search tunes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded text-base"
          />
          <div className="text-xs text-zinc-500 mt-1">{filtered.length} of {tunes.length}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(tune => (
            <TuneCard
              key={tune.id}
              tune={tune}
              selected={tune.id === selectedId}
              onClick={() => onSelect(tune.id)}
            />
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Run — verify PASS**

  ```bash
  cd app && npm test -- TuneList
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add app/src/components/TuneList.jsx app/src/components/TuneCard.jsx app/src/components/TuneList.test.jsx
  git commit -m "feat(components): TuneList with live search and TuneCard"
  ```

---

### Task 10: `components/OverviewTab.jsx`, `ListenTab.jsx`, `ChordsTab.jsx`, `TabStrip.jsx`

**Files:**
- Create: `app/src/components/TabStrip.jsx`
- Create: `app/src/components/OverviewTab.jsx`
- Create: `app/src/components/ListenTab.jsx`
- Create: `app/src/components/ChordsTab.jsx`
- Create: `app/src/components/SectionMarkerBadges.jsx`
- Create: `app/src/components/YouTubePlaylistButton.jsx`
- Test: `app/src/components/tabs.test.jsx`

Four components, but they form one logical unit (the 3-tab tune detail). Building together for cohesion.

- [ ] **Step 1: Write the failing test for all four**

  Create `app/src/components/tabs.test.jsx`:

  ```jsx
  import { describe, it, expect, vi } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { TabStrip } from './TabStrip';
  import { OverviewTab } from './OverviewTab';
  import { ListenTab } from './ListenTab';
  import { ChordsTab } from './ChordsTab';

  const tune = {
    id: 't1',
    tune_name: 'Stella by Starlight',
    composer: 'Victor Young',
    lyricist: 'Ned Washington',
    year: 1944,
    style: 'swing',
    rank: 22,
    standard_key: 'Bb major',
    form: 'AABA, 32 bars',
    history_and_facts: 'A jazz standard…',
    chords: '| Em7b5 | A7 | Cm7 | F7 |',
    famous_recordings: ['Miles Davis – 1958'],
    youtube_video_ids: [{ id: 'abc123', title: 'Miles Davis' }],
    section_markers: [{ label: 'A', start: 1, end: 8 }],
  };

  describe('TabStrip', () => {
    it('renders tab labels and calls onSelect', () => {
      const onSelect = vi.fn();
      render(
        <TabStrip
          tabs={[{ id: 'overview', label: 'Overview' }, { id: 'chords', label: 'Chords' }]}
          activeId="overview"
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText('Chords'));
      expect(onSelect).toHaveBeenCalledWith('chords');
    });
  });

  describe('OverviewTab', () => {
    it('renders composer, year, key, history', () => {
      render(<OverviewTab tune={tune} />);
      expect(screen.getByText(/Victor Young/)).toBeInTheDocument();
      expect(screen.getByText('1944')).toBeInTheDocument();
      expect(screen.getByText('Bb major')).toBeInTheDocument();
      expect(screen.getByText(/jazz standard/)).toBeInTheDocument();
    });
  });

  describe('ListenTab', () => {
    it('renders famous recordings', () => {
      render(<ListenTab tune={tune} />);
      expect(screen.getByText(/Miles Davis – 1958/)).toBeInTheDocument();
    });
    it('renders YouTube playlist button when videos exist', () => {
      render(<ListenTab tune={tune} />);
      const btn = screen.getByText(/YouTube Performances/i);
      expect(btn.closest('a').href).toContain('watch_videos?video_ids=abc123');
    });
  });

  describe('ChordsTab', () => {
    it('renders chord grid', () => {
      render(<ChordsTab tune={tune} />);
      expect(screen.getByText('Em7b5')).toBeInTheDocument();
      expect(screen.getByText('A7')).toBeInTheDocument();
    });
    it('renders transpose buttons', () => {
      render(<ChordsTab tune={tune} />);
      expect(screen.getByText('Concert')).toBeInTheDocument();
      expect(screen.getByText('Bb')).toBeInTheDocument();
      expect(screen.getByText('Eb')).toBeInTheDocument();
    });
    it('transposes when Bb button clicked', () => {
      render(<ChordsTab tune={tune} />);
      fireEvent.click(screen.getByText('Bb'));
      expect(screen.getByText('F#m7b5')).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run — verify FAIL**

- [ ] **Step 3: Implement TabStrip**

  Create `app/src/components/TabStrip.jsx`:

  ```jsx
  export function TabStrip({ tabs, activeId, onSelect }) {
    return (
      <div className="flex border-b border-zinc-200 bg-white">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 ${
              activeId === tab.id
                ? 'border-sky-500 text-sky-700'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 4: Implement OverviewTab**

  Create `app/src/components/OverviewTab.jsx`:

  ```jsx
  export function OverviewTab({ tune }) {
    return (
      <div className="px-3 sm:px-5 py-4 space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{tune.tune_name}</h1>
          <p className="text-zinc-600 mt-1">
            {tune.composer}
            {tune.lyricist && <span className="text-zinc-500"> · lyrics by {tune.lyricist}</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tune.style && <StatCard label="Style" value={tune.style} />}
          {tune.standard_key && <StatCard label="Key" value={tune.standard_key} />}
          {tune.year && <StatCard label="Year" value={tune.year} />}
          {tune.rank && <StatCard label="Rank" value={`#${tune.rank}`} />}
        </div>

        {tune.history_and_facts && (
          <div className="prose prose-zinc max-w-none">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">History &amp; Facts</h3>
            {tune.history_and_facts.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-zinc-700">{para}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  function StatCard({ label, value }) {
    return (
      <div className="bg-white rounded border border-zinc-200 px-3 py-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
        <div className="text-base font-semibold text-zinc-900 mt-0.5">{value}</div>
      </div>
    );
  }
  ```

- [ ] **Step 5: Implement YouTubePlaylistButton**

  Create `app/src/components/YouTubePlaylistButton.jsx`:

  ```jsx
  import { buildPlaylistUrl } from '../utils/youtubeUrl';

  export function YouTubePlaylistButton({ videoIds, label, variant = 'performances' }) {
    if (!videoIds || videoIds.length === 0) return null;
    const ids = videoIds.map(v => v.id);
    const url = buildPlaylistUrl(ids);
    const bg = variant === 'backing'
      ? 'bg-gradient-to-r from-zinc-700 to-zinc-900 text-white'
      : 'bg-gradient-to-r from-red-500 to-red-700 text-white';
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full px-4 py-3 rounded font-medium text-center ${bg} hover:opacity-90 transition`}
      >
        {label} ({videoIds.length})
      </a>
    );
  }
  ```

- [ ] **Step 6: Implement ListenTab**

  Create `app/src/components/ListenTab.jsx`:

  ```jsx
  import { YouTubePlaylistButton } from './YouTubePlaylistButton';

  export function ListenTab({ tune }) {
    const hasRecordings = tune.famous_recordings?.length > 0;
    const hasSpotify = tune.spotify_playlist_id;
    // YouTubePlaylistButton self-guards on empty/missing video arrays, no extra vars needed.

    return (
      <div className="px-3 sm:px-5 py-4 space-y-5">
        {hasRecordings && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">Famous Recordings</h3>
            <ul className="space-y-1">
              {tune.famous_recordings.map((r, i) => (
                <li key={i} className="flex gap-2 text-zinc-700">
                  <span className="text-sky-500">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasSpotify && (
          <a
            href={`https://open.spotify.com/playlist/${tune.spotify_playlist_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 rounded font-medium text-center bg-gradient-to-r from-green-500 to-green-700 text-white hover:opacity-90"
          >
            ▶ Spotify Playlist
          </a>
        )}

        <YouTubePlaylistButton videoIds={tune.youtube_video_ids} label="YouTube Performances" variant="performances" />
        <YouTubePlaylistButton videoIds={tune.youtube_backing_track_ids} label="YouTube Backing Tracks" variant="backing" />
      </div>
    );
  }
  ```

- [ ] **Step 7: Implement SectionMarkerBadges**

  Create `app/src/components/SectionMarkerBadges.jsx`:

  ```jsx
  export function SectionMarkerBadges({ markers }) {
    if (!markers || markers.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {markers.map((m, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs font-semibold bg-sky-100 text-sky-700 rounded"
          >
            {m.label}: {m.start}-{m.end}
          </span>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 8: Implement ChordsTab**

  Create `app/src/components/ChordsTab.jsx`:

  ```jsx
  import { useState } from 'react';
  import { ChordChart } from './ChordChart';
  import { SectionMarkerBadges } from './SectionMarkerBadges';

  const TRANSPOSE_OPTIONS = ['Concert', 'Bb', 'Eb'];

  export function ChordsTab({ tune }) {
    const [transposeKey, setTransposeKey] = useState('Concert');

    return (
      <div className="px-3 sm:px-5 py-4 space-y-4">
        {tune.form && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">Form &amp; Structure</h3>
            <p className="text-zinc-700 text-sm">{tune.form}</p>
            <div className="mt-2">
              <SectionMarkerBadges markers={tune.section_markers} />
            </div>
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Transpose:</span>
            {TRANSPOSE_OPTIONS.map(key => (
              <button
                key={key}
                onClick={() => setTransposeKey(key)}
                className={`px-3 py-1 text-xs rounded font-medium ${
                  transposeKey === key
                    ? 'bg-sky-500 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <ChordChart chords={tune.chords} transposeKey={transposeKey} sectionMarkers={tune.section_markers ?? []} />
        </div>

        {tune.chord_progression_notes && (
          <p className="text-xs text-zinc-500 italic">{tune.chord_progression_notes}</p>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 9: Run — verify PASS**

  ```bash
  cd app && npm test -- tabs
  ```

- [ ] **Step 10: Commit**

  ```bash
  git add app/src/components/TabStrip.jsx app/src/components/OverviewTab.jsx app/src/components/ListenTab.jsx app/src/components/ChordsTab.jsx app/src/components/SectionMarkerBadges.jsx app/src/components/YouTubePlaylistButton.jsx app/src/components/tabs.test.jsx
  git commit -m "feat(components): 3-tab tune detail UI (Overview/Listen/Chords)"
  ```

---

### Task 11: `routes/ReaderDetail.jsx` — assemble tabs into tune detail page

**Files:**
- Create: `app/src/routes/ReaderDetail.jsx`

Composes TabStrip + OverviewTab/ListenTab/ChordsTab, with conditional tab rendering.

- [ ] **Step 1: Implement**

  Create `app/src/routes/ReaderDetail.jsx`:

  ```jsx
  import { useState, useMemo } from 'react';
  import { TabStrip } from '../components/TabStrip';
  import { OverviewTab } from '../components/OverviewTab';
  import { ListenTab } from '../components/ListenTab';
  import { ChordsTab } from '../components/ChordsTab';

  export function ReaderDetail({ tune }) {
    const tabs = useMemo(() => {
      const t = [{ id: 'overview', label: 'Overview' }];
      const hasListen = tune.famous_recordings?.length > 0
        || tune.spotify_playlist_id
        || tune.youtube_video_ids?.length > 0
        || tune.youtube_backing_track_ids?.length > 0;
      if (hasListen) t.push({ id: 'listen', label: 'Listen' });
      if (tune.chords) t.push({ id: 'chords', label: 'Chords' });
      return t;
    }, [tune]);

    const [active, setActive] = useState('overview');

    return (
      <div className="flex flex-col h-full bg-white">
        <TabStrip tabs={tabs} activeId={active} onSelect={setActive} />
        <div className="flex-1 overflow-y-auto">
          {active === 'overview' && <OverviewTab tune={tune} />}
          {active === 'listen' && <ListenTab tune={tune} />}
          {active === 'chords' && <ChordsTab tune={tune} />}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/src/routes/ReaderDetail.jsx
  git commit -m "feat(routes): ReaderDetail composes 3-tab tune view"
  ```

---

### Task 12: `routes/ReaderHome.jsx` — master-detail layout

**Files:**
- Create: `app/src/routes/ReaderHome.jsx`
- Modify: `app/src/App.jsx` to mount it

- [ ] **Step 1: Implement ReaderHome**

  Create `app/src/routes/ReaderHome.jsx`:

  ```jsx
  import { useState } from 'react';
  import { useTunes } from '../hooks/useTunes';
  import { useViewport } from '../hooks/useViewport';
  import { TuneList } from '../components/TuneList';
  import { ReaderDetail } from './ReaderDetail';

  export function ReaderHome() {
    const { tunes, loading, error } = useTunes();
    const { isMobile } = useViewport();
    const [selectedId, setSelectedId] = useState(null);

    const selected = tunes.find(t => t.id === selectedId);

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading tunes…</div>;
    if (error) return <div className="p-8 text-center text-red-600">Failed to load: {error.message}</div>;

    // Mobile: list → full-screen detail
    if (isMobile) {
      if (selected) {
        return (
          <div className="flex flex-col h-screen">
            <div className="border-b border-zinc-200 bg-white p-3">
              <button onClick={() => setSelectedId(null)} className="text-sky-600 text-sm">← Back to list</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ReaderDetail tune={selected} />
            </div>
          </div>
        );
      }
      return (
        <div className="h-screen">
          <TuneList tunes={tunes} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      );
    }

    // Laptop: master-detail
    return (
      <div className="flex h-screen">
        <div className="w-1/3 max-w-md border-r border-zinc-200">
          <TuneList tunes={tunes} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="flex-1">
          {selected ? (
            <ReaderDetail tune={selected} />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400">
              Select a tune from the list
            </div>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Wire into App.jsx**

  Replace `app/src/App.jsx`:

  ```jsx
  import { Routes, Route } from 'react-router-dom';
  import { ReaderHome } from './routes/ReaderHome';

  export default function App() {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<ReaderHome />} />
          <Route path="/edit/*" element={<div className="p-8">Editor placeholder — Phase 5 will fill this in.</div>} />
        </Routes>
      </div>
    );
  }
  ```

- [ ] **Step 3: Test in browser**

  Run dev server:

  ```bash
  cd app && npm run dev
  ```

  The first run will fail to fetch from GitHub (file doesn't exist yet at that URL until we push). Workaround: temporarily point `RAW_URL` in `useTunes.js` to a relative path `/jazz-tunes.json` and copy `data/jazz-tunes.json` to `app/public/jazz-tunes.json`. Verify the UI works locally. Revert before the Phase 4 deploy.

  Expected: 525 tunes load in the list. Search filters work. Clicking a tune shows the 3 tabs. Transpose buttons change the chord grid. YouTube playlist buttons open valid URLs.

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/routes/ReaderHome.jsx app/src/App.jsx
  git commit -m "feat(routes): ReaderHome with master-detail layout (mobile + laptop)"
  ```

---

## Phase 4 — First Netlify deploy (reader live)

### Task 13: Add `netlify.toml` and prepare for deploy

**Files:**
- Create: `netlify.toml` (at repo root)

- [ ] **Step 1: Write netlify.toml**

  Create `/Users/trentjordan/code_projects/jazz-tune-db/netlify.toml`:

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

- [ ] **Step 2: Confirm useTunes points to production raw URL**

  Open `app/src/hooks/useTunes.js`. Confirm:

  ```js
  const RAW_URL = 'https://raw.githubusercontent.com/beeches-anode/jazz-tune-db/main/data/jazz-tunes.json';
  ```

- [ ] **Step 3: Push to GitHub**

  ```bash
  git push origin main
  ```

  This pushes `data/jazz-tunes.json` to GitHub so the raw URL becomes valid.

- [ ] **Step 4: Verify raw URL works**

  ```bash
  curl -I https://raw.githubusercontent.com/beeches-anode/jazz-tune-db/main/data/jazz-tunes.json
  ```

  Expected: `HTTP/2 200`.

- [ ] **Step 5: Commit netlify.toml**

  ```bash
  git add netlify.toml
  git commit -m "feat: add netlify.toml for build config"
  git push origin main
  ```

---

### Task 14: Create Netlify site and deploy

This is a one-time manual setup, done in the Netlify dashboard.

- [ ] **Step 1: Create site**

  - Go to app.netlify.com → Add new site → Import from Git → GitHub → select `beeches-anode/jazz-tune-db`
  - Site name: `trents-jazz-tunes` (or whatever's available — gives URL like `trents-jazz-tunes.netlify.app`)
  - Branch: `main`
  - Build settings should auto-detect from `netlify.toml`; confirm:
    - Base directory: `app`
    - Build command: `npm install && npm run build`
    - Publish directory: `app/dist`

- [ ] **Step 2: First deploy**

  Trigger deploy from the Netlify dashboard. Watch build logs — expected to complete in ~90 seconds.

- [ ] **Step 3: Visit live URL on laptop and mobile**

  - Open `https://<your-site>.netlify.app` on the laptop
  - Open the same URL on your iPhone
  - Verify: 525 tunes load, search works, tabs render, transpose buttons change chord display
  - Test YouTube playlist button: should open YouTube app with a playlist of all the videos for that tune

  **This is a milestone — the reader is live and usable from anywhere.** Send yourself a celebratory message.

- [ ] **Step 4: No commit needed** — just verify and proceed.

---

## Phase 5 — Editor laptop port

> The existing rich editor at `jazz-db-app/src/` is ~5000 lines of working code. We port it into `app/src/routes/Editor/` with one major change: swap localStorage for the save-tune API.

### Task 15: Port editor source tree

**Files:**
- Copy and adapt: `jazz-db-app/src/components/TuneBrowser/` → `app/src/routes/Editor/TuneBrowser/`
- Copy and adapt: `jazz-db-app/src/components/TuneEditor/` → `app/src/routes/Editor/TuneEditor/`
- Copy and adapt: `jazz-db-app/src/components/YouTubeCurator/` → `app/src/routes/Editor/YouTubeCurator/`
- Copy and adapt: `jazz-db-app/src/components/Dashboard/` → `app/src/routes/Editor/Dashboard/`
- Copy and adapt: `jazz-db-app/src/context/DatabaseContext.jsx` → `app/src/routes/Editor/DatabaseContext.jsx`

The DatabaseContext needs major edits (localStorage → API); the other components can be ported with minimal changes (mostly import paths).

- [ ] **Step 1: Copy the directory tree**

  ```bash
  mkdir -p app/src/routes/Editor
  cp -R jazz-db-app/src/components/TuneBrowser app/src/routes/Editor/TuneBrowser
  cp -R jazz-db-app/src/components/TuneEditor app/src/routes/Editor/TuneEditor
  cp -R jazz-db-app/src/components/YouTubeCurator app/src/routes/Editor/YouTubeCurator
  cp -R jazz-db-app/src/components/Dashboard app/src/routes/Editor/Dashboard
  cp jazz-db-app/src/context/DatabaseContext.jsx app/src/routes/Editor/DatabaseContext.jsx
  ```

- [ ] **Step 2: Fix import paths**

  Search-and-replace in the copied tree. Each file's relative imports like `../../utils/chordUtils` need to become `../../../utils/chordUtils`.

  Run a quick check:

  ```bash
  grep -rn "from '\.\./\.\./" app/src/routes/Editor/ | head -20
  ```

  For each match, adjust the path depth. (Likely a 30-min mechanical pass.)

- [ ] **Step 3: Verify ports compile**

  ```bash
  cd app && npm run dev
  ```

  Visit `http://localhost:5173/` — reader still works. The editor isn't wired up yet but no import errors should crash anything.

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/routes/Editor/
  git commit -m "feat(editor): port existing editor components (TuneBrowser, TuneEditor, YouTubeCurator, Dashboard)"
  ```

---

### Task 16: Replace localStorage in DatabaseContext with API calls

**Files:**
- Modify: `app/src/routes/Editor/DatabaseContext.jsx`

The original loads from localStorage and writes back on every change. Replace with: load via `useTunes`, save via `useSaveTune` (Phase 6 will implement the hook).

- [ ] **Step 1: Read the current DatabaseContext**

  ```bash
  cat app/src/routes/Editor/DatabaseContext.jsx
  ```

  Identify: `useEffect` that loads from localStorage; `setDatabase` calls that write to localStorage; `loadDatabase` action.

- [ ] **Step 2: Rewrite the context**

  Replace `app/src/routes/Editor/DatabaseContext.jsx` (full rewrite — original was localStorage-only):

  ```jsx
  import { createContext, useContext, useState, useEffect, useCallback } from 'react';
  import { useTunes } from '../../hooks/useTunes';

  const DatabaseContext = createContext(null);

  export function DatabaseProvider({ children }) {
    const { allTunes, sha, loading, error, refetch } = useTunes();
    const [database, setDatabase] = useState([]);

    useEffect(() => {
      setDatabase(allTunes);
    }, [allTunes]);

    const updateTune = useCallback((id, updates) => {
      setDatabase(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
      // Actual persistence happens via useSaveTune in components (Task 22)
    }, []);

    const addTune = useCallback((tune) => {
      setDatabase(prev => [...prev, tune]);
    }, []);

    return (
      <DatabaseContext.Provider value={{ database, setDatabase, updateTune, addTune, sha, loading, error, refetch }}>
        {children}
      </DatabaseContext.Provider>
    );
  }

  export function useDatabase() {
    const ctx = useContext(DatabaseContext);
    if (!ctx) throw new Error('useDatabase must be used inside DatabaseProvider');
    return ctx;
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/src/routes/Editor/DatabaseContext.jsx
  git commit -m "refactor(editor): swap localStorage for useTunes in DatabaseContext"
  ```

---

## Phase 6 — Save pipeline (Netlify Functions)

### Task 17: `_shared/auth.js` — HMAC token sign/verify

**Files:**
- Create: `app/netlify/functions/_shared/auth.js`
- Test: `app/netlify/functions/_shared/auth.test.js`

Mints and verifies short-lived HMAC tokens. Used by `auth-check` (issues tokens) and `save-tune`/`create-tune` (verifies tokens).

- [ ] **Step 1: Write the failing test**

  Create `app/netlify/functions/_shared/auth.test.js`:

  ```js
  import { describe, it, expect, beforeEach } from 'vitest';
  import { signToken, verifyToken } from './auth';

  const SECRET = 'a'.repeat(64);

  describe('signToken / verifyToken', () => {
    it('signs and verifies a token', () => {
      const token = signToken({ exp: Date.now() + 1000 }, SECRET);
      const payload = verifyToken(token, SECRET);
      expect(payload).toBeTruthy();
    });

    it('rejects an expired token', () => {
      const token = signToken({ exp: Date.now() - 1000 }, SECRET);
      expect(verifyToken(token, SECRET)).toBe(null);
    });

    it('rejects a tampered token', () => {
      const token = signToken({ exp: Date.now() + 1000 }, SECRET);
      const tampered = token.slice(0, -2) + 'aa';
      expect(verifyToken(tampered, SECRET)).toBe(null);
    });

    it('rejects with wrong secret', () => {
      const token = signToken({ exp: Date.now() + 1000 }, SECRET);
      expect(verifyToken(token, 'b'.repeat(64))).toBe(null);
    });
  });
  ```

- [ ] **Step 2: Implement**

  Create `app/netlify/functions/_shared/auth.js`:

  ```js
  import crypto from 'node:crypto';

  function base64url(buf) {
    return Buffer.from(buf).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64url(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    return Buffer.from(padded, 'base64');
  }

  export function signToken(payload, secret) {
    const body = base64url(JSON.stringify(payload));
    const sig = base64url(
      crypto.createHmac('sha256', secret).update(body).digest()
    );
    return `${body}.${sig}`;
  }

  export function verifyToken(token, secret) {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = base64url(
      crypto.createHmac('sha256', secret).update(body).digest()
    );
    if (sig !== expected) return null;
    let payload;
    try {
      payload = JSON.parse(fromBase64url(body).toString('utf8'));
    } catch {
      return null;
    }
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  }
  ```

- [ ] **Step 3: Run — verify PASS**

  ```bash
  cd app && npm test -- auth.test
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add app/netlify/functions/_shared/auth.js app/netlify/functions/_shared/auth.test.js
  git commit -m "feat(functions): HMAC token sign/verify helper"
  ```

---

### Task 18: `_shared/github.js` — GitHub Contents API client

**Files:**
- Create: `app/netlify/functions/_shared/github.js`
- Test: `app/netlify/functions/_shared/github.test.js`

Fetches and updates `data/jazz-tunes.json` via GitHub's Contents API.

- [ ] **Step 1: Write the failing test**

  Create `app/netlify/functions/_shared/github.test.js`:

  ```js
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { fetchTunesFile, commitTunesFile } from './github';

  describe('fetchTunesFile', () => {
    it('returns { tunes, sha } on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: Buffer.from(JSON.stringify([{ id: 't1' }])).toString('base64'),
          sha: 'abc123',
        }),
      });
      const result = await fetchTunesFile({ token: 't', repo: 'r/r', path: 'p' });
      expect(result.sha).toBe('abc123');
      expect(result.tunes).toEqual([{ id: 't1' }]);
    });
  });

  describe('commitTunesFile', () => {
    it('PUTs the new content', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ commit: { sha: 'new123' }, content: { sha: 'newfile456' } }),
      });
      global.fetch = fetchMock;
      const result = await commitTunesFile({
        token: 't', repo: 'r/r', path: 'p',
        tunes: [{ id: 't1' }], sha: 'abc123', message: 'test',
      });
      expect(result.sha).toBe('newfile456');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/contents/p'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
  ```

- [ ] **Step 2: Implement**

  Create `app/netlify/functions/_shared/github.js`:

  ```js
  function authHeader(token) {
    return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  }

  export async function fetchTunesFile({ token, repo, path, branch = 'main' }) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
    const res = await fetch(url, { headers: authHeader(token) });
    if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    const tunes = JSON.parse(content);
    return { tunes, sha: data.sha };
  }

  export async function commitTunesFile({ token, repo, path, tunes, sha, message, branch = 'main' }) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const content = Buffer.from(JSON.stringify(tunes, null, 2)).toString('base64');
    const res = await fetch(url, {
      method: 'PUT',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content, sha, branch }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      const e = new Error(`GitHub commit failed: ${res.status} ${errBody}`);
      e.status = res.status;
      throw e;
    }
    const data = await res.json();
    return { sha: data.content.sha, commitSha: data.commit.sha };
  }
  ```

- [ ] **Step 3: Run — verify PASS**

  ```bash
  cd app && npm test -- github.test
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add app/netlify/functions/_shared/github.js app/netlify/functions/_shared/github.test.js
  git commit -m "feat(functions): GitHub Contents API client (fetch + commit)"
  ```

---

### Task 19: `_shared/validation.js` — server-side tune schema validation

**Files:**
- Create: `app/netlify/functions/_shared/validation.js`
- Test: `app/netlify/functions/_shared/validation.test.js`

- [ ] **Step 1: Write the failing test**

  Create `app/netlify/functions/_shared/validation.test.js`:

  ```js
  import { describe, it, expect } from 'vitest';
  import { validateTuneUpdate, ALLOWED_FIELDS } from './validation';

  describe('validateTuneUpdate', () => {
    it('accepts valid update', () => {
      const result = validateTuneUpdate({ tune_name: 'New Name', composer: 'Someone' });
      expect(result.valid).toBe(true);
    });

    it('rejects update with id mutation', () => {
      const result = validateTuneUpdate({ id: 'new-id', tune_name: 'X' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id is immutable');
    });

    it('strips unknown fields', () => {
      const result = validateTuneUpdate({ tune_name: 'X', bogus_field: 'y' });
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toHaveProperty('bogus_field');
      expect(result.warnings).toContain("unknown field 'bogus_field' stripped");
    });

    it('rejects wrong types', () => {
      const result = validateTuneUpdate({ year: 'not a number' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('year must be an integer');
    });

    it('accepts is_archived as boolean', () => {
      const result = validateTuneUpdate({ is_archived: true });
      expect(result.valid).toBe(true);
    });
  });
  ```

- [ ] **Step 2: Implement**

  Create `app/netlify/functions/_shared/validation.js`:

  ```js
  export const ALLOWED_FIELDS = new Set([
    'tune_name', 'composer', 'lyricist', 'year', 'style', 'rank',
    'standard_key', 'form', 'history_and_facts', 'famous_recordings',
    'chords', 'section_markers', 'youtube_video_ids',
    'youtube_backing_track_ids', 'spotify_playlist_id',
    'chord_progression_notes', 'is_approved', 'is_archived', 'last_updated',
  ]);

  const TYPES = {
    tune_name: 'string', composer: 'string', lyricist: 'string',
    year: 'integer', style: 'string', rank: 'integer',
    standard_key: 'string', form: 'string', history_and_facts: 'string',
    famous_recordings: 'array', chords: 'string',
    section_markers: 'array', youtube_video_ids: 'array',
    youtube_backing_track_ids: 'array', spotify_playlist_id: 'string',
    chord_progression_notes: 'string',
    is_approved: 'boolean', is_archived: 'boolean', last_updated: 'string',
  };

  function checkType(value, type) {
    if (type === 'string') return typeof value === 'string';
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'array') return Array.isArray(value);
    if (type === 'boolean') return typeof value === 'boolean';
    return false;
  }

  export function validateTuneUpdate(updates) {
    if ('id' in updates) {
      return { valid: false, errors: ['id is immutable'], warnings: [], sanitized: null };
    }
    const sanitized = {};
    const errors = [];
    const warnings = [];
    for (const [k, v] of Object.entries(updates)) {
      if (!ALLOWED_FIELDS.has(k)) {
        warnings.push(`unknown field '${k}' stripped`);
        continue;
      }
      if (TYPES[k] && !checkType(v, TYPES[k])) {
        errors.push(`${k} must be ${TYPES[k] === 'integer' ? 'an integer' : `a ${TYPES[k]}`}`);
        continue;
      }
      sanitized[k] = v;
    }
    return { valid: errors.length === 0, errors, warnings, sanitized };
  }

  export function validateNewTune(tune) {
    if (!tune.tune_name || typeof tune.tune_name !== 'string') {
      return { valid: false, errors: ['tune_name is required'] };
    }
    if (!tune.composer || typeof tune.composer !== 'string') {
      return { valid: false, errors: ['composer is required'] };
    }
    return { valid: true, errors: [] };
  }
  ```

- [ ] **Step 3: Run — verify PASS**

  ```bash
  cd app && npm test -- validation.test
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add app/netlify/functions/_shared/validation.js app/netlify/functions/_shared/validation.test.js
  git commit -m "feat(functions): server-side tune schema validation"
  ```

---

### Task 20: `auth-check.js` — Netlify Function for editor password gate

**Files:**
- Create: `app/netlify/functions/auth-check.js`

- [ ] **Step 1: Implement**

  Create `app/netlify/functions/auth-check.js`:

  ```js
  import { signToken } from './_shared/auth.js';

  const TOKEN_TTL_DAYS = 7;

  export default async (req) => {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    const { password } = await req.json();
    if (password !== process.env.EDITOR_PASSWORD) {
      return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const exp = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
    const token = signToken({ exp }, process.env.EDITOR_TOKEN_SECRET);
    return new Response(JSON.stringify({ ok: true, token, exp }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/netlify/functions/auth-check.js
  git commit -m "feat(functions): auth-check — validate password, mint HMAC token"
  ```

---

### Task 21: `save-tune.js` — Netlify Function for updating a tune

**Files:**
- Create: `app/netlify/functions/save-tune.js`

- [ ] **Step 1: Implement**

  Create `app/netlify/functions/save-tune.js`:

  ```js
  import { verifyToken } from './_shared/auth.js';
  import { fetchTunesFile, commitTunesFile } from './_shared/github.js';
  import { validateTuneUpdate } from './_shared/validation.js';

  export default async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    // Auth
    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!verifyToken(token, process.env.EDITOR_TOKEN_SECRET)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const { tune_id, updated_fields, expected_sha } = await req.json();
    if (!tune_id || !updated_fields) {
      return new Response(JSON.stringify({ error: 'tune_id and updated_fields required' }), { status: 400 });
    }

    // Validate
    const validation = validateTuneUpdate(updated_fields);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'validation', details: validation.errors }), { status: 400 });
    }

    const opts = {
      token: process.env.GITHUB_TOKEN,
      repo: process.env.GITHUB_REPO,
      path: process.env.DATA_PATH || 'data/jazz-tunes.json',
    };

    // Retry loop for 409
    let attempt = 0;
    while (attempt < 2) {
      attempt++;
      const { tunes, sha } = await fetchTunesFile(opts);

      // Optimistic concurrency check
      if (expected_sha && expected_sha !== sha && attempt === 1) {
        // Field overlap check could go here; for v1, just retry once
      }

      const idx = tunes.findIndex(t => t.id === tune_id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: 'tune not found' }), { status: 404 });
      }

      const updated = {
        ...tunes[idx],
        ...validation.sanitized,
        last_updated: new Date().toISOString(),
      };
      const newTunes = [...tunes];
      newTunes[idx] = updated;

      const summary = Object.keys(validation.sanitized).filter(k => k !== 'last_updated').join(', ');
      const message = `Update ${updated.tune_name}: ${summary}`;

      try {
        const result = await commitTunesFile({ ...opts, tunes: newTunes, sha, message });
        return new Response(JSON.stringify({
          ok: true,
          sha: result.sha,
          tune: updated,
          warnings: validation.warnings,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err) {
        if (err.status === 409 && attempt < 2) {
          continue;  // retry
        }
        return new Response(JSON.stringify({ error: 'commit failed', details: err.message }), { status: 500 });
      }
    }
  };
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/netlify/functions/save-tune.js
  git commit -m "feat(functions): save-tune — commit field updates via GitHub Contents API"
  ```

---

### Task 22: `create-tune.js` — Netlify Function for adding a new tune

**Files:**
- Create: `app/netlify/functions/create-tune.js`

- [ ] **Step 1: Implement**

  Create `app/netlify/functions/create-tune.js`:

  ```js
  import { verifyToken } from './_shared/auth.js';
  import { fetchTunesFile, commitTunesFile } from './_shared/github.js';
  import { validateNewTune } from './_shared/validation.js';

  function generateId() {
    // Match existing format: lowercase alphanumeric, ~20 chars
    return Array.from({ length: 20 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
    ).join('');
  }

  export default async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!verifyToken(token, process.env.EDITOR_TOKEN_SECRET)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const { tune } = await req.json();
    const validation = validateNewTune(tune);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'validation', details: validation.errors }), { status: 400 });
    }

    const opts = {
      token: process.env.GITHUB_TOKEN,
      repo: process.env.GITHUB_REPO,
      path: process.env.DATA_PATH || 'data/jazz-tunes.json',
    };

    const { tunes, sha } = await fetchTunesFile(opts);

    const newTune = {
      id: generateId(),
      ...tune,
      is_approved: false,
      is_archived: false,
      last_updated: new Date().toISOString(),
    };
    const newTunes = [...tunes, newTune];

    const result = await commitTunesFile({
      ...opts,
      tunes: newTunes,
      sha,
      message: `Add tune: ${newTune.tune_name}`,
    });

    return new Response(JSON.stringify({ ok: true, sha: result.sha, tune: newTune }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/netlify/functions/create-tune.js
  git commit -m "feat(functions): create-tune — add new tune with generated ID"
  ```

---

## Phase 7 — Wire editor to save pipeline

### Task 23: `hooks/useAuth.js` — token storage and auth-check call

**Files:**
- Create: `app/src/hooks/useAuth.js`

- [ ] **Step 1: Implement**

  Create `app/src/hooks/useAuth.js`:

  ```js
  import { useState, useCallback } from 'react';

  const TOKEN_KEY = 'jazz-tune-db-token';

  function loadToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const { token, exp } = JSON.parse(raw);
      if (exp < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  export function useAuth() {
    const [token, setToken] = useState(() => loadToken());

    const login = useCallback(async (password) => {
      const res = await fetch('/.netlify/functions/auth-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token, exp: data.exp }));
        setToken(data.token);
        return true;
      }
      return false;
    }, []);

    const logout = useCallback(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }, []);

    return { token, isAuthed: !!token, login, logout };
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/src/hooks/useAuth.js
  git commit -m "feat(hooks): useAuth — editor password gate + token storage"
  ```

---

### Task 24: `components/AuthGate.jsx` — password prompt UI

**Files:**
- Create: `app/src/components/AuthGate.jsx`

- [ ] **Step 1: Implement**

  Create `app/src/components/AuthGate.jsx`:

  ```jsx
  import { useState } from 'react';
  import { useAuth } from '../hooks/useAuth';

  export function AuthGate({ children }) {
    const { isAuthed, login } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (isAuthed) return children;

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      const ok = await login(password);
      setSubmitting(false);
      if (!ok) setError('Incorrect password');
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 w-full max-w-sm">
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Editor</h1>
          <p className="text-sm text-zinc-600 mb-4">Enter the editor password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-zinc-300 rounded mb-3"
            autoFocus
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full px-4 py-2 bg-sky-500 text-white font-medium rounded hover:bg-sky-600 disabled:opacity-50"
          >
            {submitting ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/src/components/AuthGate.jsx
  git commit -m "feat(components): AuthGate — password prompt for editor"
  ```

---

### Task 25: `hooks/useSaveTune.js` and `useCreateTune.js`

**Files:**
- Create: `app/src/hooks/useSaveTune.js`
- Create: `app/src/hooks/useCreateTune.js`

- [ ] **Step 1: Implement useSaveTune**

  Create `app/src/hooks/useSaveTune.js`:

  ```js
  import { useState, useCallback } from 'react';
  import { useAuth } from './useAuth';

  export function useSaveTune() {
    const { token } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const save = useCallback(async (tuneId, updatedFields, expectedSha) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch('/.netlify/functions/save-tune', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tune_id: tuneId,
            updated_fields: updatedFields,
            expected_sha: expectedSha,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'save failed');
        return data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    }, [token]);

    return { save, saving, error };
  }
  ```

- [ ] **Step 2: Implement useCreateTune**

  Create `app/src/hooks/useCreateTune.js`:

  ```js
  import { useState, useCallback } from 'react';
  import { useAuth } from './useAuth';

  export function useCreateTune() {
    const { token } = useAuth();
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    const create = useCallback(async (tune) => {
      setCreating(true);
      setError(null);
      try {
        const res = await fetch('/.netlify/functions/create-tune', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tune }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'create failed');
        return data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setCreating(false);
      }
    }, [token]);

    return { create, creating, error };
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/src/hooks/useSaveTune.js app/src/hooks/useCreateTune.js
  git commit -m "feat(hooks): useSaveTune and useCreateTune — POST to Netlify Functions"
  ```

---

### Task 26: Wire DatabaseContext to actually save via useSaveTune

**Files:**
- Modify: `app/src/routes/Editor/DatabaseContext.jsx`

- [ ] **Step 1: Update DatabaseContext to debounce-save on update**

  Replace `app/src/routes/Editor/DatabaseContext.jsx`:

  ```jsx
  import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
  import { useTunes } from '../../hooks/useTunes';
  import { useSaveTune } from '../../hooks/useSaveTune';

  const DatabaseContext = createContext(null);

  export function DatabaseProvider({ children }) {
    const { allTunes, sha, loading, error, refetch } = useTunes();
    const [database, setDatabase] = useState([]);
    const { save } = useSaveTune();
    const pendingSaves = useRef(new Map()); // tune_id → { fields, timer }

    useEffect(() => {
      setDatabase(allTunes);
    }, [allTunes]);

    const flushSave = useCallback(async (tuneId) => {
      const pending = pendingSaves.current.get(tuneId);
      if (!pending) return;
      pendingSaves.current.delete(tuneId);
      try {
        const result = await save(tuneId, pending.fields, sha);
        return result;
      } catch (err) {
        // Re-queue the failed fields so a subsequent edit retries the save
        const existing = pendingSaves.current.get(tuneId);
        pendingSaves.current.set(tuneId, {
          fields: { ...pending.fields, ...(existing?.fields || {}) },
          timer: null,
        });
        throw err;
      }
    }, [save, sha]);

    const updateTune = useCallback((id, updates) => {
      setDatabase(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));

      // Debounced save: 2s after last edit
      const existing = pendingSaves.current.get(id);
      const mergedFields = { ...(existing?.fields || {}), ...updates };
      if (existing?.timer) clearTimeout(existing.timer);
      const timer = setTimeout(() => flushSave(id), 2000);
      pendingSaves.current.set(id, { fields: mergedFields, timer });
    }, [flushSave]);

    return (
      <DatabaseContext.Provider value={{ database, setDatabase, updateTune, sha, loading, error, refetch }}>
        {children}
      </DatabaseContext.Provider>
    );
  }

  export function useDatabase() {
    const ctx = useContext(DatabaseContext);
    if (!ctx) throw new Error('useDatabase must be used inside DatabaseProvider');
    return ctx;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/src/routes/Editor/DatabaseContext.jsx
  git commit -m "feat(editor): wire DatabaseContext to debounced saves via useSaveTune"
  ```

---

### Task 27: `routes/EditorLaptop.jsx` — mount the existing editor inside AuthGate

**Files:**
- Create: `app/src/routes/EditorLaptop.jsx`
- Modify: `app/src/App.jsx`

- [ ] **Step 1: Implement**

  Create `app/src/routes/EditorLaptop.jsx`:

  ```jsx
  import { DatabaseProvider } from './Editor/DatabaseContext';
  import { TuneBrowser } from './Editor/TuneBrowser/TuneBrowser';
  // Other imports as needed by the ported editor

  export function EditorLaptop() {
    return (
      <DatabaseProvider>
        <div className="min-h-screen">
          <TuneBrowser />
          {/* Plus whatever top-level routes the editor needs:
              - TuneEditor for the per-tune split-pane
              - YouTubeCurator
              - Dashboard
              These come from the ported tree in app/src/routes/Editor/
          */}
        </div>
      </DatabaseProvider>
    );
  }
  ```

  Note: this task is a stub. The actual structure depends on how `jazz-db-app/src/App.jsx` organizes its top-level routes. Open `jazz-db-app/src/App.jsx` and mirror its structure here, but rooted at `/edit`.

- [ ] **Step 2: Wire into App.jsx**

  Replace `app/src/App.jsx`:

  ```jsx
  import { Routes, Route } from 'react-router-dom';
  import { ReaderHome } from './routes/ReaderHome';
  import { EditorLaptop } from './routes/EditorLaptop';
  import { EditorMobile } from './routes/EditorMobile';   // Phase 8
  import { AuthGate } from './components/AuthGate';
  import { useViewport } from './hooks/useViewport';

  function EditorRoute() {
    const { isMobile } = useViewport();
    return (
      <AuthGate>
        {isMobile ? <EditorMobile /> : <EditorLaptop />}
      </AuthGate>
    );
  }

  export default function App() {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<ReaderHome />} />
          <Route path="/edit/*" element={<EditorRoute />} />
        </Routes>
      </div>
    );
  }
  ```

  This will break until EditorMobile is created in Phase 8. Comment out the EditorMobile import + reference temporarily, and uncomment when Phase 8 lands.

- [ ] **Step 3: Local smoke test**

  ```bash
  cd app && npm run dev
  ```

  Visit `/edit` — expect password prompt. Visit `/` — reader still works.

  Note: at this stage saves will fail because Netlify Functions aren't deployed locally. Use `netlify dev` if you want full local function support:

  ```bash
  cd app && npx netlify dev
  ```

  This requires `netlify-cli` installed: `npm install -g netlify-cli` (one-time).

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/routes/EditorLaptop.jsx app/src/App.jsx
  git commit -m "feat(editor): EditorLaptop route wired with AuthGate"
  ```

---

## Phase 8 — Mobile editor

### Task 28: `components/PasteYouTubeModal.jsx` — paste-URL flow

**Files:**
- Create: `app/src/components/PasteYouTubeModal.jsx`
- Create: `app/src/hooks/useYouTubeMetadata.js`

The marquee mobile UX: paste a YouTube URL, app auto-fetches title + channel, one tap to add.

- [ ] **Step 1: Implement useYouTubeMetadata**

  Create `app/src/hooks/useYouTubeMetadata.js`:

  ```js
  import { useState, useCallback } from 'react';

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  export function useYouTubeMetadata() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMetadata = useCallback(async (videoId) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
        );
        const data = await res.json();
        const item = data.items?.[0]?.snippet;
        if (!item) throw new Error('Video not found');
        return {
          id: videoId,
          title: item.title,
          channelTitle: item.channelTitle,
          thumbnail: item.thumbnails?.medium?.url,
        };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    return { fetchMetadata, loading, error };
  }
  ```

- [ ] **Step 2: Implement PasteYouTubeModal**

  Create `app/src/components/PasteYouTubeModal.jsx`:

  ```jsx
  import { useState } from 'react';
  import { parseVideoId } from '../utils/youtubeUrl';
  import { useYouTubeMetadata } from '../hooks/useYouTubeMetadata';

  export function PasteYouTubeModal({ onAdd, onClose }) {
    const [url, setUrl] = useState('');
    const [metadata, setMetadata] = useState(null);
    const [variant, setVariant] = useState('performance');
    const { fetchMetadata, loading, error } = useYouTubeMetadata();

    const handlePaste = async () => {
      const videoId = parseVideoId(url);
      if (!videoId) {
        alert('Invalid YouTube URL');
        return;
      }
      try {
        const meta = await fetchMetadata(videoId);
        setMetadata(meta);
      } catch {
        // error state handled by hook
      }
    };

    const handleConfirm = () => {
      onAdd({
        id: metadata.id,
        title: metadata.title,
        channelTitle: metadata.channelTitle,
        verified: true,
        added_date: new Date().toISOString().slice(0, 10),
      }, variant);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
        <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md p-5">
          <h2 className="text-lg font-bold mb-3">Add YouTube video</h2>

          {!metadata ? (
            <>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Paste YouTube URL"
                className="w-full px-3 py-2 border border-zinc-300 rounded mb-3"
                autoFocus
              />
              {error && <p className="text-sm text-red-600 mb-2">{error.message}</p>}
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-zinc-300 rounded">Cancel</button>
                <button onClick={handlePaste} disabled={!url || loading} className="flex-1 px-4 py-2 bg-sky-500 text-white rounded disabled:opacity-50">
                  {loading ? 'Fetching…' : 'Continue'}
                </button>
              </div>
            </>
          ) : (
            <>
              {metadata.thumbnail && <img src={metadata.thumbnail} alt="" className="w-full rounded mb-3" />}
              <p className="font-semibold">{metadata.title}</p>
              <p className="text-sm text-zinc-600 mb-3">{metadata.channelTitle}</p>
              <div className="space-y-2 mb-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={variant === 'performance'} onChange={() => setVariant('performance')} />
                  <span>Performance</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={variant === 'backing'} onChange={() => setVariant('backing')} />
                  <span>Backing Track</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMetadata(null)} className="flex-1 px-4 py-2 border border-zinc-300 rounded">Back</button>
                <button onClick={handleConfirm} className="flex-1 px-4 py-2 bg-sky-500 text-white rounded">Add</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/src/components/PasteYouTubeModal.jsx app/src/hooks/useYouTubeMetadata.js
  git commit -m "feat(mobile): PasteYouTubeModal — paste URL → auto-fetch title → add"
  ```

---

### Task 29: `routes/EditorMobile.jsx` — lightweight per-tune form

**Files:**
- Create: `app/src/routes/EditorMobile.jsx`

- [ ] **Step 1: Implement**

  Create `app/src/routes/EditorMobile.jsx`:

  ```jsx
  import { useState } from 'react';
  import { DatabaseProvider, useDatabase } from './Editor/DatabaseContext';
  import { TuneList } from '../components/TuneList';
  import { PasteYouTubeModal } from '../components/PasteYouTubeModal';

  function MobileEditorInner() {
    const { database, updateTune } = useDatabase();
    const [selectedId, setSelectedId] = useState(null);
    const [showYouTubeModal, setShowYouTubeModal] = useState(false);

    const tune = database.find(t => t.id === selectedId);

    if (!tune) {
      return <TuneList tunes={database} onSelect={setSelectedId} />;
    }

    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-3 py-3 flex items-center justify-between">
          <button onClick={() => setSelectedId(null)} className="text-sky-600 text-sm">← List</button>
          <span className="font-semibold truncate mx-2 flex-1 text-center">{tune.tune_name}</span>
          <span className="text-xs text-zinc-500 w-10">{/* save indicator goes here */}</span>
        </div>

        <div className="p-4 space-y-5">
          <Section title="Basics">
            <FormField label="Tune Name" value={tune.tune_name} onChange={v => updateTune(tune.id, { tune_name: v })} />
            <FormField label="Composer" value={tune.composer} onChange={v => updateTune(tune.id, { composer: v })} />
            <FormField label="Lyricist" value={tune.lyricist ?? ''} onChange={v => updateTune(tune.id, { lyricist: v })} />
            <FormField label="Year" type="number" value={tune.year ?? ''} onChange={v => updateTune(tune.id, { year: parseInt(v, 10) || null })} />
            <FormField label="Style" value={tune.style ?? ''} onChange={v => updateTune(tune.id, { style: v })} />
            <FormField label="Standard Key" value={tune.standard_key ?? ''} onChange={v => updateTune(tune.id, { standard_key: v })} />
            <FormField label="Rank" type="number" value={tune.rank ?? ''} onChange={v => updateTune(tune.id, { rank: parseInt(v, 10) || null })} />
            <FormToggle label="Approved" value={tune.is_approved} onChange={v => updateTune(tune.id, { is_approved: v })} />
          </Section>

          <Section title="Listen">
            <FormFieldList
              label="Famous Recordings"
              values={tune.famous_recordings ?? []}
              onChange={list => updateTune(tune.id, { famous_recordings: list })}
            />
            <button
              onClick={() => setShowYouTubeModal(true)}
              className="w-full px-4 py-3 bg-red-500 text-white rounded font-medium"
            >
              + Paste YouTube URL
            </button>
            <div className="text-sm text-zinc-600 mt-2">
              {(tune.youtube_video_ids?.length ?? 0)} performances · {(tune.youtube_backing_track_ids?.length ?? 0)} backing tracks
            </div>
          </Section>

          <Section title="Chords">
            <FormField
              label="Chord Progression (pipe-delimited)"
              value={tune.chords ?? ''}
              onChange={v => updateTune(tune.id, { chords: v })}
              multiline
            />
            <p className="text-xs text-zinc-500 mt-1">For visual chord editing, open this tune on your laptop.</p>
          </Section>

          <Section title="History">
            <FormField label="History &amp; Facts" value={tune.history_and_facts ?? ''} onChange={v => updateTune(tune.id, { history_and_facts: v })} multiline />
          </Section>

          <button
            onClick={() => {
              if (confirm('Archive this tune? (You can restore from the laptop editor.)')) {
                updateTune(tune.id, { is_archived: true });
                setSelectedId(null);
              }
            }}
            className="w-full px-4 py-3 border border-red-300 text-red-700 rounded"
          >
            Archive tune
          </button>
        </div>

        {showYouTubeModal && (
          <PasteYouTubeModal
            onClose={() => setShowYouTubeModal(false)}
            onAdd={(video, variant) => {
              const field = variant === 'backing' ? 'youtube_backing_track_ids' : 'youtube_video_ids';
              const current = tune[field] ?? [];
              updateTune(tune.id, { [field]: [...current, video] });
            }}
          />
        )}
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <div className="bg-white rounded border border-zinc-200 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-3">{title}</h2>
        <div className="space-y-3">{children}</div>
      </div>
    );
  }

  function FormField({ label, value, onChange, type = 'text', multiline = false }) {
    return (
      <label className="block">
        <span className="text-sm text-zinc-700">{label}</span>
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={6}
            className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded font-mono text-sm"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded"
          />
        )}
      </label>
    );
  }

  function FormToggle({ label, value, onChange }) {
    return (
      <label className="flex items-center justify-between">
        <span className="text-sm text-zinc-700">{label}</span>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          className="w-5 h-5"
        />
      </label>
    );
  }

  function FormFieldList({ label, values, onChange }) {
    const update = (i, v) => onChange(values.map((x, j) => (i === j ? v : x)));
    const add = () => onChange([...values, '']);
    const remove = i => onChange(values.filter((_, j) => j !== i));
    return (
      <div>
        <span className="text-sm text-zinc-700">{label}</span>
        <div className="space-y-2 mt-1">
          {values.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={v}
                onChange={e => update(i, e.target.value)}
                className="flex-1 px-3 py-2 border border-zinc-300 rounded"
              />
              <button onClick={() => remove(i)} className="px-3 text-red-600">×</button>
            </div>
          ))}
          <button onClick={add} className="text-sm text-sky-600">+ Add</button>
        </div>
      </div>
    );
  }

  export function EditorMobile() {
    return (
      <DatabaseProvider>
        <MobileEditorInner />
      </DatabaseProvider>
    );
  }
  ```

- [ ] **Step 2: Restore EditorMobile in App.jsx**

  Uncomment the EditorMobile import and reference in `app/src/App.jsx` (from Task 27 Step 2).

- [ ] **Step 3: Local smoke test**

  ```bash
  cd app && npx netlify dev
  ```

  Use Chrome DevTools device emulator (responsive mode, iPhone 14 Pro) → visit `/edit` → unlock with password → see TuneList → tap a tune → see mobile form. Edit a field, wait 2 seconds, check Network tab for a POST to save-tune.

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/routes/EditorMobile.jsx app/src/App.jsx
  git commit -m "feat(mobile): EditorMobile — lightweight per-tune form with YouTube paste"
  ```

---

## Phase 9 — Polish, deploy, and finish

### Task 30: Set Netlify env vars

- [ ] **Step 1: In Netlify dashboard → Site settings → Environment variables, add:**

  | Variable | Value |
  |---|---|
  | `GITHUB_TOKEN` | The PAT from P2 |
  | `GITHUB_REPO` | `beeches-anode/jazz-tune-db` |
  | `DATA_PATH` | `data/jazz-tunes.json` |
  | `EDITOR_PASSWORD` | The password from P3 |
  | `EDITOR_TOKEN_SECRET` | The 32-byte hex from P3 |
  | `VITE_YOUTUBE_API_KEY` | The YouTube API key from P4 |

- [ ] **Step 2: Trigger a fresh deploy**

  Netlify dashboard → Deploys → Trigger deploy → Clear cache and deploy site.

  Watch logs — expected to complete in ~90s.

- [ ] **Step 3: Test live editor end-to-end**

  Visit `https://<your-site>.netlify.app/edit`:
  - Password prompt appears
  - Wrong password → "Incorrect password"
  - Correct password → editor loads
  - Make a small edit (change a tune's style or year)
  - Wait 2 seconds — Save indicator appears
  - Check the GitHub repo: a new commit titled `"Update <tune>: style"` should appear on `main` within ~10 seconds
  - Refresh the reader on a different device — the change appears within ~10 seconds

  If anything fails, check Netlify Function logs (Deploys → Functions → save-tune).

---

### Task 31: Write project README

**Files:**
- Create: `README.md` at repo root

- [ ] **Step 1: Write README.md**

  ```markdown
  # Trent's Jazz Tune Database

  Personal web app for browsing and editing 525+ jazz tunes.

  ## Use

  - **Browse:** https://<your-site>.netlify.app — public, mobile-first, no auth
  - **Edit:** https://<your-site>.netlify.app/edit — password-gated; mobile = light form, laptop = rich editor
  - **From Claude Code:** ask Claude to read or edit `data/jazz-tunes.json` directly

  ## Architecture

  - `app/` — Vite/React app
  - `data/jazz-tunes.json` — canonical data
  - `app/netlify/functions/` — save-tune, create-tune, auth-check
  - `docs/spec.md` — full design
  - `docs/plan.md` — implementation plan

  Edits from the web app commit to GitHub. The app fetches data at runtime from `raw.githubusercontent.com` so saves are visible within ~10 seconds across devices.

  ## Local dev

  ```bash
  cd app
  npm install
  npm run dev          # reader works; saves fail (no Netlify Functions)
  npx netlify dev      # full local with functions (requires `netlify-cli`)
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
  ```

- [ ] **Step 2: Commit and push**

  ```bash
  git add README.md
  git commit -m "docs: add project README"
  git push origin main
  ```

---

### Task 32: Decommission `jazz-db-app/`

**Files:**
- Delete: `jazz-db-app/` directory (entire)

The old editor's code has been ported into `app/src/routes/Editor/`. The standalone version is no longer needed.

- [ ] **Step 1: Verify the new editor works in production for at least one save**

  Make a test edit via the deployed app's `/edit` route. Confirm it commits and appears in the reader. **Don't skip this.**

- [ ] **Step 2: Remove the old folder**

  ```bash
  git rm -r jazz-db-app
  ```

- [ ] **Step 3: Commit**

  ```bash
  git commit -m "chore: remove jazz-db-app — superseded by app/"
  git push origin main
  ```

---

### Task 33: Run final success-criteria checklist

Validate against the spec's Section 14:

- [ ] Reader loads on mobile and laptop, displays all 525 tunes
- [ ] Tune detail shows 3-tab UI (Overview / Listen / Chords) with conditional rendering
- [ ] Chord chart renders correctly with Concert/Bb/Eb transposition
- [ ] YouTube playlist buttons open aggregated playlists in YouTube app
- [ ] Editor on laptop performs all operations the existing `jazz-db-app/` did, but saves persist to GitHub
- [ ] Editor on mobile supports paste-URL YouTube add, text edits, approval toggle
- [ ] Edits made on mobile show up on laptop within 10 seconds of refresh, and vice versa
- [ ] Claude Code can read, add, and edit tunes via local file operations
- [ ] Soft delete works; archived tunes hidden from reader; restorable from laptop editor
- [ ] Single password gates `/edit`; no other auth needed

If any item fails, file an issue in the repo and address before declaring v1 done.

---

## Done.

After Task 33, v1 is shipped. Open questions and future enhancements live in spec.md Section 13.
