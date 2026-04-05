import { useState } from 'react';
import { Youtube, Loader2, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import { fetchPlaylist, extractPlaylistId, ytThumbnail } from '../../services/youtubeService';
import { Button, Input } from '../ui/index.jsx';

export default function PlaylistImporter({ onImported }) {
  const [url, setUrl]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleFetch = async () => {
    if (!url.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const id = extractPlaylistId(url.trim());
      if (!id) throw new Error('Invalid YouTube playlist URL. Make sure it contains ?list=...');

      const data = await fetchPlaylist(id);
      setResult(data);
      setEditingTitle(data.title);
    } catch (err) {
      setError(err.message || 'Failed to fetch playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onImported({ ...result, title: editingTitle });
  };

  return (
    <div className="space-y-6">
      {/* URL input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gold mb-1">
          <Youtube size={20} />
          <h3 className="font-display text-sm font-semibold tracking-wide">Import YouTube Playlist</h3>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="https://www.youtube.com/playlist?list=PL..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleFetch()}
            className="flex-1"
          />
          <Button
            onClick={handleFetch}
            loading={loading}
            disabled={!url.trim()}
            className="flex-shrink-0"
          >
            {loading ? 'Fetching…' : 'Fetch'}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10
            border border-red-500/30 rounded-xl p-3">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* Results preview */}
      {result && (
        <div className="glass-card border-green/20 p-5 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-green-light">
            <CheckCircle2 size={16} />
            <span className="text-sm font-semibold">
              Found {result.videos.length} videos
            </span>
          </div>

          {/* Editable title */}
          <div className="flex items-center gap-2">
            <input
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              className="input-field text-base font-semibold"
              placeholder="Course title"
            />
            <Edit2 size={14} className="text-slate-muted flex-shrink-0" />
          </div>

          {/* Channel */}
          {result.channelTitle && (
            <p className="text-xs text-slate-muted">
              Channel: <span className="text-cream">{result.channelTitle}</span>
            </p>
          )}

          {/* Video list preview (first 8) */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {result.videos.slice(0, 8).map((v, i) => (
              <div key={v.videoId}
                className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-navy-border/30">
                <span className="text-[10px] text-slate-muted w-5 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <img
                  src={v.thumbnail || ytThumbnail(v.videoId)}
                  alt=""
                  className="w-10 h-7 object-cover rounded flex-shrink-0 bg-navy-dark"
                  loading="lazy"
                />
                <span className="text-xs text-cream-muted line-clamp-1">{v.title}</span>
              </div>
            ))}
            {result.videos.length > 8 && (
              <p className="text-xs text-slate-muted text-center py-1">
                + {result.videos.length - 8} more videos
              </p>
            )}
          </div>

          <Button onClick={handleConfirm} variant="gold" className="w-full">
            Use This Playlist →
          </Button>
        </div>
      )}
    </div>
  );
}
