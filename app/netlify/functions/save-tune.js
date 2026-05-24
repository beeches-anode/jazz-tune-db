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
