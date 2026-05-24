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
