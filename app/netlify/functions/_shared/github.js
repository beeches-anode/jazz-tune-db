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
