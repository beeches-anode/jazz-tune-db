import { useState } from 'react';
import { Button } from '../shared/Button';

// Extract Spotify playlist ID from URL
const extractSpotifyPlaylistId = (url) => {
  if (!url) return null;

  // Handle different Spotify URL formats:
  // https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd
  // spotify:playlist:37i9dQZF1DX0XUsuxWHRQd
  // 37i9dQZF1DX0XUsuxWHRQd (just the ID)

  // If it's just an ID (alphanumeric, starts with alphanumeric)
  if (/^[a-zA-Z0-9]{22}$/.test(url.trim())) {
    return url.trim();
  }

  // Extract from URL
  const urlMatch = url.match(/playlist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Extract from spotify: URI
  const uriMatch = url.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
  if (uriMatch) {
    return uriMatch[1];
  }

  return null;
};

// Generate Spotify playlist embed URL
const generateSpotifyEmbedUrl = (playlistId) => {
  if (!playlistId) return null;
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
};

// Generate Spotify playlist open URL
const generateSpotifyOpenUrl = (playlistId) => {
  if (!playlistId) return null;
  return `https://open.spotify.com/playlist/${playlistId}`;
};

export const SpotifyCurator = ({ playlistId, tuneName, onChange }) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const handleAddPlaylist = () => {
    setError('');
    const extractedId = extractSpotifyPlaylistId(urlInput);

    if (!extractedId) {
      setError('Invalid Spotify playlist URL or ID. Please check the format.');
      return;
    }

    onChange(extractedId);
    setUrlInput('');
  };

  const handleRemovePlaylist = () => {
    if (window.confirm('Remove Spotify playlist from this tune?')) {
      onChange(null);
    }
  };

  const handleOpenInSpotify = () => {
    if (playlistId) {
      window.open(generateSpotifyOpenUrl(playlistId), '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Info section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
        <div className="font-medium text-green-900 mb-2">📻 Spotify Playlist</div>
        <div className="text-green-800">
          Add an optional Spotify playlist for "{tuneName}". This could be a curated playlist
          of different recordings, covers, or related content.
        </div>
      </div>

      {/* Add playlist section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Playlist</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPlaylist()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="Paste Spotify playlist URL or ID..."
          />
          <Button variant="primary" size="sm" onClick={handleAddPlaylist}>
            Add Playlist
          </Button>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-600">{error}</div>
        )}
        <div className="mt-2 text-xs text-gray-600">
          Supported formats:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd</li>
            <li>spotify:playlist:37i9dQZF1DX0XUsuxWHRQd</li>
            <li>37i9dQZF1DX0XUsuxWHRQd (just the ID)</li>
          </ul>
        </div>
      </div>

      {/* Current playlist */}
      {playlistId ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Current Playlist</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleOpenInSpotify}>
                🎵 Open in Spotify
              </Button>
              <Button variant="secondary" size="sm" onClick={handleRemovePlaylist}>
                Remove
              </Button>
            </div>
          </div>

          {/* Spotify embed */}
          <div className="mb-4">
            <iframe
              style={{ borderRadius: '12px' }}
              src={generateSpotifyEmbedUrl(playlistId)}
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`Spotify playlist for ${tuneName}`}
            />
          </div>

          <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
            Playlist ID: {playlistId}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
          No Spotify playlist added yet. Add one above to get started.
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <div className="font-medium text-blue-900 mb-2">How to get a Spotify Playlist ID:</div>
        <ol className="text-blue-800 space-y-1 list-decimal list-inside">
          <li>Open Spotify and navigate to your playlist</li>
          <li>Click the "⋯" (three dots) menu</li>
          <li>Select "Share" → "Copy link to playlist"</li>
          <li>Paste the link above</li>
        </ol>
      </div>
    </div>
  );
};

