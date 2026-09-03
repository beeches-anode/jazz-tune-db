import { YouTubePlaylistButton } from './YouTubePlaylistButton';

const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted';

export function ListenTab({ tune }) {
  const hasRecordings = tune.famous_recordings?.length > 0;

  return (
    <div className="px-4 sm:px-10 py-7 flex flex-col gap-6">
      {hasRecordings && (
        <div className="flex flex-col gap-2.5 max-w-[720px]">
          <h3 className={LABEL}>Famous Recordings</h3>
          <ul className="divide-y divide-rule border-y border-rule">
            {tune.famous_recordings.map((r, i) => (
              <li key={i} className="py-1.5 text-sm leading-snug">{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-[720px]">
        {tune.spotify_playlist_id && (
          <a
            href={`https://open.spotify.com/playlist/${tune.spotify_playlist_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline justify-between gap-4 border border-rule px-4 py-3 hover:bg-ink/5 transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Spotify Playlist</span>
            <span className="text-xs text-muted whitespace-nowrap">opens in new tab</span>
          </a>
        )}
        <YouTubePlaylistButton videoIds={tune.youtube_video_ids} label="YouTube Performances" />
        <YouTubePlaylistButton videoIds={tune.youtube_backing_track_ids} label="YouTube Backing Tracks" />
      </div>
    </div>
  );
}
