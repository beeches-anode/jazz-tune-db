import { buildPlaylistUrl } from '../utils/youtubeUrl';

export function YouTubePlaylistButton({ videoIds, label, variant = 'performances' }) {
  if (!videoIds || videoIds.length === 0) return null;
  const ids = videoIds.map(v => v.id);
  const url = buildPlaylistUrl(ids);
  const bg = variant === 'backing'
    ? 'bg-gradient-to-r from-zinc-700 to-zinc-900 text-white'
    : 'bg-gradient-to-r from-red-500 to-red-700 text-white';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full px-4 py-3 rounded font-medium text-center ${bg} hover:opacity-90 transition`}
    >
      {label} ({videoIds.length})
    </a>
  );
}
