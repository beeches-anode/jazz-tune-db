# standard_key Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the narrative `standard_key` field into a strict canonical key plus a structured `alternate_keys` array, migrate all 526 tunes, and remove the vestigial `key` field.

**Architecture:** The schema lock (`app/netlify/functions/_shared/validation.js`) gains a canonical-key regex and two field validators that both server save paths and the client import (single source of truth). A standalone Node script (`scripts/migrate-standard-key.mjs`) performs a deterministic Phase A sweep, then Phase B parses ~233 narrative values via subagents into a human-reviewed patch file before anything touches the data. App components then consume the clean schema.

**Tech Stack:** Node 18+ ESM, vitest (app tests), `node:test` (migration script tests), React 18 / Vite, Netlify Functions.

**Spec:** `docs/superpowers/specs/2026-08-22-standard-key-split-design.md` — read it first; every requirement below traces to it.

## Global Constraints

- Canonical key regex, verbatim everywhere: `/^[A-G][b#]? (major|minor|blues|dorian|mixolydian|lydian|phrygian|locrian)$/`
- Qualities and modes are lowercase (`"C major"`, `"F blues"`, `"D dorian"`). Empty string `""` is a valid `standard_key` (keyless tune).
- `alternate_keys` entries are exactly `{ key, context }` — `key` matches the regex (non-empty), `context` is a non-empty string. No other properties.
- Unconventional roots `A#`, `D#`, `B#`, `E#`, `Cb`, `Fb` are **warnings**, never errors.
- Canonical data file: `data/jazz-tunes.json`. `git pull --rebase` before any commit that touches it. Never remove tunes from the array (soft delete only). Do not bump `last_updated` during migration.
- Data file convention: all fields present on every record (`alternate_keys: []` when none).
- Serialization must match the web app: `JSON.stringify(tunes, null, 2)`, preserving the file's existing trailing-newline state.
- Test commands: `cd app && npm run lint && npm test` (vitest); migration script: `node --test scripts/` from repo root.
- Branch: all work on feature branch `standard-key-split`. The live web editor commits to `main` concurrently — Task 13 re-syncs.
- **Spec deviation (approved rationale):** the spec says to disable transpose when `standard_key` is empty. During planning we found `getSemitoneDistance` uses **fixed offsets** (+2 / −3) for the `Bb instrument` / `Eb instrument` targets and never reads the from-key, so instrument transposition works for keyless tunes today. Disabling it would be a regression. Task 10 therefore removes the misleading `|| 'C major'` fallback but keeps transpose enabled. Everything else follows the spec.

## File Structure

| File | Role |
|---|---|
| `app/netlify/functions/_shared/validation.js` (modify) | Schema lock. Gains `KEY_REGEX`, `KEY_QUALITIES`, `UNCONVENTIONAL_ROOTS`, `parseKey`, `validateStandardKey`, `validateAlternateKeys`; `ALLOWED_FIELDS`/`TYPES` updated; `validateNewTune` hardened. Single source of truth — client imports from here. |
| `app/netlify/functions/_shared/validation.test.js` (modify) | Vitest coverage for all new rules. |
| `app/netlify/functions/create-tune.js` (modify) | Uses sanitized output instead of raw spread. |
| `scripts/migrate-standard-key.mjs` (create) | Pure transform functions + CLI: `--phase-a`, `--worklist`, `--build-patch`, `--apply`, `--verify`. |
| `scripts/migrate-standard-key.test.mjs` (create) | `node:test` coverage for the pure functions. |
| `docs/superpowers/migrations/2026-08-22-standard-key-split.patch.json` (generated) | Human-reviewed Phase B patch. |
| `app/src/routes/Editor/utils/validation.js` (modify) | Client `validateTune` flags format violations via imported `KEY_REGEX`. |
| `app/src/routes/Editor/TuneEditor/AlternateKeysEditor.jsx` (create) | Repeater UI for `alternate_keys`; used by laptop + mobile editors. |
| `app/src/routes/Editor/TuneEditor/BasicInfoForm.jsx` (modify) | Inline key validation + embeds `AlternateKeysEditor`. |
| `app/src/routes/EditorMobile.jsx` (modify) | Same, mobile form. |
| `app/src/routes/Editor/TuneEditor/PreviewPanel.jsx` (modify) | Drops fake from-key; shows alternates in header. |
| `app/src/routes/Editor/TuneBrowser/TuneBrowser.jsx` (modify) | Key filter covers primary + alternates. |
| `app/src/components/TuneCard.jsx`, `app/src/components/OverviewTab.jsx`, `app/src/routes/Editor/TuneEditor/Validation.jsx` (modify) | Small display additions. |

---

### Task 1: Canonical key validators + schema lock changes

**Files:**
- Modify: `app/netlify/functions/_shared/validation.js`
- Test: `app/netlify/functions/_shared/validation.test.js`

**Interfaces:**
- Consumes: nothing (foundation task).
- Produces (exact exports later tasks import):
  - `KEY_REGEX` — the canonical regex (a `RegExp`)
  - `KEY_QUALITIES` — `['major','minor','blues','dorian','mixolydian','lydian','phrygian','locrian']`
  - `UNCONVENTIONAL_ROOTS` — `Set` of `'A#','D#','B#','E#','Cb','Fb'`
  - `parseKey(value: string) → { root: string, quality: string } | null`
  - `validateStandardKey(value) → { errors: string[], warnings: string[] }`
  - `validateAlternateKeys(value, standardKey) → { errors: string[], warnings: string[] }`
  - `ALLOWED_FIELDS` now contains `'alternate_keys'` and NOT `'key'`; `TYPES.alternate_keys === 'array'`

- [ ] **Step 1: Write the failing tests**

Append to `app/netlify/functions/_shared/validation.test.js` (keep the existing `describe` block untouched; note the import line gains new names):

```js
import { describe, it, expect } from 'vitest';
import {
  validateTuneUpdate, validateNewTune, ALLOWED_FIELDS,
  KEY_REGEX, parseKey, validateStandardKey, validateAlternateKeys,
} from './validation';
```

```js
describe('canonical key format', () => {
  it.each([
    'C major', 'Eb minor', 'F blues', 'D dorian',
    'F# mixolydian', 'Bb lydian', 'C# phrygian', 'G locrian',
  ])('accepts %s', (k) => {
    expect(validateStandardKey(k).errors).toEqual([]);
  });

  it('accepts empty string (keyless tune)', () => {
    expect(validateStandardKey('').errors).toEqual([]);
  });

  it.each([
    'C major (vocal)', 'C', 'Cmaj', 'various', 'E-flat major',
    'c major', 'C Major', 'H major', 'C  major', 'D Dorian',
  ])('rejects %s', (k) => {
    expect(validateStandardKey(k).errors.length).toBeGreaterThan(0);
  });

  it('warns on unconventional enharmonic roots but does not error', () => {
    const r = validateStandardKey('A# major');
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBe(1);
  });

  it('parseKey extracts root and quality', () => {
    expect(parseKey('Eb minor')).toEqual({ root: 'Eb', quality: 'minor' });
    expect(parseKey('F blues')).toEqual({ root: 'F', quality: 'blues' });
    expect(parseKey('garbage')).toBeNull();
    expect(parseKey('')).toBeNull();
  });
});

describe('alternate_keys validation', () => {
  const good = [{ key: 'C major', context: 'common vocal call key' }];

  it('accepts an empty array', () => {
    expect(validateAlternateKeys([], 'F major').errors).toEqual([]);
  });

  it('accepts well-formed entries', () => {
    expect(validateAlternateKeys(good, 'F major').errors).toEqual([]);
  });

  it('rejects non-arrays', () => {
    expect(validateAlternateKeys('C major', 'F major').errors.length).toBeGreaterThan(0);
  });

  it('rejects an entry with a bad key', () => {
    const r = validateAlternateKeys([{ key: 'C', context: 'x' }], '');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects an entry with an empty key', () => {
    const r = validateAlternateKeys([{ key: '', context: 'x' }], '');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects an entry with missing or empty context', () => {
    expect(validateAlternateKeys([{ key: 'C major' }], '').errors.length).toBeGreaterThan(0);
    expect(validateAlternateKeys([{ key: 'C major', context: '  ' }], '').errors.length).toBeGreaterThan(0);
  });

  it('rejects unknown properties on entries', () => {
    const r = validateAlternateKeys([{ key: 'C major', context: 'x', extra: 1 }], '');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejects exact duplicate entries', () => {
    const r = validateAlternateKeys([...good, ...good], 'F major');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('warns (not errors) when an alternate equals standard_key', () => {
    const r = validateAlternateKeys([{ key: 'F major', context: 'same but noted' }], 'F major');
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBe(1);
  });
});

describe('schema lock changes', () => {
  it('alternate_keys is an allowed array field', () => {
    expect(ALLOWED_FIELDS.has('alternate_keys')).toBe(true);
    const r = validateTuneUpdate({ alternate_keys: [{ key: 'C major', context: 'x' }] });
    expect(r.valid).toBe(true);
  });

  it('key is no longer allowed and is stripped with a warning', () => {
    expect(ALLOWED_FIELDS.has('key')).toBe(false);
    const r = validateTuneUpdate({ tune_name: 'X', key: 'F' });
    expect(r.valid).toBe(true);
    expect(r.sanitized).not.toHaveProperty('key');
    expect(r.warnings).toContain("unknown field 'key' stripped");
  });

  it('validateTuneUpdate rejects a narrative standard_key', () => {
    const r = validateTuneUpdate({ standard_key: 'Ab major (concert); also C or F' });
    expect(r.valid).toBe(false);
  });

  it('validateTuneUpdate accepts a canonical standard_key', () => {
    const r = validateTuneUpdate({ standard_key: 'Ab major' });
    expect(r.valid).toBe(true);
  });

  it('validateTuneUpdate rejects malformed alternate_keys', () => {
    const r = validateTuneUpdate({ alternate_keys: [{ key: 'nope', context: '' }] });
    expect(r.valid).toBe(false);
  });

  it('validateTuneUpdate surfaces enharmonic warnings while staying valid', () => {
    const r = validateTuneUpdate({ standard_key: 'D# minor' });
    expect(r.valid).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx vitest run netlify/functions/_shared/validation.test.js`
Expected: FAIL — `KEY_REGEX` etc. are not exported; `key` still allowed.

- [ ] **Step 3: Implement in `validation.js`**

Replace the `ALLOWED_FIELDS` / `TYPES` entries and add the new exports. Final shape of the changed regions:

```js
export const ALLOWED_FIELDS = new Set([
  'tune_name', 'composer', 'lyricist', 'year', 'style', 'rank',
  'standard_key', 'alternate_keys', 'form', 'history_and_facts', 'famous_recordings',
  'chords', 'section_markers', 'youtube_video_ids',
  'youtube_backing_track_ids', 'spotify_playlist_id',
  'chord_progression_notes', 'curator_notes', 'validated',
  'is_approved', 'is_archived', 'last_updated',
]);

const TYPES = {
  tune_name: 'string', composer: 'string', lyricist: 'string',
  year: 'integer', style: 'string', rank: 'integer',
  standard_key: 'string', alternate_keys: 'array', form: 'string',
  history_and_facts: 'string',
  famous_recordings: 'array', chords: 'string',
  section_markers: 'array', youtube_video_ids: 'array',
  youtube_backing_track_ids: 'array', spotify_playlist_id: 'string',
  chord_progression_notes: 'string', curator_notes: 'string',
  validated: 'boolean',
  is_approved: 'boolean', is_archived: 'boolean', last_updated: 'string',
};

export const KEY_QUALITIES = ['major', 'minor', 'blues', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian'];
export const KEY_REGEX = /^[A-G][b#]? (major|minor|blues|dorian|mixolydian|lydian|phrygian|locrian)$/;
export const UNCONVENTIONAL_ROOTS = new Set(['A#', 'D#', 'B#', 'E#', 'Cb', 'Fb']);

export function parseKey(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(/^([A-G][b#]?) (major|minor|blues|dorian|mixolydian|lydian|phrygian|locrian)$/);
  return m ? { root: m[1], quality: m[2] } : null;
}

export function validateStandardKey(value) {
  const errors = [];
  const warnings = [];
  if (typeof value !== 'string') {
    errors.push('standard_key must be a string');
    return { errors, warnings };
  }
  if (value === '') return { errors, warnings };
  const parsed = parseKey(value);
  if (!parsed) {
    errors.push(`standard_key "${value}" must be "<root> <quality>", e.g. "C major", "F blues", "D dorian" (qualities: ${KEY_QUALITIES.join(', ')})`);
    return { errors, warnings };
  }
  if (UNCONVENTIONAL_ROOTS.has(parsed.root)) {
    warnings.push(`standard_key root "${parsed.root}" is unconventional — prefer its enharmonic equivalent`);
  }
  return { errors, warnings };
}

export function validateAlternateKeys(value, standardKey) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(value)) {
    errors.push('alternate_keys must be an array');
    return { errors, warnings };
  }
  const seen = new Set();
  value.forEach((entry, i) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`alternate_keys[${i}] must be an object with key and context`);
      return;
    }
    const extra = Object.keys(entry).filter((k) => k !== 'key' && k !== 'context');
    if (extra.length > 0) {
      errors.push(`alternate_keys[${i}] has unknown properties: ${extra.join(', ')}`);
    }
    const parsed = typeof entry.key === 'string' ? parseKey(entry.key) : null;
    if (!parsed) {
      errors.push(`alternate_keys[${i}].key "${entry.key}" must match the canonical key format`);
    } else if (UNCONVENTIONAL_ROOTS.has(parsed.root)) {
      warnings.push(`alternate_keys[${i}].key root "${parsed.root}" is unconventional — prefer its enharmonic equivalent`);
    }
    if (typeof entry.context !== 'string' || entry.context.trim() === '') {
      errors.push(`alternate_keys[${i}].context must be a non-empty string`);
    }
    const sig = `${entry.key} ${entry.context}`;
    if (seen.has(sig)) {
      errors.push(`alternate_keys[${i}] duplicates an earlier entry ("${entry.key}")`);
    }
    seen.add(sig);
    if (typeof standardKey === 'string' && standardKey !== '' && entry.key === standardKey) {
      warnings.push(`alternate_keys[${i}].key equals standard_key — ensure the context explains why it is listed`);
    }
  });
  return { errors, warnings };
}
```

Then wire into `validateTuneUpdate` — after the existing `for` loop over entries, before the `return`:

```js
  if ('standard_key' in sanitized) {
    const r = validateStandardKey(sanitized.standard_key);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  if ('alternate_keys' in sanitized) {
    const r = validateAlternateKeys(sanitized.alternate_keys, sanitized.standard_key);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx vitest run netlify/functions/_shared/validation.test.js`
Expected: PASS (the pre-existing 6 tests must also still pass — none of them touch `key` or `standard_key` formats).

- [ ] **Step 5: Commit**

```bash
git add app/netlify/functions/_shared/validation.js app/netlify/functions/_shared/validation.test.js
git commit -m "feat(schema): canonical standard_key format + alternate_keys field, drop key"
```

---

### Task 2: Harden `validateNewTune` + sanitize `create-tune.js`

**Files:**
- Modify: `app/netlify/functions/_shared/validation.js` (the `validateNewTune` function, currently lines 52-60)
- Modify: `app/netlify/functions/create-tune.js:21-42`
- Test: `app/netlify/functions/_shared/validation.test.js`

**Interfaces:**
- Consumes: `validateTuneUpdate` from Task 1.
- Produces: `validateNewTune(tune) → { valid, errors, warnings, sanitized }` — same result shape as `validateTuneUpdate` (it previously returned only `{ valid, errors }`; `create-tune.js` is the only caller and is updated in this task).

- [ ] **Step 1: Write the failing tests**

Append to `validation.test.js`:

```js
describe('validateNewTune', () => {
  it('still requires tune_name and composer', () => {
    expect(validateNewTune({ composer: 'X' }).valid).toBe(false);
    expect(validateNewTune({ tune_name: 'X' }).valid).toBe(false);
  });

  it('rejects a new tune with a narrative standard_key', () => {
    const r = validateNewTune({ tune_name: 'T', composer: 'C', standard_key: 'F major (vocal)' });
    expect(r.valid).toBe(false);
  });

  it('sanitizes: strips unknown fields and returns typed fields', () => {
    const r = validateNewTune({ tune_name: 'T', composer: 'C', standard_key: 'F blues', bogus: 1 });
    expect(r.valid).toBe(true);
    expect(r.sanitized).toEqual({ tune_name: 'T', composer: 'C', standard_key: 'F blues' });
    expect(r.warnings).toContain("unknown field 'bogus' stripped");
  });

  it('validates alternate_keys on create', () => {
    const r = validateNewTune({
      tune_name: 'T', composer: 'C',
      alternate_keys: [{ key: 'garbage', context: '' }],
    });
    expect(r.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx vitest run netlify/functions/_shared/validation.test.js`
Expected: FAIL — `validateNewTune` currently ignores everything but name/composer and has no `sanitized`.

- [ ] **Step 3: Implement**

Replace `validateNewTune` entirely:

```js
export function validateNewTune(tune) {
  if (!tune || typeof tune !== 'object') {
    return { valid: false, errors: ['tune object is required'], warnings: [], sanitized: null };
  }
  const required = [];
  if (!tune.tune_name || typeof tune.tune_name !== 'string') required.push('tune_name is required');
  if (!tune.composer || typeof tune.composer !== 'string') required.push('composer is required');
  if (required.length > 0) {
    return { valid: false, errors: required, warnings: [], sanitized: null };
  }
  return validateTuneUpdate(tune);
}
```

(Note: `validateTuneUpdate` rejects an `id` property — correct for creates too, since the server generates the id.)

In `create-tune.js`, change the tune construction (currently `...tune` raw spread at line 37) to use the sanitized copy, and give every new tune the `alternate_keys` default:

```js
  const newTune = {
    id: generateId(),
    alternate_keys: [],
    ...validation.sanitized,
    is_approved: false,
    is_archived: false,
    last_updated: new Date().toISOString(),
  };
```

- [ ] **Step 4: Run tests + lint**

Run: `cd app && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/netlify/functions/_shared/validation.js app/netlify/functions/_shared/validation.test.js app/netlify/functions/create-tune.js
git commit -m "feat(schema): validateNewTune runs full field validation; create-tune uses sanitized payload"
```

---

### Task 3: Migration script — Phase A transforms, worklist, verify

**Files:**
- Create: `scripts/migrate-standard-key.mjs`
- Test: `scripts/migrate-standard-key.test.mjs`

**Interfaces:**
- Consumes: `KEY_REGEX`, `validateStandardKey`, `validateAlternateKeys`, `ALLOWED_FIELDS` from `app/netlify/functions/_shared/validation.js` (works under plain `node` because `app/package.json` has `"type": "module"` — verified).
- Produces (pure functions, all exported for tests and later tasks):
  - `normalizeSpelledOut(value: string) → string | null` — `"E-flat major"` → `"Eb major"`, else `null`
  - `phaseATransform(tune: object) → { tune: object, changed: string[] }` — pure, returns a copy
  - `buildWorklist(tunes: object[]) → { id, tune_name, standard_key }[]`
  - `verifyAll(tunes: object[]) → { ok: boolean, problems: { id, tune_name, errors: string[] }[] }`
  - CLI modes (from repo root): `node scripts/migrate-standard-key.mjs --phase-a | --worklist | --verify`

- [ ] **Step 1: Write the failing tests**

Create `scripts/migrate-standard-key.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSpelledOut, phaseATransform, buildWorklist, verifyAll,
} from './migrate-standard-key.mjs';

test('normalizeSpelledOut rewrites spelled-out accidentals', () => {
  assert.equal(normalizeSpelledOut('E-flat major'), 'Eb major');
  assert.equal(normalizeSpelledOut('B-flat major'), 'Bb major');
  assert.equal(normalizeSpelledOut('F-sharp minor'), 'F# minor');
  assert.equal(normalizeSpelledOut('Eb major'), null);
  assert.equal(normalizeSpelledOut('F major (vocal)'), null);
});

test('phaseATransform: clean key untouched, key/backing_tracks removed, alternate_keys added', () => {
  const { tune, changed } = phaseATransform({
    id: 'a', tune_name: 'X', standard_key: 'Bb major', key: 'Bb', backing_tracks: [],
  });
  assert.equal(tune.standard_key, 'Bb major');
  assert.equal('key' in tune, false);
  assert.equal('backing_tracks' in tune, false);
  assert.deepEqual(tune.alternate_keys, []);
  assert.equal(changed.length, 3);
});

test('phaseATransform rewrites spelled-out keys', () => {
  const { tune } = phaseATransform({ id: 'a', standard_key: 'E-flat major' });
  assert.equal(tune.standard_key, 'Eb major');
});

test('phaseATransform leaves narrative keys for Phase B', () => {
  const narrative = 'Ab major (concert); also C or F';
  const { tune } = phaseATransform({ id: 'a', standard_key: narrative });
  assert.equal(tune.standard_key, narrative);
});

test('phaseATransform does not mutate its input and never touches last_updated', () => {
  const input = { id: 'a', standard_key: 'C major', key: 'C', last_updated: 'T0' };
  const { tune } = phaseATransform(input);
  assert.equal(input.key, 'C');
  assert.equal(tune.last_updated, 'T0');
});

test('buildWorklist lists only non-empty non-conforming keys', () => {
  const tunes = [
    { id: '1', tune_name: 'Clean', standard_key: 'C major' },
    { id: '2', tune_name: 'Empty', standard_key: '' },
    { id: '3', tune_name: 'Narrative', standard_key: 'C major; also D' },
  ];
  assert.deepEqual(buildWorklist(tunes), [
    { id: '3', tune_name: 'Narrative', standard_key: 'C major; also D' },
  ]);
});

test('verifyAll flags bad keys, bad alternates, and leftover unknown fields', () => {
  const good = { id: '1', tune_name: 'A', standard_key: 'C major', alternate_keys: [] };
  const badKey = { id: '2', tune_name: 'B', standard_key: 'C maj', alternate_keys: [] };
  const leftover = { id: '3', tune_name: 'C', standard_key: '', alternate_keys: [], key: 'F' };
  const noAlt = { id: '4', tune_name: 'D', standard_key: 'C major' };
  assert.equal(verifyAll([good]).ok, true);
  const r = verifyAll([good, badKey, leftover, noAlt]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems.map((p) => p.id).sort(), ['2', '3', '4']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `scripts/migrate-standard-key.mjs`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KEY_REGEX, validateStandardKey, validateAlternateKeys, ALLOWED_FIELDS,
} from '../app/netlify/functions/_shared/validation.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'data', 'jazz-tunes.json');
const MIGRATIONS_DIR = path.join(ROOT, 'docs', 'superpowers', 'migrations');
const WORKLIST_PATH = path.join(MIGRATIONS_DIR, '2026-08-22-standard-key-worklist.json');
const PATCH_PATH = path.join(MIGRATIONS_DIR, '2026-08-22-standard-key-split.patch.json');

const SPELLED = /^([A-G])-(flat|sharp) (major|minor)$/;

export function normalizeSpelledOut(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(SPELLED);
  if (!m) return null;
  return `${m[1]}${m[2] === 'flat' ? 'b' : '#'} ${m[3]}`;
}

export function phaseATransform(tune) {
  const t = { ...tune };
  const changed = [];
  if ('key' in t) {
    delete t.key;
    changed.push('removed key');
  }
  if ('backing_tracks' in t) {
    delete t.backing_tracks;
    changed.push('removed backing_tracks');
  }
  if (!Array.isArray(t.alternate_keys)) {
    t.alternate_keys = [];
    changed.push('added alternate_keys');
  }
  const normalized = normalizeSpelledOut(t.standard_key ?? '');
  if (normalized) {
    changed.push(`standard_key "${t.standard_key}" -> "${normalized}"`);
    t.standard_key = normalized;
  }
  return { tune: t, changed };
}

export function buildWorklist(tunes) {
  return tunes
    .filter((t) => t.standard_key && !KEY_REGEX.test(t.standard_key))
    .map((t) => ({ id: t.id, tune_name: t.tune_name, standard_key: t.standard_key }));
}

export function verifyAll(tunes) {
  const problems = [];
  for (const t of tunes) {
    const errors = [];
    for (const field of Object.keys(t)) {
      if (field !== 'id' && !ALLOWED_FIELDS.has(field)) {
        errors.push(`unknown field '${field}' present`);
      }
    }
    if (!Array.isArray(t.alternate_keys)) {
      errors.push('alternate_keys missing or not an array');
    } else {
      errors.push(...validateAlternateKeys(t.alternate_keys, t.standard_key).errors);
    }
    errors.push(...validateStandardKey(t.standard_key ?? '').errors);
    if (errors.length > 0) problems.push({ id: t.id, tune_name: t.tune_name, errors });
  }
  return { ok: problems.length === 0, problems };
}

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return { tunes: JSON.parse(raw), trailing: raw.endsWith('\n') ? '\n' : '' };
}

function saveData(tunes, trailing) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(tunes, null, 2) + trailing);
}

function main() {
  const mode = process.argv[2];
  const { tunes, trailing } = loadData();

  if (mode === '--phase-a') {
    let touched = 0;
    const out = tunes.map((t) => {
      const { tune, changed } = phaseATransform(t);
      if (changed.length > 0) {
        touched += 1;
        console.log(`${t.tune_name}: ${changed.join('; ')}`);
      }
      return tune;
    });
    saveData(out, trailing);
    console.log(`Phase A: ${touched}/${tunes.length} records changed.`);
  } else if (mode === '--worklist') {
    const wl = buildWorklist(tunes);
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    fs.writeFileSync(WORKLIST_PATH, JSON.stringify(wl, null, 2) + '\n');
    console.log(`Worklist: ${wl.length} tunes -> ${WORKLIST_PATH}`);
  } else if (mode === '--verify') {
    const r = verifyAll(tunes);
    if (r.ok) {
      console.log(`Verify: all ${tunes.length} records conform.`);
    } else {
      console.error(`Verify FAILED: ${r.problems.length} records do not conform:`);
      for (const p of r.problems) console.error(`  ${p.id} ${p.tune_name}: ${p.errors.join(' | ')}`);
      process.exitCode = 1;
    }
  } else if (mode === '--build-patch' || mode === '--apply') {
    runPatchMode(mode, tunes, trailing); // implemented in Task 5
  } else {
    console.error('Usage: node scripts/migrate-standard-key.mjs --phase-a|--worklist|--build-patch|--apply|--verify');
    process.exitCode = 1;
  }
}

function runPatchMode() {
  throw new Error('implemented in Task 5');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-standard-key.mjs scripts/migrate-standard-key.test.mjs
git commit -m "feat(migration): standard_key Phase A transforms, worklist, verify modes"
```

---

### Task 4: Run Phase A against the real data

**Files:**
- Modify: `data/jazz-tunes.json` (via the script — never hand-edit in this task)

**Interfaces:**
- Consumes: `--phase-a` CLI from Task 3.
- Produces: data file where every record has `alternate_keys`, none has `key` or `backing_tracks`, and 21 spelled-out keys are rewritten. Expected post-state: 133 records match `KEY_REGEX` (112 previously clean + 21 rewrites), 233 remain non-conforming for Phase B, 160 empty.

- [ ] **Step 1: Sync with main**

```bash
git pull --rebase origin main
```
(The live web editor commits to `main`; CLAUDE.md requires this before touching the JSON. If new commits arrive, re-run `node --test scripts/` after.)

- [ ] **Step 2: Run Phase A**

```bash
node scripts/migrate-standard-key.mjs --phase-a
```
Expected output ends with `Phase A: 526/526 records changed.` (every record at minimum gains `alternate_keys` and loses `key`).

- [ ] **Step 3: Sanity-check the diff**

```bash
git diff --numstat data/jazz-tunes.json
python3 -c "
import json, re
d = json.load(open('data/jazz-tunes.json'))
assert len(d) == 526, len(d)
assert all('key' not in t for t in d)
assert all('backing_tracks' not in t for t in d)
assert all(isinstance(t.get('alternate_keys'), list) for t in d)
clean = re.compile(r'^[A-G][b#]? (major|minor|blues|dorian|mixolydian|lydian|phrygian|locrian)\$')
print('conforming:', sum(1 for t in d if t.get('standard_key') and clean.match(t['standard_key'])))
print('remaining for Phase B:', sum(1 for t in d if t.get('standard_key') and not clean.match(t['standard_key'])))
"
```
Expected: `conforming: 133`, `remaining for Phase B: 233`. If the `git diff` shows the entire file rewritten (whitespace churn), the serialization didn't match — fix `saveData` before committing.

- [ ] **Step 4: Commit and push**

```bash
git add data/jazz-tunes.json
git commit -m "data: standard_key migration Phase A — drop key/backing_tracks, add alternate_keys, normalize spelled-out keys"
```
(Do not push to `main` — stay on the `standard-key-split` branch.)

---

### Task 5: Patch tooling — `--build-patch` and `--apply`

**Files:**
- Modify: `scripts/migrate-standard-key.mjs`
- Test: `scripts/migrate-standard-key.test.mjs`

**Interfaces:**
- Consumes: Task 3 exports; agent output files (Task 6) at `docs/superpowers/migrations/agent-output-*.json`, each a JSON array of:
  ```json
  { "id": "<tune id>", "standard_key": "F major",
    "alternate_keys": [{ "key": "G major", "context": "also commonly called" }],
    "curator_notes_append": null }
  ```
- Produces:
  - `buildPatch(tunes, worklist, agentEntries) → { patch: entry[], errors: string[] }` where each patch entry is `{ id, tune_name, before: { standard_key }, after: { standard_key, alternate_keys, curator_notes_append } }`
  - `applyPatch(tunes, patch) → { tunes: object[], applied: number, drifted: string[] }` — pure; drift = current `standard_key` no longer equals `before.standard_key` (the web app edited it mid-flight); drifted entries are skipped and reported.
  - CLI: `--build-patch` reads worklist + agent outputs, writes `PATCH_PATH`, exits 1 if any entry fails validation or any worklist id is missing. `--apply` reads `PATCH_PATH`, applies, saves, exits 1 listing drifted ids if any.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/migrate-standard-key.test.mjs`:

```js
import { buildPatch, applyPatch } from './migrate-standard-key.mjs';

const worklist = [{ id: 'w1', tune_name: 'Tune One', standard_key: 'C major; also D major (vocal)' }];
const tunes = [{ id: 'w1', tune_name: 'Tune One', standard_key: 'C major; also D major (vocal)', alternate_keys: [], curator_notes: 'existing.' }];
const agentEntry = {
  id: 'w1', standard_key: 'C major',
  alternate_keys: [{ key: 'D major', context: 'vocal' }],
  curator_notes_append: null,
};

test('buildPatch produces validated entries with before/after', () => {
  const { patch, errors } = buildPatch(tunes, worklist, [agentEntry]);
  assert.deepEqual(errors, []);
  assert.equal(patch.length, 1);
  assert.equal(patch[0].before.standard_key, 'C major; also D major (vocal)');
  assert.equal(patch[0].after.standard_key, 'C major');
});

test('buildPatch rejects non-conforming agent output', () => {
  const bad = { ...agentEntry, standard_key: 'C major (concert)' };
  const { errors } = buildPatch(tunes, worklist, [bad]);
  assert.equal(errors.length > 0, true);
});

test('buildPatch reports worklist ids with no agent entry', () => {
  const { errors } = buildPatch(tunes, worklist, []);
  assert.equal(errors.length > 0, true);
});

test('applyPatch applies after-state and appends curator notes', () => {
  const { patch } = buildPatch(tunes, worklist, [{ ...agentEntry, curator_notes_append: 'Key note.' }]);
  const r = applyPatch(tunes, patch);
  assert.equal(r.applied, 1);
  assert.deepEqual(r.drifted, []);
  const t = r.tunes.find((x) => x.id === 'w1');
  assert.equal(t.standard_key, 'C major');
  assert.deepEqual(t.alternate_keys, [{ key: 'D major', context: 'vocal' }]);
  assert.equal(t.curator_notes, 'existing.\n\nKey note.');
});

test('applyPatch skips and reports drifted records without mutating them', () => {
  const { patch } = buildPatch(tunes, worklist, [agentEntry]);
  const driftedTunes = [{ ...tunes[0], standard_key: 'edited meanwhile' }];
  const r = applyPatch(driftedTunes, patch);
  assert.equal(r.applied, 0);
  assert.deepEqual(r.drifted, ['w1']);
  assert.equal(r.tunes[0].standard_key, 'edited meanwhile');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/`
Expected: FAIL — `buildPatch`/`applyPatch` not exported.

- [ ] **Step 3: Implement**

Add to `scripts/migrate-standard-key.mjs` (and replace the Task 3 `runPatchMode` stub):

```js
export function buildPatch(tunes, worklist, agentEntries) {
  const errors = [];
  const byId = new Map(agentEntries.map((e) => [e.id, e]));
  const tuneById = new Map(tunes.map((t) => [t.id, t]));
  const patch = [];
  for (const w of worklist) {
    const entry = byId.get(w.id);
    if (!entry) {
      errors.push(`no agent output for ${w.id} (${w.tune_name})`);
      continue;
    }
    const skErrors = validateStandardKey(entry.standard_key ?? '').errors;
    const akErrors = validateAlternateKeys(entry.alternate_keys, entry.standard_key).errors;
    if (entry.curator_notes_append != null && typeof entry.curator_notes_append !== 'string') {
      errors.push(`${w.id}: curator_notes_append must be a string or null`);
    }
    if (skErrors.length > 0 || akErrors.length > 0) {
      errors.push(`${w.id} (${w.tune_name}): ${[...skErrors, ...akErrors].join(' | ')}`);
      continue;
    }
    patch.push({
      id: w.id,
      tune_name: w.tune_name,
      before: { standard_key: tuneById.get(w.id)?.standard_key ?? w.standard_key },
      after: {
        standard_key: entry.standard_key,
        alternate_keys: entry.alternate_keys,
        curator_notes_append: entry.curator_notes_append ?? null,
      },
    });
  }
  for (const e of agentEntries) {
    if (!worklist.some((w) => w.id === e.id)) errors.push(`agent output for unknown id ${e.id}`);
  }
  return { patch, errors };
}

export function applyPatch(tunes, patch) {
  const byId = new Map(patch.map((p) => [p.id, p]));
  const drifted = [];
  let applied = 0;
  const out = tunes.map((t) => {
    const p = byId.get(t.id);
    if (!p) return t;
    if (t.standard_key !== p.before.standard_key) {
      drifted.push(t.id);
      return t;
    }
    applied += 1;
    const next = { ...t, standard_key: p.after.standard_key, alternate_keys: p.after.alternate_keys };
    if (p.after.curator_notes_append) {
      next.curator_notes = t.curator_notes
        ? `${t.curator_notes}\n\n${p.after.curator_notes_append}`
        : p.after.curator_notes_append;
    }
    return next;
  });
  return { tunes: out, applied, drifted };
}
```

Replace the `runPatchMode` stub with the real CLI wiring:

```js
function runPatchMode(mode, tunes, trailing) {
  if (mode === '--build-patch') {
    const worklist = JSON.parse(fs.readFileSync(WORKLIST_PATH, 'utf8'));
    const agentEntries = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => /^agent-output-.*\.json$/.test(f))
      .flatMap((f) => JSON.parse(fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8')));
    const { patch, errors } = buildPatch(tunes, worklist, agentEntries);
    if (errors.length > 0) {
      console.error(`build-patch: ${errors.length} problems:`);
      for (const e of errors) console.error(`  ${e}`);
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(PATCH_PATH, JSON.stringify(patch, null, 2) + '\n');
    console.log(`Patch: ${patch.length} entries -> ${PATCH_PATH}`);
  } else {
    const patch = JSON.parse(fs.readFileSync(PATCH_PATH, 'utf8'));
    const r = applyPatch(tunes, patch);
    saveData(r.tunes, trailing);
    console.log(`Applied ${r.applied}/${patch.length} patch entries.`);
    if (r.drifted.length > 0) {
      console.error(`DRIFTED (skipped, re-run Phase B for these): ${r.drifted.join(', ')}`);
      process.exitCode = 1;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-standard-key.mjs scripts/migrate-standard-key.test.mjs
git commit -m "feat(migration): build-patch and apply modes with drift guard"
```

---

### Task 6: Phase B — agent parsing into the patch file, then HUMAN REVIEW

**Files:**
- Generate: `docs/superpowers/migrations/2026-08-22-standard-key-worklist.json`
- Generate: `docs/superpowers/migrations/agent-output-<n>.json` (one per batch)
- Generate: `docs/superpowers/migrations/2026-08-22-standard-key-split.patch.json`

**Interfaces:**
- Consumes: `--worklist` and `--build-patch` CLI modes.
- Produces: the reviewed patch file for Task 7.

**Note for the executor:** this task is agent orchestration, not code. Dispatch subagents over worklist batches of ~15 tunes. Each subagent gets the prompt below plus its batch of `{id, tune_name, standard_key}` objects. Expect ~16 batches for 233 tunes.

- [ ] **Step 1: Generate the worklist**

```bash
node scripts/migrate-standard-key.mjs --worklist
```
Expected: `Worklist: 233 tunes -> docs/superpowers/migrations/2026-08-22-standard-key-worklist.json`

- [ ] **Step 2: Dispatch parse subagents**

Use this prompt verbatim for each batch (append the batch JSON):

> You are parsing jazz tune key descriptions into a strict schema. For each tune below, the `standard_key` string mixes a canonical key with narrative about alternate keys. Emit a JSON array, one object per tune:
> `{ "id": "<copy the id exactly>", "standard_key": "<canonical>", "alternate_keys": [{"key": "<canonical>", "context": "<short reason>"}], "curator_notes_append": "<string or null>" }`
>
> Rules:
> 1. Canonical key format is exactly `<root> <quality>` where root is A-G with optional `b`/`#`, and quality is one of: major, minor, blues, dorian, mixolydian, lydian, phrygian, locrian. Lowercase qualities. Examples: "C major", "Eb minor", "F blues", "D dorian".
> 2. The primary `standard_key` is the most common concert-pitch instrumental/bandstand call key per the narrative. Phrases like "(concert)", "(instrumental call key)", "most common on bandstands" mark the primary.
> 3. A bare root like "F" on a blues head (12-bar blues form, Parker/Monk blues, etc.) means `"F blues"`. A bare root on a non-blues tune means its conventional major or minor key — use your jazz knowledge, and note low confidence in curator_notes_append if unsure.
> 4. Every other key mentioned becomes an alternate_keys entry with a SHORT context (a few words): "common vocal call key", "Getz/Gilberto recording", "earlier fake books", etc. Keep the reason from the narrative; do not invent reasons.
> 5. If the tune genuinely has no single canonical key (the narrative says so), use `"standard_key": ""` and put every mentioned key in alternate_keys.
> 6. Narrative content that does not fit key+context (history, performance practice) goes into curator_notes_append as one or two sentences. Otherwise set curator_notes_append to null. Never fabricate facts not present in the input.
> 7. Preferred enharmonic spellings: use Bb, Eb, Ab, Db, F#, C#, Gb as roots — never A#, D#, G#.
> 8. Output ONLY the JSON array, no commentary.

Save each batch's output as `docs/superpowers/migrations/agent-output-<n>.json`.

- [ ] **Step 3: Build the patch**

```bash
node scripts/migrate-standard-key.mjs --build-patch
```
Expected: `Patch: 233 entries -> …patch.json`. If it reports problems (missing ids, non-conforming output), re-dispatch just those tunes and re-run.

- [ ] **Step 4: Commit the artifacts, then STOP for human review**

```bash
git add docs/superpowers/migrations/
git commit -m "data: Phase B parse artifacts + patch file for standard_key split (pending review)"
```

**STOP. Do not proceed to Task 7.** Tell Trent: the patch file is ready for review at `docs/superpowers/migrations/2026-08-22-standard-key-split.patch.json` — each entry shows `before` (old narrative) and `after` (canonical + alternates). Spot-check especially: tunes with `""` primaries, `blues` assignments, and any `curator_notes_append`. Task 7 runs only after explicit approval.

---

### Task 7: Apply the reviewed patch + full verify

**Files:**
- Modify: `data/jazz-tunes.json` (via `--apply` only)

**Interfaces:**
- Consumes: approved patch file; `--apply` and `--verify` CLI modes.
- Produces: fully conforming data file — the precondition for shipping the strict validator (full-payload saves would otherwise brick editing of non-conforming tunes).

- [ ] **Step 1: Re-sync and apply**

```bash
git pull --rebase origin main
node scripts/migrate-standard-key.mjs --apply
```
Expected: `Applied 233/233 patch entries.` If any ids are reported DRIFTED (web-app edits landed since the patch was built), re-run Task 6 Steps 2-4 for just those ids, get re-approval on the delta, then `--apply` again.

- [ ] **Step 2: Full-file verification gate**

```bash
node scripts/migrate-standard-key.mjs --verify
```
Expected: `Verify: all 526 records conform.` This must pass — do not continue otherwise.

- [ ] **Step 3: Commit**

```bash
git add data/jazz-tunes.json
git commit -m "data: standard_key migration Phase B — canonical keys + alternate_keys applied"
```

---

### Task 8: Client-side validation catches format violations

**Files:**
- Modify: `app/src/routes/Editor/utils/validation.js` (the `validateTune` function, lines 131-178)

**Interfaces:**
- Consumes: `KEY_REGEX` from `../../../../netlify/functions/_shared/validation.js` (Vite bundles this plain-ESM module fine; it has no server-only imports).
- Produces: `validateTune` errors on non-canonical `standard_key` and malformed `alternate_keys`, mirroring the server so the editor never submits a doomed save.

- [ ] **Step 1: Add the import and checks**

Top of `app/src/routes/Editor/utils/validation.js`:

```js
import { KEY_REGEX, validateAlternateKeys } from '../../../../netlify/functions/_shared/validation.js';
```

Inside `validateTune`, replace the existing standard-key warning block (lines 154-157):

```js
  if (!tune.standard_key?.trim()) {
    warnings.push('Standard key is not set');
  } else if (!KEY_REGEX.test(tune.standard_key)) {
    errors.push('Standard key must be canonical, e.g. "C major", "F blues", "D dorian" — the server will reject this save');
  }

  const altErrors = validateAlternateKeys(tune.alternate_keys ?? [], tune.standard_key).errors;
  errors.push(...altErrors);
```

- [ ] **Step 2: Run lint + tests**

Run: `cd app && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/src/routes/Editor/utils/validation.js
git commit -m "feat(editor): client validateTune enforces canonical key format"
```

---

### Task 9: AlternateKeysEditor component + both editor forms

**Files:**
- Create: `app/src/routes/Editor/TuneEditor/AlternateKeysEditor.jsx`
- Modify: `app/src/routes/Editor/TuneEditor/BasicInfoForm.jsx` (Standard Key block, lines 99-111)
- Modify: `app/src/routes/EditorMobile.jsx` (after the Standard Key `FormField`, line 32)
- Test: `app/src/routes/Editor/TuneEditor/AlternateKeysEditor.test.jsx`

**Interfaces:**
- Consumes: `KEY_REGEX` from `../../../../netlify/functions/_shared/validation.js`.
- Produces: `<AlternateKeysEditor tuneId={string} value={array} onChange={(rows) => void} />`. **Contract:** `onChange` receives only COMPLETE rows (key matches `KEY_REGEX` AND context non-blank); incomplete rows live in component-local state so the debounced full-payload autosave never sends a half-typed row to the server (which would 400).

- [ ] **Step 1: Read the existing test setup**

Read `app/src/components/TuneList.test.jsx` and mirror its render/query helpers exactly (it is the project's canonical component-test style). The test code below assumes `@testing-library/react`; adapt imports to match what that file uses.

- [ ] **Step 2: Write the failing test**

`app/src/routes/Editor/TuneEditor/AlternateKeysEditor.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlternateKeysEditor } from './AlternateKeysEditor';

describe('AlternateKeysEditor', () => {
  it('renders existing entries', () => {
    render(<AlternateKeysEditor tuneId="t1" value={[{ key: 'C major', context: 'vocal' }]} onChange={() => {}} />);
    expect(screen.getByDisplayValue('C major')).toBeTruthy();
    expect(screen.getByDisplayValue('vocal')).toBeTruthy();
  });

  it('does not propagate incomplete rows', () => {
    const onChange = vi.fn();
    render(<AlternateKeysEditor tuneId="t1" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add alternate key'));
    fireEvent.change(screen.getByPlaceholderText('C major'), { target: { value: 'C' } });
    // 'C' fails KEY_REGEX and context is empty — nothing valid to save yet
    expect(onChange).not.toHaveBeenCalledWith([expect.objectContaining({ key: 'C' })]);
  });

  it('propagates a row once key and context are complete', () => {
    const onChange = vi.fn();
    render(<AlternateKeysEditor tuneId="t1" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add alternate key'));
    fireEvent.change(screen.getByPlaceholderText('C major'), { target: { value: 'C major' } });
    fireEvent.change(screen.getByPlaceholderText('why (e.g. common vocal call key)'), { target: { value: 'vocal' } });
    expect(onChange).toHaveBeenLastCalledWith([{ key: 'C major', context: 'vocal' }]);
  });

  it('removes a row', () => {
    const onChange = vi.fn();
    render(<AlternateKeysEditor tuneId="t1" value={[{ key: 'C major', context: 'vocal' }]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove alternate key 1'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd app && npx vitest run src/routes/Editor/TuneEditor/AlternateKeysEditor.test.jsx`
Expected: FAIL — component doesn't exist.

- [ ] **Step 4: Implement the component**

`app/src/routes/Editor/TuneEditor/AlternateKeysEditor.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { KEY_REGEX } from '../../../../netlify/functions/_shared/validation.js';

const rowComplete = (r) => KEY_REGEX.test(r.key) && r.context.trim() !== '';

export const AlternateKeysEditor = ({ tuneId, value, onChange }) => {
  const [rows, setRows] = useState(value || []);

  // Re-sync local state only when switching tunes — not on every save echo,
  // which would wipe half-typed rows.
  useEffect(() => {
    setRows(value || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuneId]);

  const emit = (next) => {
    setRows(next);
    onChange(next.filter(rowComplete));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Alternate Keys
      </label>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const keyBad = row.key !== '' && !KEY_REGEX.test(row.key);
          return (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={row.key}
                onChange={(e) => emit(rows.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue ${
                  keyBad ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="C major"
              />
              <input
                type="text"
                value={row.context}
                onChange={(e) => emit(rows.map((r, j) => (j === i ? { ...r, context: e.target.value } : r)))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue"
                placeholder="why (e.g. common vocal call key)"
              />
              <button
                type="button"
                aria-label={`Remove alternate key ${i + 1}`}
                onClick={() => emit(rows.filter((_, j) => j !== i))}
                className="px-2 py-2 text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => emit([...rows, { key: '', context: '' }])}
        className="mt-2 text-sm text-jazz-blue hover:underline"
      >
        + Add alternate key
      </button>
    </div>
  );
};
```

- [ ] **Step 5: Wire into BasicInfoForm**

In `BasicInfoForm.jsx`: add the import, upgrade the Standard Key input, and insert the editor after the Standard Key block (after line 111):

```jsx
import { KEY_REGEX } from '../../../../netlify/functions/_shared/validation.js';
import { AlternateKeysEditor } from './AlternateKeysEditor';
```

Replace the Standard Key block (lines 99-111) with:

```jsx
      {/* Standard Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Standard Key
        </label>
        <input
          type="text"
          value={tune.standard_key || ''}
          onChange={(e) => onChange('standard_key', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue ${
            tune.standard_key && !KEY_REGEX.test(tune.standard_key)
              ? 'border-red-400'
              : 'border-gray-300'
          }`}
          placeholder="C major / F blues / D dorian"
        />
        {tune.standard_key && !KEY_REGEX.test(tune.standard_key) && (
          <p className="mt-1 text-xs text-red-500">
            Format: root + quality, e.g. "C major", "F blues", "D dorian" — saves will be rejected otherwise
          </p>
        )}
      </div>

      {/* Alternate Keys */}
      <AlternateKeysEditor
        tuneId={tune.id}
        value={tune.alternate_keys}
        onChange={(rows) => onChange('alternate_keys', rows)}
      />
```

- [ ] **Step 6: Wire into EditorMobile**

In `EditorMobile.jsx`, import the component (path from `app/src/routes/`: `./Editor/TuneEditor/AlternateKeysEditor`) and add directly after the Standard Key `FormField` (line 32):

```jsx
          <AlternateKeysEditor
            tuneId={tune.id}
            value={tune.alternate_keys}
            onChange={(rows) => updateTune(tune.id, { alternate_keys: rows })}
          />
```

- [ ] **Step 7: Run tests + lint**

Run: `cd app && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/src/routes/Editor/TuneEditor/AlternateKeysEditor.jsx app/src/routes/Editor/TuneEditor/AlternateKeysEditor.test.jsx app/src/routes/Editor/TuneEditor/BasicInfoForm.jsx app/src/routes/EditorMobile.jsx
git commit -m "feat(editor): AlternateKeysEditor + canonical key input validation in both forms"
```

---

### Task 10: PreviewPanel — drop fake from-key, show alternates

**Files:**
- Modify: `app/src/routes/Editor/TuneEditor/PreviewPanel.jsx:7-21` and the tune-header block at lines 142-146

**Interfaces:**
- Consumes: `transposeProgression` (existing — for `'Bb instrument'`/`'Eb instrument'` targets its from-key argument is ignored; fixed +2/−3 offsets).
- Produces: no new exports. Per the header **Spec deviation** note: transpose stays enabled for keyless tunes.

- [ ] **Step 1: Simplify the transpose memo**

Replace lines 7-21:

```jsx
  const displayedChords = useMemo(() => {
    if (!tune.chords) return '';
    switch (transposeKey) {
      case 'Bb':
        return transposeProgression(tune.chords, null, 'Bb instrument');
      case 'Eb':
        return transposeProgression(tune.chords, null, 'Eb instrument');
      case 'concert':
      default:
        return tune.chords;
    }
  }, [tune.chords, transposeKey]);
```

(`getSemitoneDistance` returns fixed offsets for instrument targets before consulting its key map, so `null` is safe — verify by reading `app/src/routes/Editor/utils/chordUtils.js:122-134`.)

- [ ] **Step 2: Show alternate keys in the header**

After the existing Key block (lines 142-146), add:

```jsx
          {tune.alternate_keys?.length > 0 && (
            <div>
              <span className="font-medium">Also called in:</span>{' '}
              {tune.alternate_keys.map((a) => `${a.key} (${a.context})`).join('; ')}
            </div>
          )}
```

- [ ] **Step 3: Run lint + tests**

Run: `cd app && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/src/routes/Editor/TuneEditor/PreviewPanel.jsx
git commit -m "fix(editor): remove fake C-major from-key fallback; show alternate keys in preview header"
```

---

### Task 11: TuneBrowser key filter covers alternates

**Files:**
- Modify: `app/src/routes/Editor/TuneBrowser/TuneBrowser.jsx` — `keys` memo (lines 47-51), key filter (lines 74-77), and the filter-bar UI (locate the `<select>` bound to `filterKey`, below line 120)

**Interfaces:**
- Consumes: migrated tune shape (`standard_key` canonical, `alternate_keys` array).
- Produces: no exports. New state `includeAltKeys` (default `true`).

- [ ] **Step 1: Update state + memos + filter**

Add state next to `filterKey` (line 25):

```jsx
  const [includeAltKeys, setIncludeAltKeys] = useState(true);
```

Replace the `keys` memo (lines 47-51):

```jsx
  const keys = useMemo(() => {
    if (!tunes) return [];
    const all = new Set();
    tunes.forEach((t) => {
      if (t.standard_key) all.add(t.standard_key);
      (t.alternate_keys || []).forEach((a) => { if (a.key) all.add(a.key); });
    });
    return [...all].sort();
  }, [tunes]);
```

Replace the key filter (lines 74-77):

```jsx
    // Key filter
    if (filterKey !== 'all') {
      filtered = filtered.filter((tune) =>
        tune.standard_key === filterKey ||
        (includeAltKeys && (tune.alternate_keys || []).some((a) => a.key === filterKey))
      );
    }
```

Add `includeAltKeys` to the `filteredTunes` dependency array (line 113).

- [ ] **Step 2: Add the toggle to the filter bar**

Directly after the `<select>` bound to `filterKey`, add:

```jsx
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeAltKeys}
                onChange={(e) => setIncludeAltKeys(e.target.checked)}
              />
              incl. alternate keys
            </label>
```

- [ ] **Step 3: Run lint + tests, then behavioral check**

Run: `cd app && npm run lint && npm test`
Expected: PASS. Then verify against migrated data: filtering by a key that appears only as an alternate on some tune shows that tune with the box checked and hides it unchecked.

- [ ] **Step 4: Commit**

```bash
git add app/src/routes/Editor/TuneBrowser/TuneBrowser.jsx
git commit -m "feat(editor): key filter includes alternate keys with toggle"
```

---

### Task 12: Small displays — TuneCard, OverviewTab, Validation.jsx

**Files:**
- Modify: `app/src/components/TuneCard.jsx:13`
- Modify: `app/src/components/OverviewTab.jsx:14`
- Modify: `app/src/routes/Editor/TuneEditor/Validation.jsx:23`

**Interfaces:**
- Consumes: migrated tune shape. Produces: display only.

- [ ] **Step 1: TuneCard "+N" badge**

Line 13 currently renders the key span. Add after it, inside the same container:

```jsx
        {tune.alternate_keys?.length > 0 && (
          <span className="text-xs text-zinc-400" title={tune.alternate_keys.map((a) => a.key).join(', ')}>
            +{tune.alternate_keys.length}
          </span>
        )}
```

- [ ] **Step 2: OverviewTab StatCard**

Replace line 14:

```jsx
        {tune.standard_key && (
          <StatCard
            label="Key"
            value={`${tune.standard_key}${tune.alternate_keys?.length ? ` (+${tune.alternate_keys.length})` : ''}`}
          />
        )}
```

- [ ] **Step 3: Validation.jsx tune summary**

After the Standard Key line (line 23), add:

```
- Alternate Keys: ${(tune.alternate_keys || []).map((a) => `${a.key} (${a.context})`).join('; ') || '(none)'}
```

- [ ] **Step 4: Run lint + tests**

Run: `cd app && npm run lint && npm test`
Expected: PASS (existing `tabs.test.jsx` / `TuneList.test.jsx` fixtures use canonical keys and no `alternate_keys`; optional-chaining keeps them green).

- [ ] **Step 5: Commit**

```bash
git add app/src/components/TuneCard.jsx app/src/components/OverviewTab.jsx app/src/routes/Editor/TuneEditor/Validation.jsx
git commit -m "feat(app): surface alternate key counts in card, overview, and validation summary"
```

---

### Task 13: Final gates — full verify, re-sync with main, smoke test

**Files:** none created; this is verification + branch hygiene.

**Interfaces:** consumes everything above.

- [ ] **Step 1: Full test + verify sweep**

```bash
node --test scripts/
node scripts/migrate-standard-key.mjs --verify
cd app && npm run lint && npm test
```
Expected: all green; `Verify: all 526 records conform.`

- [ ] **Step 2: Re-sync with main and re-check data**

```bash
git fetch origin && git rebase origin/main
node scripts/migrate-standard-key.mjs --verify
```
If the rebase pulled in web-editor saves to `data/jazz-tunes.json` and verify now fails (a save re-introduced an old-shape value — unlikely but possible if made from a pre-cutover cached client): re-run `--phase-a`, and if narrative text came back on some tune, run Task 6 Steps 2-4 for just those ids with re-approval. Repeat this step until verify passes on top of current `main`.

- [ ] **Step 3: Browser smoke test**

Start the dev server (use `.claude/launch.json` / the preview tools, not Bash) and verify:

1. Reader `/` renders; a tune card shows its key badge (with "+N" where alternates exist).
2. Editor: open a formerly-narrative tune (e.g. Bye Bye Blackbird) — canonical key in the input, alternates in the repeater.
3. Type `C maj` into Standard Key — red border + hint appears; fix to `C major` — clears.
4. Transpose check on any tune: Concert/Bb/Eb buttons still work, including on a tune with empty `standard_key`.
5. Key filter: pick a key, toggle "incl. alternate keys", watch the list change.
6. Save a tune and confirm the network response is 200 with no validation errors.

- [ ] **Step 4: Hand off for merge**

Do NOT merge or push to `main` automatically. Report status to Trent and use the superpowers:finishing-a-development-branch skill to decide merge/PR. Remind: Netlify deploys on merge; app + data cut over together.

---

## Self-review checklist (for the plan author — completed)

- Spec coverage: schema (T1), validateNewTune + create (T2), migration A (T3-4), patch + B (T5-7), client validation (T8), editor UI (T9), PreviewPanel (T10), browser filter (T11), displays (T12), verify gate + rebase + smoke (T13). Spec's "disable transpose" superseded — documented as a spec deviation in the header.
- No placeholders: every step has runnable code or exact commands.
- Type consistency: `validateStandardKey`/`validateAlternateKeys` return `{errors, warnings}` everywhere; `validateNewTune` returns the `validateTuneUpdate` shape and its only caller is updated in the same task; `AlternateKeysEditor` props are `tuneId`/`value`/`onChange` in all three usage sites.
