import { useState, useMemo } from 'react';
import { transposeProgression } from '../../utils/chordUtils';

export const PreviewPanel = ({ tune }) => {
  const [transposeKey, setTransposeKey] = useState('concert');

  const displayedChords = useMemo(() => {
    if (!tune.chords) return '';

    const fromKey = tune.standard_key || 'C major';

    switch (transposeKey) {
      case 'Bb':
        return transposeProgression(tune.chords, fromKey, 'Bb instrument');
      case 'Eb':
        return transposeProgression(tune.chords, fromKey, 'Eb instrument');
      case 'concert':
      default:
        return tune.chords;
    }
  }, [tune.chords, tune.standard_key, transposeKey]);

  const renderChordChart = () => {
    if (!displayedChords) return null;

    const lines = displayedChords.split('\n');
    const sectionMarkers = tune.section_markers || [];

    let currentMeasure = 0;
    let currentSectionIndex = 0;

    return (
      <div className="space-y-4">
        {lines.map((line, lineIdx) => {
          if (line.trim() === '') return null;

          const measures = line.split('|').filter((m, i, arr) => i > 0 && i < arr.length - 1);

          return (
            <div key={lineIdx}>
              {/* Section label */}
              {sectionMarkers[currentSectionIndex] &&
               sectionMarkers[currentSectionIndex].start === currentMeasure + 1 && (
                <div className="text-sm font-semibold text-jazz-blue mb-2">
                  {sectionMarkers[currentSectionIndex].label} Section
                  {(() => {
                    currentSectionIndex++;
                    return null;
                  })()}
                </div>
              )}

              {/* Measures */}
              <div className="grid grid-cols-4 gap-2">
                {measures.map((measure, measureIdx) => {
                  currentMeasure++;
                  const chords = measure.trim().split(/\s+/).filter(Boolean);

                  return (
                    <div
                      key={measureIdx}
                      className="border border-gray-300 p-3 rounded bg-white"
                    >
                      <div className="font-mono text-sm text-center">
                        {chords.map((chord, chordIdx) => (
                          <span key={chordIdx} className="inline-block mx-1">
                            {chord}
                          </span>
                        ))}
                        {chords.length === 0 && (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Transposition controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setTransposeKey('concert')}
          className={`px-3 py-1 text-sm rounded ${
            transposeKey === 'concert'
              ? 'bg-jazz-blue text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Concert
        </button>
        <button
          onClick={() => setTransposeKey('Bb')}
          className={`px-3 py-1 text-sm rounded ${
            transposeKey === 'Bb'
              ? 'bg-jazz-blue text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Bb
        </button>
        <button
          onClick={() => setTransposeKey('Eb')}
          className={`px-3 py-1 text-sm rounded ${
            transposeKey === 'Eb'
              ? 'bg-jazz-blue text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Eb
        </button>
      </div>

      {/* Tune header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {tune.tune_name || 'Untitled'}
        </h2>
        <div className="text-gray-600 mb-4">
          {tune.composer}
          {tune.lyricist && ` (${tune.lyricist})`}
          {tune.year && `, ${tune.year}`}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          {tune.style && (
            <div>
              <span className="font-medium">Style:</span> {tune.style}
            </div>
          )}
          {tune.form && (
            <div>
              <span className="font-medium">Form:</span> {tune.form}
            </div>
          )}
          {tune.standard_key && (
            <div>
              <span className="font-medium">Key:</span> {tune.standard_key}
            </div>
          )}
        </div>
      </div>

      {/* Chord chart */}
      {tune.chords && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Chord Chart
            {transposeKey !== 'concert' && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Transposed for {transposeKey})
              </span>
            )}
          </h3>
          {renderChordChart()}
          {tune.chord_progression_notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Chord Progression Notes</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {tune.chord_progression_notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Famous Recordings */}
      {tune.famous_recordings && tune.famous_recordings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Famous Recordings</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {tune.famous_recordings.map((recording, idx) => (
              <li key={idx}>
                • {typeof recording === 'string' ? recording : `${recording.artist} - ${recording.year}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* YouTube Videos */}
      {tune.youtube_video_ids && tune.youtube_video_ids.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            YouTube Videos ({tune.youtube_video_ids.length})
          </h3>
          <div className="text-sm text-gray-600">
            {tune.youtube_video_ids.length} video{tune.youtube_video_ids.length !== 1 ? 's' : ''} curated
          </div>
        </div>
      )}

      {/* YouTube Backing Tracks */}
      {tune.youtube_backing_track_ids && tune.youtube_backing_track_ids.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            YouTube Backing Tracks ({tune.youtube_backing_track_ids.length})
          </h3>
          <div className="space-y-2">
            {tune.youtube_backing_track_ids.map((video, idx) => {
              const videoId = typeof video === 'string' ? video : video.id;
              const videoData = typeof video === 'string' ? { id: video } : video;
              return (
                <div key={videoId} className="text-sm text-gray-700">
                  {videoData.title || `Backing Track ${idx + 1}`}
                  {videoData.channelTitle && (
                    <span className="text-gray-500 ml-2">• {videoData.channelTitle}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spotify Playlist */}
      {tune.spotify_playlist_id && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Spotify Playlist</h3>
          <div className="mb-4">
            <iframe
              style={{ borderRadius: '12px' }}
              src={`https://open.spotify.com/embed/playlist/${tune.spotify_playlist_id}?utm_source=generator`}
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={`Spotify playlist for ${tune.tune_name}`}
            />
          </div>
          <a
            href={`https://open.spotify.com/playlist/${tune.spotify_playlist_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:text-green-700 underline"
          >
            Open in Spotify →
          </a>
        </div>
      )}

      {/* History */}
      {tune.history_and_facts && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">History & Facts</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {tune.history_and_facts}
          </div>
        </div>
      )}
    </div>
  );
};
