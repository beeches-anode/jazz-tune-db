import { buildPlaylistUrl } from '../utils/youtubeUrl';

export function YouTubePlaylistButton({ videoIds, label }) {
  if (!videoIds || videoIds.length === 0) return null;
  const url = buildPlaylistUrl(videoIds.map((v) => v.id));
  const n = videoIds.length;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-baseline justify-between gap-4 border border-rule px-4 py-3 hover:bg-ink/5 transition-colors"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{label}</span>
      <span className="text-xs text-muted tabular-nums whitespace-nowrap">
        {n} {n === 1 ? 'track' : 'tracks'} · opens in new tab
      </span>
    </a>
  );
}
