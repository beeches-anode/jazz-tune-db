import { buildPlaylistUrl } from '../utils/youtubeUrl';
import { SMALL_CAPS, SERVICE_ROW } from './styles';

export function YouTubePlaylistButton({ videoIds, label }) {
  if (!videoIds || videoIds.length === 0) return null;
  const url = buildPlaylistUrl(videoIds.map((v) => v.id));
  const n = videoIds.length;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={SERVICE_ROW}
    >
      <span className={SMALL_CAPS}>{label}</span>
      <span className="text-xs text-muted tabular-nums whitespace-nowrap">
        {n} {n === 1 ? 'track' : 'tracks'} · opens in new tab
      </span>
    </a>
  );
}
