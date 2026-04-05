import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Globe2,
  Lock,
  Play,
  PlayCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import {
  checkEnrollment,
  enrollInCourse,
  fetchCourseById,
  fetchPublishedCourses,
} from '../../services/courseService';
import { computeProgress, fetchCourseProgress } from '../../services/progressService';
import { ytThumbnail } from '../../services/youtubeService';
import { Badge, Button, LoadingSpinner, ProgressBar } from '../../components/ui/index.jsx';
import {
  buildSeriesCourseById,
  getSeriesConfigById,
  isSeriesCourseId,
} from '../../utils/courseSeries';

function formatPrice(value) {
  const numeric = Number(value) || 0;
  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(2);
}

function formatLabel(value, fallback) {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SeriesChoiceButton({ member, seriesLabel, seriesTitle }) {
  return (
    <Link
      to={member.href}
      className="group rounded-[28px] border border-white/5 bg-navy-dark/45 p-5 transition-all duration-300
        hover:-translate-y-1 hover:border-gold/25 hover:bg-navy-dark/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">{seriesLabel}</p>
          <h3 className="mt-2 font-display text-2xl text-cream transition-colors group-hover:text-gold">
            {member.shortLabel}
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            member.enrolled
              ? 'border border-green/25 bg-green/10 text-green-light'
              : 'border border-gold/25 bg-gold/10 text-gold'
          }`}
        >
          {member.enrolled ? 'Resume' : 'View'}
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-cream-muted">
        {member.description || `Open ${member.shortLabel} and continue the ${seriesTitle} learning path.`}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
          <BookOpen size={12} className="text-gold" />
          {member.lessons} lessons
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
          {member.enrolled ? <CheckCircle2 size={12} className="text-green-light" /> : <PlayCircle size={12} className="text-gold" />}
          {member.enrolled ? `${Math.round(member.progress || 0)}% progress` : 'Open book'}
        </span>
      </div>
    </Link>
  );
}

export default function CourseDetail() {
  const { id: courseId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    load();
  }, [courseId, user]);

  const loadSeriesCourse = async () => {
    const seriesConfig = getSeriesConfigById(courseId);
    if (!seriesConfig) {
      throw new Error('Series course not found');
    }

    const publishedCourses = await fetchPublishedCourses();
    const enrolledIds = new Set();
    const progressMap = {};

    if (user) {
      const memberCandidates = seriesConfig.members
        .map((member) => publishedCourses.find((item) => item.title === member.title))
        .filter(Boolean);

      await Promise.all(
        memberCandidates.map(async (member) => {
          const enrollmentRow = await checkEnrollment(user.id, member.id);
          if (!enrollmentRow) return;

          enrolledIds.add(member.id);
          const rows = await fetchCourseProgress(user.id, member.id);
          const total = member.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 1;
          progressMap[member.id] = computeProgress(rows, total);
        }),
      );
    }

    const seriesCourse = buildSeriesCourseById(courseId, publishedCourses, enrolledIds, progressMap);
    if (!seriesCourse) {
      throw new Error('Series course not found');
    }

    setCourse(seriesCourse);
    setEnrollment(seriesCourse.groupMembers.some((member) => member.enrolled) ? { id: 'series' } : null);
    setProgress(seriesCourse.progress || 0);
  };

  const loadStandardCourse = async () => {
    const nextCourse = await fetchCourseById(courseId);
    setCourse(nextCourse);

    if (user) {
      const nextEnrollment = await checkEnrollment(user.id, courseId);
      setEnrollment(nextEnrollment);

      if (nextEnrollment) {
        const rows = await fetchCourseProgress(user.id, courseId);
        const total = (nextCourse.modules || []).reduce((acc, module) => acc + (module.lessons?.length || 0), 0);
        setProgress(computeProgress(rows, total));
      } else {
        setProgress(0);
      }
    } else {
      setEnrollment(null);
      setProgress(0);
    }
  };

  const load = async () => {
    setLoading(true);

    try {
      if (isSeriesCourseId(courseId)) {
        await loadSeriesCourse();
      } else {
        await loadStandardCourse();
      }
    } catch (error) {
      toast.error('Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      await enrollInCourse(user.id, courseId);
      toast.success('Enrolled! Start learning now 🎉');
      navigate(`/courses/${courseId}/learn`);
    } catch (error) {
      toast.error(error.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!course) return null;

  if (course.isSeriesGroup) {
    return (
      <div className="space-y-8">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm text-slate-muted transition-colors hover:text-cream"
        >
          <ArrowLeft size={16} /> Back to Courses
        </Link>

        <section
          className="relative overflow-hidden rounded-[34px] border border-navy-border/90
            bg-[linear-gradient(135deg,rgba(15,30,53,0.97),rgba(7,13,24,0.98))]
            shadow-[0_26px_90px_rgba(0,0,0,0.28)]"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute left-0 top-24 h-64 w-64 rounded-full bg-green/10 blur-3xl" />
          </div>

          <div className="relative grid overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_420px]">
            <div className="relative min-h-[320px] bg-navy-dark lg:min-h-[520px]">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#173152,transparent_58%)]">
                  <BookOpen size={44} className="text-navy-border" />
                </div>
              )}

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,15,0.08),rgba(4,8,15,0.24)_34%,rgba(4,8,15,0.84)_100%)]" />

              <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-5 lg:p-6">
                <Badge variant={course.level === 'beginner' ? 'green' : course.level === 'advanced' ? 'blue' : 'gold'}>
                  {formatLabel(course.level, 'Beginner')}
                </Badge>
                <span className="rounded-full border border-white/10 bg-navy-dark/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/90 backdrop-blur-md">
                  {course.category || 'Course'}
                </span>
                <span className="rounded-full border border-gold/30 bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold backdrop-blur-md">
                  {course.badgeLabel || `${course.groupMembers.length} Courses`}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
                    {course.seriesSubtitle || `${course.language} Series`}
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight text-cream md:text-4xl lg:text-[3.1rem]">
                    {course.title}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex flex-col px-5 py-6 sm:px-6 lg:px-7 lg:py-7">
              <div className="space-y-5">
                <div className="rounded-[24px] border border-white/5 bg-navy-dark/45 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-muted">
                    Series Overview
                  </p>
                  <p className="mt-3 text-sm leading-7 text-cream-muted">
                    {course.seriesOverview || 'This series keeps the main tracks together so learners can choose the right course when they need it.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">
                      {course.countLabel || 'Courses'}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-cream">
                      <BookOpen size={16} className="text-gold" />
                      {course.groupMembers.length}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Language</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-cream">
                      <Globe2 size={16} className="text-green-light" />
                      {course.language || 'English'}
                    </p>
                  </div>
                </div>

                {enrollment ? (
                  <div className="rounded-[26px] border border-green/15 bg-green/5 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-green-light">
                          <CheckCircle2 size={14} /> Series Progress
                        </p>
                        <p className="mt-2 text-sm leading-6 text-cream-muted">
                          Resume the course you are currently studying, or switch to another track from below.
                        </p>
                      </div>
                      <p className="font-display text-3xl text-cream">{Math.round(progress)}%</p>
                    </div>
                    <ProgressBar value={progress} showPercent={false} />
                  </div>
                ) : (
                  <div className="rounded-[26px] border border-gold/15 bg-gold/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                      {course.chooseSubtitle || 'Choose Your Course'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-cream-muted">
                      Open any course below. Each track keeps its own enrollment and progress.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-muted">
              {course.chooseSubtitle || 'Choose Your Course'}
            </p>
            <h2 className="mt-2 font-display text-2xl text-cream">
              {course.chooseTitle || 'Pick your course'}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {course.groupMembers.map((member) => (
              <SeriesChoiceButton
                key={member.id}
                member={member}
                seriesLabel={course.seriesLabel || 'Series'}
                seriesTitle={course.title}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  const allLessons = (course.modules || []).flatMap((module) => module.lessons || []);
  const lessonCount = allLessons.length;
  const thumbnail = course.thumbnail_url
    || (allLessons[0]?.youtube_id ? ytThumbnail(allLessons[0].youtube_id, 'hqdefault') : null);

  return (
    <div className="space-y-8">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-muted transition-colors hover:text-cream"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <section
        className="relative overflow-hidden rounded-[34px] border border-navy-border/90
          bg-[linear-gradient(135deg,rgba(15,30,53,0.97),rgba(7,13,24,0.98))]
          shadow-[0_26px_90px_rgba(0,0,0,0.28)]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute left-0 top-24 h-64 w-64 rounded-full bg-green/10 blur-3xl" />
        </div>

        <div className="relative grid overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="relative min-h-[320px] bg-navy-dark lg:min-h-[520px]">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#173152,transparent_58%)]">
                <BookOpen size={44} className="text-navy-border" />
              </div>
            )}

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,15,0.08),rgba(4,8,15,0.24)_34%,rgba(4,8,15,0.84)_100%)]" />

            <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-5 lg:p-6">
              <Badge variant={course.level === 'beginner' ? 'green' : course.level === 'advanced' ? 'blue' : 'gold'}>
                {formatLabel(course.level, 'Beginner')}
              </Badge>
              <span className="rounded-full border border-white/10 bg-navy-dark/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/90 backdrop-blur-md">
                {course.category}
              </span>
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

            <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
                  {course.language || 'English'} Learning Track
                </p>
                <h1 className="mt-3 font-display text-3xl leading-tight text-cream md:text-4xl lg:text-[3.1rem]">
                  {course.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-col px-5 py-6 sm:px-6 lg:px-7 lg:py-7">
            <div className="space-y-5">
              <div className="rounded-[24px] border border-white/5 bg-navy-dark/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-muted">
                  Course Overview
                </p>
                <p className="mt-3 text-sm leading-7 text-cream-muted">
                  {course.description || 'A guided learning path with structured lessons, steady progress, and a cleaner study experience.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Lessons</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-cream">
                    <BookOpen size={16} className="text-gold" />
                    {lessonCount}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Language</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-cream">
                    <Globe2 size={16} className="text-green-light" />
                    {course.language || 'English'}
                  </p>
                </div>
              </div>

              {course.instructor?.name && (
                <div className="rounded-[24px] border border-white/5 bg-navy-dark/45 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Instructor</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-green to-gold text-sm font-bold text-navy">
                      {course.instructor.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cream">{course.instructor.name}</p>
                      <p className="text-xs text-slate-muted">Course guide</p>
                    </div>
                  </div>
                </div>
              )}

              {enrollment ? (
                <div className="rounded-[26px] border border-green/15 bg-green/5 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-green-light">
                        <CheckCircle2 size={14} /> Your Progress
                      </p>
                      <p className="mt-2 text-sm leading-6 text-cream-muted">
                        {progress >= 100
                          ? 'You have completed this course. Reopen it anytime.'
                          : 'Pick up where you left off and continue the learning path.'}
                      </p>
                    </div>
                    <p className="font-display text-3xl text-cream">{Math.round(progress)}%</p>
                  </div>
                  <ProgressBar value={progress} showPercent={false} />
                  <Button
                    onClick={() => navigate(`/courses/${courseId}/learn`)}
                    variant="gold"
                    className="mt-4 w-full"
                  >
                    <PlayCircle size={16} />
                    {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                  </Button>
                </div>
              ) : (
                <div className="rounded-[26px] border border-gold/15 bg-gold/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                    Enrollment
                  </p>
                  <p className="mt-2 text-sm leading-6 text-cream-muted">
                    Open the full course curriculum, track your progress, and unlock learning tools once you enroll.
                  </p>
                  <Button
                    onClick={handleEnroll}
                    loading={enrolling}
                    variant="gold"
                    className="mt-4 w-full"
                  >
                    <Play size={16} />
                    {enrolling ? 'Enrolling...' : course.is_free ? 'Enroll Free' : `Enroll - $${formatPrice(course.price)}`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-muted">
              Syllabus Preview
            </p>
            <h2 className="mt-2 font-display text-2xl text-cream">Course Curriculum</h2>
          </div>
          <p className="text-sm text-cream-muted">{lessonCount} lessons across {(course.modules || []).length} modules</p>
        </div>

        <div className="space-y-4">
          {(course.modules || []).map((module) => (
            <div
              key={module.id}
              className="overflow-hidden rounded-[28px] border border-navy-border/80
                bg-[linear-gradient(180deg,rgba(15,30,53,0.92),rgba(8,16,30,0.98))]"
            >
              <div className="flex flex-col gap-2 border-b border-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-muted">Module</p>
                  <h3 className="mt-1 font-display text-lg text-cream">{module.title}</h3>
                </div>
                <span className="text-xs text-slate-muted">
                  {module.lessons?.length || 0} lessons
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {(module.lessons || []).sort((a, b) => a.order - b.order).map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-4 sm:min-w-0 sm:flex-1">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-sm font-semibold text-gold">
                        {index + 1}
                      </div>

                      {lesson.thumbnail_url || lesson.youtube_id ? (
                        <img
                          src={lesson.thumbnail_url || ytThumbnail(lesson.youtube_id)}
                          alt=""
                          className="h-14 w-24 flex-shrink-0 rounded-2xl object-cover bg-navy-dark"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-14 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-navy-dark">
                          <Play size={16} className="text-slate-muted" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-cream">{lesson.title}</p>
                        <p className="mt-1 text-xs text-slate-muted">
                          {enrollment ? 'Available in your course player' : 'Visible after enrollment'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {enrollment ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green/20 bg-green/10 px-3 py-1 text-xs text-green-light">
                          <PlayCircle size={12} /> Openable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-navy-dark/60 px-3 py-1 text-xs text-slate-muted">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
