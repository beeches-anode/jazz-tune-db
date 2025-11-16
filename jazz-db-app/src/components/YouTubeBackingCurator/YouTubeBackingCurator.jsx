import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { extractYouTubeId, generatePlaylistUrl } from '../../utils/validation';
import { getVideoDetails, getMultipleVideoDetails, searchVideos, isApiConfigured } from '../../utils/youtubeApi';
import ReactPlayer from 'react-player';

export const YouTubeBackingCurator = ({ videoIds, tuneName, onChange }) => {
  const [urlInput, setUrlInput] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(new Set());
  const [verifyingVideos, setVerifyingVideos] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [apiConfigured, setApiConfigured] = useState(false);

  useEffect(() => {
    setApiConfigured(isApiConfigured());
  }, []);

  // Fetch video titles when videos are added or component mounts
  useEffect(() => {
    const fetchTitles = async () => {
      if (!apiConfigured) return;

      const videosNeedingTitles = videoIds
        .map((video, index) => {
          const videoId = typeof video === 'string' ? video : video.id;
          const videoData = typeof video === 'string' ? { id: video } : video;
          return { index, videoId, videoData };
        })
        .filter(({ videoData }) => !videoData.title);

      if (videosNeedingTitles.length === 0) return;

      setLoadingVideos(new Set(videosNeedingTitles.map(v => v.videoId)));

      try {
        const videoIdsToFetch = videosNeedingTitles.map(v => v.videoId);
        const details = await getMultipleVideoDetails(videoIdsToFetch);

        const updated = [...videoIds];
        const validIds = new Set(details.map(d => d.id));
        
        details.forEach((detail) => {
          const videoIndex = videosNeedingTitles.findIndex(v => v.videoId === detail.id);
          if (videoIndex !== -1) {
            const { index } = videosNeedingTitles[videoIndex];
            const existingVideo = typeof updated[index] === 'string' 
              ? { id: updated[index] } 
              : updated[index];
            
            updated[index] = {
              ...existingVideo,
              title: detail.title,
              channelTitle: detail.channelTitle,
              verified: true,
            };
          }
        });

        videosNeedingTitles.forEach(({ index, videoId }) => {
          if (!validIds.has(videoId)) {
            const existingVideo = typeof updated[index] === 'string' 
              ? { id: updated[index] } 
              : updated[index];
            
            updated[index] = {
              ...existingVideo,
              verified: false,
            };
          }
        });

        onChange(updated);
      } catch (error) {
        console.error('Error fetching video titles:', error);
      } finally {
        setLoadingVideos(new Set());
      }
    };

    fetchTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIds.length, apiConfigured]);

  const handleAddVideo = async () => {
    const videoId = extractYouTubeId(urlInput);

    if (!videoId) {
      alert('Invalid YouTube URL or video ID');
      return;
    }

    const exists = videoIds.some(v => (typeof v === 'string' ? v : v.id) === videoId);
    if (exists) {
      alert('This video is already in the playlist');
      return;
    }

    const newVideo = {
      id: videoId,
      title: '',
      artist: '',
      verified: false,
      added_date: new Date().toISOString().split('T')[0],
    };

    if (apiConfigured) {
      setLoadingVideos(new Set([videoId]));
      try {
        const details = await getVideoDetails(videoId);
        if (details) {
          newVideo.title = details.title;
          newVideo.channelTitle = details.channelTitle;
          newVideo.verified = true;
        } else {
          newVideo.verified = false;
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
        newVideo.verified = false;
      } finally {
        setLoadingVideos(new Set());
      }
    }

    onChange([...videoIds, newVideo]);
    setUrlInput('');
  };

  const handleRemoveVideo = (index) => {
    if (window.confirm('Remove this backing track from the playlist?')) {
      const updated = videoIds.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(videoIds);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    onChange(items);
  };

  const handleUpdateVideo = (index, field, value) => {
    const updated = [...videoIds];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const playlistUrl = generatePlaylistUrl(videoIds);

  const handleCopyPlaylistUrl = () => {
    navigator.clipboard.writeText(playlistUrl);
    alert('Playlist URL copied to clipboard!');
  };

  const handleTestPlaylist = () => {
    window.open(playlistUrl, '_blank');
  };

  // Generate search query for backing tracks
  const generateBackingTrackSearchQuery = (additionalTerms = '') => {
    const baseQuery = `"${tuneName}" backing track`;
    return additionalTerms ? `${baseQuery} ${additionalTerms}` : baseQuery;
  };

  // Quick search buttons for common backing track searches
  const quickSearches = [
    { label: 'Backing Track', query: '' },
    { label: 'Play Along', query: 'play along' },
    { label: 'Karaoke', query: 'karaoke' },
    { label: 'Slow', query: 'slow' },
    { label: 'Fast', query: 'fast' },
    { label: 'Swing', query: 'swing' },
  ];

  // API-based quick search
  const handleQuickSearch = async (querySuffix) => {
    if (!apiConfigured) {
      const query = generateBackingTrackSearchQuery(querySuffix);
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
      return;
    }

    setIsSearching(true);
    try {
      const query = generateBackingTrackSearchQuery(querySuffix);
      const results = await searchVideos(query, 20);
      setSearchResults(results);
      setSearchQuery(query);
    } catch (error) {
      console.error('Error searching videos:', error);
      alert('Error searching YouTube. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // API-based custom search
  const handleSearchCustomApi = async () => {
    if (!searchQuery.trim()) return;

    if (!apiConfigured) {
      const query = generateBackingTrackSearchQuery(searchQuery);
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
      return;
    }

    setIsSearching(true);
    try {
      const query = generateBackingTrackSearchQuery(searchQuery);
      const results = await searchVideos(query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching videos:', error);
      alert('Error searching YouTube. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Add video from search results
  const handleAddFromSearch = async (video) => {
    const videoId = video.id;

    const exists = videoIds.some(v => (typeof v === 'string' ? v : v.id) === videoId);
    if (exists) {
      alert('This video is already in the playlist');
      return;
    }

    const newVideo = {
      id: videoId,
      title: video.title,
      artist: '',
      channelTitle: video.channelTitle,
      verified: true,
      added_date: new Date().toISOString().split('T')[0],
    };

    onChange([...videoIds, newVideo]);
  };

  // Verify all video links using YouTube API
  const handleVerifyAllLinks = async () => {
    if (!apiConfigured) {
      alert('YouTube API key not configured. Please add VITE_YOUTUBE_API_KEY to your .env file.');
      return;
    }

    if (videoIds.length === 0) {
      alert('No videos to verify');
      return;
    }

    setVerifyingVideos(true);
    const statusMap = {};

    try {
      const videoIdsToVerify = videoIds.map(v => typeof v === 'string' ? v : v.id);
      
      for (let i = 0; i < videoIdsToVerify.length; i += 50) {
        const batch = videoIdsToVerify.slice(i, i + 50);
        const details = await getMultipleVideoDetails(batch);
        
        const validIds = new Set(details.map(d => d.id));
        
        batch.forEach(videoId => {
          if (validIds.has(videoId)) {
            statusMap[videoId] = { valid: true };
          } else {
            statusMap[videoId] = { valid: false, error: 'Video not found or inaccessible' };
          }
        });
      }

      setVerificationStatus(statusMap);

      const updated = videoIds.map(video => {
        const videoId = typeof video === 'string' ? video : video.id;
        const status = statusMap[videoId];
        
        if (typeof video === 'string') {
          return {
            id: videoId,
            verified: status?.valid || false,
          };
        } else {
          return {
            ...video,
            verified: status?.valid || false,
          };
        }
      });

      onChange(updated);

      const validCount = Object.values(statusMap).filter(s => s.valid).length;
      const invalidCount = Object.values(statusMap).filter(s => !s.valid).length;
      
      if (invalidCount > 0) {
        alert(`Verification complete:\n✅ ${validCount} valid\n❌ ${invalidCount} invalid\n\nInvalid videos are marked in red.`);
      } else {
        alert(`✅ All ${validCount} videos are valid!`);
      }
    } catch (error) {
      console.error('Error verifying videos:', error);
      alert('Error verifying videos. Please try again.');
    } finally {
      setVerifyingVideos(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API status notice */}
      {!apiConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="font-medium text-amber-900 mb-1">⚠️ YouTube API not configured</div>
          <div className="text-amber-800 text-xs">
            To enable automatic video title fetching and API search, add VITE_YOUTUBE_API_KEY to your .env file.
            Get your API key from{' '}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">
              Google Cloud Console
            </a>.
          </div>
        </div>
      )}

      {/* Search section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">🔍 Search Backing Tracks</h3>
        
        {/* Quick search buttons */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-600 mb-2">Quick Search:</div>
          <div className="flex flex-wrap gap-2">
            {quickSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSearch(search.query)}
                disabled={isSearching}
                className="px-3 py-1.5 text-xs bg-white border border-green-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-colors text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {apiConfigured ? '🔍' : '🔗'} {search.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {apiConfigured 
              ? `Click any button above to search YouTube API for "${tuneName}" backing tracks`
              : `Click any button above to search YouTube for "${tuneName}" backing tracks`}
          </div>
        </div>

        {/* Custom search */}
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">Custom Search:</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearchCustomApi()}
              disabled={isSearching}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue text-sm disabled:opacity-50"
              placeholder={`Search for "${tuneName}" backing track + keywords...`}
            />
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSearchCustomApi}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : apiConfigured ? 'Search API' : 'Search YouTube'}
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {apiConfigured 
              ? 'Searches YouTube API and shows results below. Select videos to add to playlist.'
              : 'Searches will open in a new tab. Copy video URLs from results and paste below.'}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Search Results ({searchResults.length} videos)
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
              Clear
            </Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((video) => {
              const alreadyAdded = videoIds.some(v => {
                const existingId = typeof v === 'string' ? v : v.id;
                return existingId === video.id;
              });

              return (
                <div
                  key={video.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                      {video.title}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {video.channelTitle}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {video.id}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddFromSearch(video)}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? 'Added' : 'Add'}
                    </Button>
                    <button
                      onClick={() => setPreviewVideo(video.id)}
                      className="text-xs text-jazz-blue hover:underline"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add video section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Backing Track</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddVideo()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue text-sm"
            placeholder="Paste YouTube URL or video ID..."
          />
          <Button variant="primary" size="sm" onClick={handleAddVideo}>
            Add Video
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Supported formats: youtube.com/watch?v=ID, youtu.be/ID, or just the video ID
          {apiConfigured && ' (Title will be fetched automatically)'}
        </div>
      </div>

      {/* Current playlist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Current Playlist ({videoIds.length} backing tracks)
          </h3>
          {videoIds.length > 0 && (
            <div className="flex gap-2">
              {apiConfigured && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleVerifyAllLinks}
                  disabled={verifyingVideos}
                >
                  {verifyingVideos ? 'Verifying...' : '✓ Verify All Links'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleCopyPlaylistUrl}>
                📋 Copy URL
              </Button>
              <Button variant="secondary" size="sm" onClick={handleTestPlaylist}>
                Test Playlist
              </Button>
            </div>
          )}
        </div>

        {videoIds.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
            No backing tracks added yet. Paste a YouTube URL above or search for backing tracks to get started.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="videos">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {videoIds.map((video, index) => {
                    const videoId = typeof video === 'string' ? video : video.id;
                    const videoData = typeof video === 'string' ? { id: video } : video;
                    const isLoading = loadingVideos.has(videoId);
                    const verification = verificationStatus[videoId];
                    const isVerified = videoData.verified === true;
                    const isInvalid = verification && !verification.valid;

                    return (
                      <Draggable key={videoId} draggableId={videoId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white border rounded-lg p-3 ${
                              isInvalid 
                                ? 'border-red-300 bg-red-50' 
                                : isVerified 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-gray-200'
                            } ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                </svg>
                              </div>

                              <div className="font-bold text-gray-400 text-sm mt-1">
                                {index + 1}.
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={videoData.title || ''}
                                    onChange={(e) => handleUpdateVideo(index, 'title', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue"
                                    placeholder={isLoading ? 'Loading title...' : 'Backing track title'}
                                    disabled={isLoading}
                                  />
                                  <input
                                    type="text"
                                    value={videoData.artist || ''}
                                    onChange={(e) => handleUpdateVideo(index, 'artist', e.target.value)}
                                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue"
                                    placeholder="Channel/Artist"
                                  />
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  {videoId}
                                  {videoData.channelTitle && ` • ${videoData.channelTitle}`}
                                  {videoData.added_date && ` • Added: ${videoData.added_date}`}
                                  {isLoading && (
                                    <span className="ml-2 text-blue-600">⏳ Loading...</span>
                                  )}
                                  {isInvalid && (
                                    <span className="ml-2 text-red-600 font-medium">❌ Invalid Link</span>
                                  )}
                                  {isVerified && !isInvalid && (
                                    <span className="ml-2 text-green-600">✅ Verified</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => setPreviewVideo(videoId)}
                                  className="p-2 text-jazz-blue hover:bg-blue-50 rounded transition-colors"
                                  title="Preview"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleRemoveVideo(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Remove"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Preview modal */}
      <Modal
        isOpen={previewVideo !== null}
        onClose={() => setPreviewVideo(null)}
        title="Video Preview"
        size="lg"
      >
        {previewVideo && (
          <div className="aspect-video">
            <ReactPlayer
              url={`https://www.youtube.com/watch?v=${previewVideo}`}
              width="100%"
              height="100%"
              controls
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

