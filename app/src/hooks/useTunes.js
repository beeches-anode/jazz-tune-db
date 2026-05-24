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
