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
