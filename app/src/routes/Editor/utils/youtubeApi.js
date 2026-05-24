// YouTube Data API v3 utilities

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Get video details by ID
export const getVideoDetails = async (videoId) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
        duration: video.contentDetails?.duration,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
};

// Get video details for multiple IDs
export const getMultipleVideoDetails = async (videoIds) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured');
    return [];
  }

  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  // YouTube API allows up to 50 IDs per request
  const ids = videoIds.slice(0, 50).join(',');
  
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items) {
      return data.items.map(video => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
        duration: video.contentDetails?.duration,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching video details:', error);
    return [];
  }
};

// Search YouTube videos
export const searchVideos = async (query, maxResults = 10) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items) {
      return data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};

// Check if API key is configured
export const isApiConfigured = () => {
  return !!YOUTUBE_API_KEY;
};

