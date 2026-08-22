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

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
