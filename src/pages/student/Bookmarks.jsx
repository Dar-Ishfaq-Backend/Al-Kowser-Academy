import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Play } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { fetchBookmarks } from '../../services/progressService';
import { ytThumbnail } from '../../services/youtubeService';
import { LoadingSpinner, Card } from '../../components/ui/index.jsx';

export default function Bookmarks() {
  const { user }               = useAuthStore();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (user)
      fetchBookmarks(user.id).then(setBookmarks).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">Bookmarked Lessons</h1>
        <p className="text-slate-muted text-sm mt-1">{bookmarks.length} saved lessons</p>
      </div>

      {bookmarks.length === 0 ? (
        <Card className="text-center py-20 border-dashed">
          <Bookmark size={40} className="text-navy-border mx-auto mb-3" />
          <h3 className="font-display text-lg text-cream mb-2">No Bookmarks Yet</h3>
          <p className="text-slate-muted text-sm max-w-xs mx-auto">
            Bookmark lessons while watching to quickly return to them.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookmarks.map(b => b.lesson && (
            <Link
              key={b.lesson_id}
              to={`/courses/${b.lesson.course?.id}/learn`}
              className="glass-card overflow-hidden hover:border-gold/30 hover:shadow-gold
                transition-all duration-200 group flex gap-3 p-4"
            >
              <img
                src={b.lesson.thumbnail_url || ytThumbnail(b.lesson.youtube_id)}
                alt=""
                className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-navy-dark"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-muted mb-0.5">{b.lesson.course?.title}</p>
                <p className="text-sm font-semibold text-cream line-clamp-2
                  group-hover:text-gold transition-colors">
                  {b.lesson.title}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-light">
                  <Play size={10} /> Watch
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
