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
