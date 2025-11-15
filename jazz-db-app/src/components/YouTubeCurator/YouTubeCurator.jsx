import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { extractYouTubeId, generatePlaylistUrl } from '../../utils/validation';
import ReactPlayer from 'react-player';

export const YouTubeCurator = ({ videoIds, tuneName, famousRecordings = [], onChange }) => {
  const [urlInput, setUrlInput] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddVideo = () => {
    const videoId = extractYouTubeId(urlInput);

    if (!videoId) {
      alert('Invalid YouTube URL or video ID');
      return;
    }

    // Check if already exists
    const exists = videoIds.some(v => (typeof v === 'string' ? v : v.id) === videoId);
    if (exists) {
      alert('This video is already in the playlist');
      return;
    }

    const newVideo = {
      id: videoId,
      title: '', // Could fetch from API
      artist: '',
      verified: false,
      added_date: new Date().toISOString().split('T')[0],
    };

    onChange([...videoIds, newVideo]);
    setUrlInput('');
  };

  const handleRemoveVideo = (index) => {
    if (window.confirm('Remove this video from the playlist?')) {
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

  // Generate YouTube search URL
  const generateSearchUrl = (query) => {
    const searchTerm = encodeURIComponent(query);
    return `https://www.youtube.com/results?search_query=${searchTerm}`;
  };

  // Generate search query from famous recording
  const generateRecordingSearchQuery = (recording) => {
    // Format: "Tune Name" + "Artist - Year"
    // Example: "Autumn Leaves" "Chet Baker - 1954"
    return `"${tuneName}" "${recording}"`;
  };

  const handleSearchRecording = (recording) => {
    const query = generateRecordingSearchQuery(recording);
    window.open(generateSearchUrl(query), '_blank');
  };

  const handleSearchCustom = () => {
    if (!searchQuery.trim()) return;
    const query = `"${tuneName}" ${searchQuery}`;
    window.open(generateSearchUrl(query), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">🔍 Search YouTube</h3>
        
        {/* Famous recordings quick search */}
        {famousRecordings.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-2">Search Famous Recordings:</div>
            <div className="flex flex-wrap gap-2">
              {famousRecordings.map((recording, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearchRecording(recording)}
                  className="px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors text-gray-700 font-medium"
                >
                  🔗 {recording}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Click any recording above to search YouTube for "{tuneName}" + that recording
            </div>
          </div>
        )}

        {/* Custom search */}
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">Custom Search:</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchCustom()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jazz-blue text-sm"
              placeholder={`Search for "${tuneName}" + artist, year, or keywords...`}
            />
            <Button variant="secondary" size="sm" onClick={handleSearchCustom}>
              Search YouTube
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Searches will open in a new tab. Copy video URLs from results and paste below.
          </div>
        </div>
      </div>

      {/* Add video section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Video</h3>
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
        </div>
      </div>

      {/* Current playlist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Current Playlist ({videoIds.length} videos)
          </h3>
          {videoIds.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyPlaylistUrl}>
                📋 Copy URL
              </Button>
              <Button variant="secondary" size="sm" onClick={handleTestPlaylist}>
                Test Playlist
              </Button>
            </div>
          )}
        </div>

        {/* Target guidance */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-medium text-blue-900 mb-1">Target: 5-10 videos</div>
          <div className="text-blue-800">
            Current: {videoIds.length} |{' '}
            <span className={videoIds.length >= 5 && videoIds.length <= 10 ? 'text-green-600 font-medium' : ''}>
              {videoIds.length < 5 ? `Need ${5 - videoIds.length} more` : videoIds.length <= 10 ? '✅ Ready' : 'Consider removing some'}
            </span>
          </div>
        </div>

        {videoIds.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
            No videos added yet. Paste a YouTube URL above to get started.
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

                    return (
                      <Draggable key={videoId} draggableId={videoId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white border border-gray-200 rounded-lg p-3 ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                </svg>
                              </div>

                              {/* Position number */}
                              <div className="font-bold text-gray-400 text-sm mt-1">
                                {index + 1}.
                              </div>

                              {/* Video info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={videoData.title || ''}
                                    onChange={(e) => handleUpdateVideo(index, 'title', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue"
                                    placeholder="Video title (e.g., Chet Baker - 1954)"
                                  />
                                  <input
                                    type="text"
                                    value={videoData.artist || ''}
                                    onChange={(e) => handleUpdateVideo(index, 'artist', e.target.value)}
                                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-jazz-blue"
                                    placeholder="Artist"
                                  />
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  {videoId}
                                  {videoData.added_date && ` • Added: ${videoData.added_date}`}
                                  {videoData.verified && (
                                    <span className="ml-2 text-green-600">✅ Verified</span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
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

      {/* Curation guidelines */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <div className="font-medium text-blue-900 mb-2">Curation Guidelines:</div>
        <ul className="text-blue-800 space-y-1 list-disc list-inside">
          <li>Target: 5-10 essential recordings</li>
          <li>Prefer official uploads and high audio quality</li>
          <li>Diversify: different eras, vocalists vs instrumentalists</li>
          <li>First video is the "primary" recommendation</li>
        </ul>
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
