import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSpelledOut, phaseATransform, buildWorklist, verifyAll, buildPatch, applyPatch,
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
