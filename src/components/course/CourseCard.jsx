import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Globe2,
  Lock,
  PlayCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar, Badge } from '../ui/index.jsx';
import { ytThumbnail } from '../../services/youtubeService';

function formatPrice(value) {
  const numeric = Number(value) || 0;
  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(2);
}

function formatLabel(value, fallback) {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CourseCard({ course, progress = null, enrolled = false, action = null }) {
  const thumbnail = course.thumbnail_url
    || (course.modules?.[0]?.lessons?.[0]?.youtube_id
      ? ytThumbnail(course.modules[0].lessons[0].youtube_id, 'hqdefault')
      : null);

  const lessonCount = course.total_lessons
    || course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0)
    || 0;

  const primaryHref = course.primaryHref || (enrolled ? `/courses/${course.id}/learn` : `/courses/${course.id}`);
  const primaryLabel = course.primaryLabel || (enrolled ? 'Continue Learning' : 'View Course');
  const secondaryLabel = course.secondaryLabel || (enrolled ? 'Track your next lesson and keep momentum.' : 'Open the syllabus and preview the curriculum.');
  const summary = course.summary || course.description?.trim() || 'Structured lessons with a cleaner learning path and guided course flow.';
  const levelVariant = course.level === 'beginner'
    ? 'green'
    : course.level === 'advanced'
      ? 'blue'
      : 'gold';

  return (
    <article
      className="group relative h-full overflow-hidden rounded-[28px] border border-navy-border/90
        bg-[linear-gradient(180deg,rgba(18,34,58,0.96),rgba(8,16,30,0.98))]
        shadow-[0_22px_60px_rgba(0,0,0,0.24)] transition-all duration-500
        hover:-translate-y-1.5 hover:border-gold/30 hover:shadow-[0_28px_80px_rgba(0,0,0,0.34)]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gold/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />
        <div className="absolute left-0 top-24 h-48 w-48 rounded-full bg-green/10 blur-3xl transition-transform duration-500 group-hover:scale-110" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="relative overflow-hidden border-b border-white/5 bg-navy-dark">
          <div className="aspect-[4/3] min-h-[220px]">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={course.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#173152,transparent_58%)]">
                <BookOpen size={40} className="text-navy-border" />
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,19,0.14),rgba(5,10,19,0.1)_28%,rgba(5,10,19,0.86)_100%)]" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-navy-dark/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/90 backdrop-blur-md">
                {course.category || 'Course'}
              </span>
              <Badge variant={levelVariant}>{formatLabel(course.level, 'Beginner')}</Badge>
            </div>

            {course.is_free ? (
              <span className="rounded-full border border-green/30 bg-green/15 px-3 py-1 text-[11px] font-semibold text-green-light backdrop-blur-md">
                Free Access
              </span>
            ) : (
              <span className="rounded-full border border-gold/30 bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold backdrop-blur-md">
                <Lock size={10} className="mr-1 inline" /> ${formatPrice(course.price)}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-center gap-3 text-[11px] text-cream/75">
              {course.instructor?.name ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-dark/60 px-3 py-1 backdrop-blur-md">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-green to-gold text-[10px] font-bold text-navy">
                    {course.instructor.name[0]}
                  </span>
                  {course.instructor.name}
                </span>
              ) : null}

              {enrolled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green/20 bg-green/10 px-3 py-1 text-green-light">
                  <CheckCircle2 size={12} /> Enrolled
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-display text-[1.18rem] leading-snug text-cream transition-colors duration-300 group-hover:text-gold">
                {course.title}
              </h3>
              <p className="text-sm leading-6 text-cream-muted line-clamp-3">
                {summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-white/5 bg-navy-dark/45 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-muted">Lessons</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-cream">
                  <BookOpen size={14} className="text-gold" />
                  {lessonCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-muted">Language</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-cream">
                  <Globe2 size={14} className="text-green-light" />
                  {course.language || 'English'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {enrolled && progress !== null ? (
              <div className="rounded-[22px] border border-green/15 bg-green/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-light/90">
                      Course Progress
                    </p>
                    <p className="mt-1 text-sm text-cream-muted">
                      {progress >= 100 ? 'Completed and ready to revisit.' : 'Keep going from your last lesson.'}
                    </p>
                  </div>
                  <p className="font-display text-2xl text-cream">{Math.round(progress)}%</p>
                </div>
                <ProgressBar value={progress} showPercent={false} />
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-muted">
                  Course Overview
                </p>
                <p className="mt-2 text-sm leading-6 text-cream-muted">
                  {secondaryLabel}
                </p>
              </div>
            )}
          </div>

          <div className={`mt-auto flex gap-3 pt-5 ${action ? 'flex-col sm:flex-row' : 'flex-col'}`}>
            <Link
              to={primaryHref}
              className={`${action ? 'btn-ghost sm:flex-1' : 'btn-gold'} inline-flex items-center justify-center gap-2`}
            >
              {enrolled ? <PlayCircle size={16} /> : <ArrowUpRight size={16} />}
              {primaryLabel}
            </Link>

            {action ? (
              <div className="sm:flex-1">
                {action}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
