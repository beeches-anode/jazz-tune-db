import { useState } from 'react';
import { parseVideoId } from '../utils/youtubeUrl';
import { useYouTubeMetadata } from '../hooks/useYouTubeMetadata';

export function PasteYouTubeModal({ onAdd, onClose }) {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [variant, setVariant] = useState('performance');
  const { fetchMetadata, loading, error } = useYouTubeMetadata();

  const handlePaste = async () => {
    const videoId = parseVideoId(url);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }
    try {
      const meta = await fetchMetadata(videoId);
      setMetadata(meta);
    } catch {
      // error state handled by hook
    }
  };

  const handleConfirm = () => {
    onAdd({
      id: metadata.id,
      title: metadata.title,
      channelTitle: metadata.channelTitle,
      verified: true,
      added_date: new Date().toISOString().slice(0, 10),
    }, variant);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md p-5">
        <h2 className="text-lg font-bold mb-3">Add YouTube video</h2>

        {!metadata ? (
          <>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="w-full px-3 py-2 border border-zinc-300 rounded mb-3"
              autoFocus
            />
            {error && <p className="text-sm text-red-600 mb-2">{error.message}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-zinc-300 rounded">Cancel</button>
              <button onClick={handlePaste} disabled={!url || loading} className="flex-1 px-4 py-2 bg-sky-500 text-white rounded disabled:opacity-50">
                {loading ? 'Fetching…' : 'Continue'}
              </button>
            </div>
          </>
        ) : (
          <>
            {metadata.thumbnail && <img src={metadata.thumbnail} alt="" className="w-full rounded mb-3" />}
            <p className="font-semibold">{metadata.title}</p>
            <p className="text-sm text-zinc-600 mb-3">{metadata.channelTitle}</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={variant === 'performance'} onChange={() => setVariant('performance')} />
                <span>Performance</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={variant === 'backing'} onChange={() => setVariant('backing')} />
                <span>Backing Track</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMetadata(null)} className="flex-1 px-4 py-2 border border-zinc-300 rounded">Back</button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-2 bg-sky-500 text-white rounded">Add</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
