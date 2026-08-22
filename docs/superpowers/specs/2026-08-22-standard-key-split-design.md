# Design: Split `standard_key` into canonical key + structured `alternate_keys`

**Date:** 2026-08-22
**Status:** Approved pending final review
**Scope:** Schema, validation, one-shot data migration, app updates. Single-branch flag-day cutover.

## Problem

`standard_key` currently does two jobs: canonical key *and* narrative about alternate
keys, vocal vs. instrumental practice, era, and provenance. Examples from live data:

- `"Ab major (concert); also commonly performed by vocalists in C or F"`
- `"F major (instrumental call key); Db major (vocal-Getz/Gilberto version)"`

This makes the field unusable programmatically. Concretely broken today:

- **Transpose** ([PreviewPanel.jsx](../../../app/src/routes/Editor/TuneEditor/PreviewPanel.jsx))
  uses `tune.standard_key || 'C major'` as the from-key. Narrative values silently
  produce wrong transpositions; empty values silently pretend the tune is in C.
- **Key filter** ([TuneBrowser.jsx](../../../app/src/routes/Editor/TuneBrowser/TuneBrowser.jsx))
  builds its dropdown from raw `standard_key` strings, so narrative values appear as
  their own "keys".
- No way to query "all tunes commonly called in Bb" including alternates.

### Verified data inventory (2026-08-22, from `data/jazz-tunes.json`)

526 records, all active (zero archived). 366 have non-empty `standard_key`, 160 empty.
Of the 366 non-empty values:

| Category | Count | Migration handling |
|---|---|---|
| Already match the new canonical regex | 112 | Copy as-is (Phase A) |
| Spelled-out flats/sharps, e.g. `"E-flat major"` | 21 | Deterministic rewrite (Phase A) |
| Bare root, e.g. `"F"`, `"Bb"` — mostly blues heads | 23 | Agent pass (Phase B); blues heads become `"<root> blues"` |
| Genuine narrative | 210 | Agent pass (Phase B) |

The separate `key` field is vestigial: only 5 records have a value, all 5 redundant
with their own `standard_key`, and no app code reads it (all `.key` grep hits are
keyboard events). It has no editor input either — commit `6d4b99c` added it to the
server allowlist only because **the editor sends the full tune object on every
save**, so an un-allowlisted field in the payload triggered warnings.

That full-payload save behavior has a design consequence: once the strict validator
ships, any record still carrying a non-conforming `standard_key` becomes
**uneditable** — saving *any* field of that tune would 400. Migration completeness
is therefore a hard precondition for the cutover, enforced by a full-file
validation gate in the rollout (below). The benign side: a stale cached client
that still sends `key` post-cutover just gets the standard strip-with-warning.

### Relationship to `docs/handoff.md` backlog

This project **is backlog item B4** ("pick one as canonical; pull values across;
remove the other") — though B4's "most tunes have both" was stale; the real count
is 5. It also closes **B6** (loose `validateNewTune`) and sweeps up **B5** (orphan
`backing_tracks` field on Beautiful Love) since Phase A touches every record anyway.
Per the handoff's own triage protocol this passes: the friction is real
(transpose and key-filter are broken today, not theoretical).

## Goals

1. `standard_key` becomes strictly machine-readable: one canonical key per tune, or empty.
2. Alternate keys + their reasons become structured, queryable data.
3. Validation prevents narrative drift from ever coming back.
4. Remove the vestigial `key` field.

**Non-goals:** No changes to `curator_notes` (long-form lore stays there), no
`key_signature` field, no changes to chord/section data, no multi-user or API-contract
compatibility (single-user database, flag-day cutover is acceptable).

## Schema

### `standard_key` (modified semantics, same name, type `string`)

Empty string is valid and means "no single canonical key" (modulating heads, etc.) —
the explanation belongs in `alternate_keys` contexts or `curator_notes`.
Non-empty values must match exactly:

```
/^[A-G][b#]? (major|minor|blues|dorian|mixolydian|lydian|phrygian|locrian)$/
```

Examples: `"C major"`, `"Eb minor"`, `"F blues"`, `"D dorian"`, `""`.

Notes on the vocabulary:

- `blues` is a first-class quality. Blues heads (Now's the Time, Blue Monk, Bag's
  Groove, All Blues…) are neither major nor minor in any useful sense, and "all blues
  heads in F" is a core browsing category. Transpose treats it like any quality:
  shift the root, keep the label.
- Modes are lowercase (`dorian`, not `Dorian`) to match the existing `"C major"` /
  `"C minor"` casing convention.
- Aeolian/ionian are not in the vocabulary — use `minor`/`major`.

### `alternate_keys` (new field, type `array`)

Array of `{ key: string, context: string }` objects. Present on every record
(empty array when none) — matching the repo's all-fields-present convention.

- `key`: same regex as `standard_key`, but must be non-empty.
- `context`: free-form non-empty string explaining *why* this key is listed
  ("common vocal call key", "Getz/Gilberto recording", "Pat Martino Live! version").
  Deliberately not an enum — real-world reasons are too varied.

Example:

```json
{
  "standard_key": "Ab major",
  "alternate_keys": [
    { "key": "C major", "context": "common vocal call key" },
    { "key": "F major", "context": "common vocal call key" }
  ]
}
```

### `key` (removed)

Dropped from `ALLOWED_FIELDS` and `TYPES`; stripped from all 526 records during
migration. No promotion logic needed: only 5 records have a value and each is
redundant with its own `standard_key`. Future saves that include `key` get the
standard unknown-field strip + warning.

## Validation

All rules live in [app/netlify/functions/_shared/validation.js](../../../app/netlify/functions/_shared/validation.js),
which exports the key regex and helpers so the client-side validator
([app/src/routes/Editor/utils/validation.js](../../../app/src/routes/Editor/utils/validation.js))
imports them from one source — the two must not drift.

**Hard rejects (save returns 400):**

- Non-empty `standard_key` that does not match the canonical regex.
- `alternate_keys` that is not an array of `{key, context}` objects.
- Any alternate entry whose `key` is empty or fails the regex.
- Any alternate entry whose `context` is empty or not a string.
- Two entries in `alternate_keys` that are exact `{key, context}` duplicates of
  each other.

**Warnings (save succeeds, warning returned):**

- An alternate whose `key` equals `standard_key` (legal — the context explains why
  it's listed — but worth a nudge).
- Unconventional enharmonic roots: `A#`, `D#`, `B#`, `E#`, `Cb`, `Fb`. These pass
  the regex but fragment key-based browsing (a tune filed under "A# major" won't
  appear with the Bb tunes). Warning only, never reject — edge cases are legitimate.

**Both write paths are covered.** `validateTuneUpdate` *and* `validateNewTune` run
the field validators. Today `validateNewTune` checks only `tune_name`/`composer`,
which would let a brand-new tune bypass the format rules — that hole gets closed as
part of this change.

## Migration

One-shot, two-phase. Scripts live in repo-root `scripts/`; nothing mutates
`data/jazz-tunes.json` until the human-reviewed patch is applied. Operates on all
records (all 526 are active today; stated as "all" for future-proofing).
`last_updated` is **not** bumped — mass-bumping would destroy the field's
usefulness for recency.

### Phase A — deterministic (`scripts/migrate-standard-key.js`, mode `--phase-a`)

For every record:

1. If `standard_key` already matches the regex → keep as-is (112 records).
2. If it matches the spelled-out pattern (`"E-flat major"` → `"Eb major"`) →
   rewrite deterministically (21 records).
3. Add `alternate_keys: []` if absent.
4. Delete the `key` field.
5. Delete the orphan `backing_tracks` field (exists on one record, Beautiful Love —
   backlog B5).

Output: applied directly to the data file in its own commit (small, mechanical,
easy to review in the diff).

### Phase B — agent-assisted (`--phase-b`)

For each of the ~233 remaining non-conforming records (210 narrative + 23 bare-root),
a subagent receives the original string plus tune name and emits
`{ standard_key, alternate_keys }` conforming to the validator (the script
re-validates every emission and rejects non-conforming output back to the agent).
Bare-root blues heads become `"<root> blues"`; the few non-blues bare roots
(What's New?, Manteca, Hullo Bolinas…) get a proper `"<root> major"`/`"minor"` call.
Where narrative content doesn't fit a `{key, context}` pair, it is preserved by
appending to `curator_notes`, never silently dropped.

Output: a patch file at `docs/superpowers/migrations/2026-08-22-standard-key-split.patch.json`
with one entry per tune: `{ id, tune_name, before: {standard_key, key}, after:
{standard_key, alternate_keys} }`. **Trent reviews the patch diff before anything
is applied.** A separate `--apply` mode applies the reviewed patch to the data file.

### Migration tests

`scripts/migrate-standard-key.test.js` using `node:test` (run with
`node --test scripts/`) covers the Phase A rewrite rules and the patch-apply logic.
This is deliberately outside `cd app && npm test` — the app test suite guards the
schema; the migration test guards a one-shot script whose real safety net is the
human patch review.

## App changes

| File | Change |
|---|---|
| [PreviewPanel.jsx](../../../app/src/routes/Editor/TuneEditor/PreviewPanel.jsx) | Remove the `\|\| 'C major'` fallback. Parse via a shared `parseKey(s) → {root, quality} \| null` helper; transpose shifts the root and preserves the quality label. Empty/unparseable key → transpose controls disabled with a "no canonical key set" hint. |
| [TuneBrowser.jsx](../../../app/src/routes/Editor/TuneBrowser/TuneBrowser.jsx) | Key filter offers "primary key" and "any key (primary or alternates)" modes, built from a per-tune `Set` of canonical keys. |
| [TuneCard.jsx](../../../app/src/components/TuneCard.jsx), [OverviewTab.jsx](../../../app/src/components/OverviewTab.jsx) | Primary key display unchanged; show a small "+N" indicator when `alternate_keys.length > 0`. |
| [BasicInfoForm.jsx](../../../app/src/routes/Editor/TuneEditor/BasicInfoForm.jsx), [EditorMobile.jsx](../../../app/src/routes/EditorMobile.jsx) | `standard_key` input gains inline regex validation + format hint. New `AlternateKeysEditor` repeater component (add row, per-row key/context inputs, delete row) used by both. |
| [Validation.jsx](../../../app/src/routes/Editor/TuneEditor/Validation.jsx) | Include `alternate_keys` alongside `standard_key` in the tune summary it builds. |
| [utils/validation.js](../../../app/src/routes/Editor/utils/validation.js) | Import regex/helpers from the server `_shared` module; flag format violations, not just missing values. |

## Tests (schema)

In `app/netlify/functions/_shared/validation.test.js`:

- `standard_key`: accepts a representative sample of root × quality combinations
  (including `blues` and modes); accepts `""`; rejects narrative junk
  (`"C major (vocal)"`, `"C"`, `"Cmaj"`, `"various"`, `"E-flat major"`).
- `alternate_keys`: accepts well-formed arrays and `[]`; rejects non-arrays,
  missing/empty `key`, bad-format `key`, missing/empty `context`, exact duplicate
  entries.
- Warnings: alternate `key` equal to `standard_key`; unconventional enharmonic root.
- `key` field is stripped with a warning.
- `validateNewTune` enforces the same field rules as `validateTuneUpdate`.

## Rollout

Single feature branch, single PR, in this order:

1. `validation.js` + tests. `cd app && npm run lint && npm test` green.
2. Migration scripts + `node --test scripts/` green.
3. Phase A applied → commit (mechanical diff).
4. Phase B → patch file → **Trent reviews** → apply → commit.
5. **Full-file validation gate:** a script (`scripts/migrate-standard-key.js
   --verify`) runs every record through the new field validators and fails loudly
   on any non-conforming record. Required because full-payload saves make a
   non-conforming record uneditable (see Problem section). Must pass before merge.
6. App component updates → lint + tests green.
7. Manual smoke test: open one formerly-narrative tune and one clean tune in the
   editor; verify transpose on the clean tune; verify key filter; verify saving a
   bad key is rejected with a clear message.
8. **Rebase onto latest `main` immediately before merge and re-run steps 3–5.**
   The live web editor commits to `main`, so tunes may have been edited while the
   branch was in flight; the migration scripts are deterministic and re-runnable
   for exactly this reason. (This is the same concurrency reality behind backlog
   B12, handled here procedurally rather than in code.)
9. Merge to `main`; Netlify deploys app + data together.

Rollback story: everything is in git; `git revert` of the merge restores the old
schema and data consistently.

**Note on CLAUDE.md's "one tune per edit operation" rule:** that guideline exists
for routine edits. This migration intentionally touches all 526 records in Phase A
(field add/drop) and ~233 in Phase B; the patch file *is* the reviewable unit. The PR
description will say so explicitly.

## Decision log

| Decision | Choice | Alternatives considered |
|---|---|---|
| Canonical format | `"C major"` string | Compact (`"Cm"`), structured object, root-only field |
| Modal tunes | Modes by name; empty allowed for keyless | Force major/minor; `"various"` sentinel; free-form |
| Blues heads | `blues` as first-class quality | Map to major + context note |
| Alternate keys | Structured `[{key, context}]`, context free-form | Prose `key_notes`; hybrid |
| `key` field | Hard-remove | Soft-retire; repurpose |
| Migration | Agent parse → reviewed patch → apply | Regex+manual; pure manual; hybrid |
| Rollout | Lockstep single-branch cutover | Schema-first; app-first |
| Validator | Hard reject, warnings for soft issues | Warn-only; two-tier |
