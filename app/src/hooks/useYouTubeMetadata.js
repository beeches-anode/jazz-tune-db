import { useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export function useYouTubeMetadata() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(async (videoId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
      );
      const data = await res.json();
      const item = data.items?.[0]?.snippet;
      if (!item) throw new Error('Video not found');
      return {
        id: videoId,
        title: item.title,
        channelTitle: item.channelTitle,
        thumbnail: item.thumbnails?.medium?.url,
      };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchMetadata, loading, error };
}
