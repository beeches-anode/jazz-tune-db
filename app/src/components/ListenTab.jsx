import { YouTubePlaylistButton } from './YouTubePlaylistButton';

export function ListenTab({ tune }) {
  const hasRecordings = tune.famous_recordings?.length > 0;
  const hasSpotify = tune.spotify_playlist_id;
  const hasVideos = tune.youtube_video_ids?.length > 0;
  const hasBacking = tune.youtube_backing_track_ids?.length > 0;

  return (
    <div className="px-3 sm:px-5 py-4 space-y-5">
      {hasRecordings && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">Famous Recordings</h3>
          <ul className="space-y-1">
            {tune.famous_recordings.map((r, i) => (
              <li key={i} className="flex gap-2 text-zinc-700">
                <span className="text-sky-500">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasSpotify && (
        <a
          href={`https://open.spotify.com/playlist/${tune.spotify_playlist_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-3 rounded font-medium text-center bg-gradient-to-r from-green-500 to-green-700 text-white hover:opacity-90"
        >
          ▶ Spotify Playlist
        </a>
      )}

      <YouTubePlaylistButton videoIds={tune.youtube_video_ids} label="YouTube Performances" variant="performances" />
      <YouTubePlaylistButton videoIds={tune.youtube_backing_track_ids} label="YouTube Backing Tracks" variant="backing" />
    </div>
  );
}
