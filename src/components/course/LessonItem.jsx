import { CheckCircle2, Circle, Play, Clock, Bookmark, BookmarkCheck, Check } from 'lucide-react';

export default function LessonItem({
  lesson, isActive, isCompleted, isBookmarked,
  watchPercent = 0, watchReady = false,
  onSelect, onBookmark, onToggleComplete, index,
}) {
  return (
    <button
      onClick={() => onSelect(lesson)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-200
        border-l-2 group hover:bg-navy-border/30
        ${isActive
          ? 'border-gold bg-gold/10 text-cream'
          : 'border-transparent text-slate-muted hover:text-cream'
        }`}
    >
      {/* Completion indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle2 size={16} className="text-green-light" />
        ) : isActive ? (
          <Play size={16} className="text-gold" />
        ) : (
          <Circle size={16} className="text-navy-border group-hover:text-slate-muted" />
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-medium leading-snug line-clamp-2
            ${isActive ? 'text-cream' : ''}`}>
            <span className="text-gold/60 mr-1">{index + 1}.</span>
            {lesson.title}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onBookmark?.(lesson.id); }}
              className="flex-shrink-0 text-navy-border hover:text-gold transition-colors mt-0.5"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
            >
              {isBookmarked
                ? <BookmarkCheck size={12} className="text-gold" />
                : <Bookmark size={12} />
              }
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete?.(lesson);
              }}
              className={`flex h-5 w-5 items-center justify-center rounded-md border bg-white transition-all
                ${isCompleted
                  ? 'border-green-light text-green-light shadow-[0_0_0_1px_rgba(212,168,83,0.45)]'
                  : 'border-gold/70 text-white hover:border-green-light'
                }`}
              title={isCompleted ? 'Mark lesson incomplete' : 'Mark lesson complete'}
            >
              <Check size={12} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
            </button>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-muted/70">
          {lesson.duration_sec > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={9} />
              {Math.floor(lesson.duration_sec / 60)}m
            </span>
          )}
          {(watchReady || watchPercent > 0) && (
            <span className={watchPercent >= 75 ? 'text-green-light' : 'text-slate-muted/70'}>
              Watched {watchPercent}%
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
