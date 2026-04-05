import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkEnrollment, enrollInCourse, fetchPublishedCourses } from '../../services/courseService';
import { computeProgress, fetchCourseProgress } from '../../services/progressService';
import useAuthStore from '../../store/authStore';
import CourseCard from '../../components/course/CourseCard';
import { Badge, LoadingSpinner } from '../../components/ui/index.jsx';
import { groupCatalogCourses, isSeriesCourseId, matchesGroupedCourse } from '../../utils/courseSeries';

const LEVELS = ['', 'beginner', 'intermediate', 'advanced'];
const CATS = ['', 'Islamic Studies', 'Quran', 'Fiqh', 'Hadith', 'Aqeedah', 'Arabic', 'Seerah'];

export default function CourseCatalog() {
  const { user } = useAuthStore();
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [enrolling, setEnrolling] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (user && allCourses.length) {
      loadEnrollments();
    }
  }, [user, allCourses]);

  const displayCourses = useMemo(() => {
    const grouped = groupCatalogCourses(allCourses, enrolledIds, progressMap);
    return grouped.filter((course) => matchesGroupedCourse(course, { search, level, category }));
  }, [allCourses, enrolledIds, progressMap, search, level, category]);

  const stats = useMemo(() => ({
    total: displayCourses.length,
    categories: new Set(displayCourses.map((course) => course.category).filter(Boolean)).size,
    free: displayCourses.filter((course) => course.is_free).length,
  }), [displayCourses]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchPublishedCourses();
      setAllCourses(data || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    const ids = new Set();
    const nextProgress = {};

    await Promise.all(
      allCourses.map(async (course) => {
        const enrollment = await checkEnrollment(user.id, course.id);
        if (!enrollment) return;

        ids.add(course.id);
        const rows = await fetchCourseProgress(user.id, course.id);
        const total = course.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 1;
        nextProgress[course.id] = computeProgress(rows, total);
      }),
    );

    setEnrolledIds(ids);
    setProgressMap(nextProgress);
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      toast.error('Please sign in to enroll');
      return;
    }

    if (isSeriesCourseId(courseId)) {
      return;
    }

    setEnrolling(courseId);
    try {
      await enrollInCourse(user.id, courseId);
      setEnrolledIds((prev) => new Set([...prev, courseId]));
      toast.success('Enrolled successfully! 🎉');
    } catch (error) {
      toast.error(error.message || 'Enrollment failed');
    } finally {
      setEnrolling('');
    }
  };

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-[32px] border border-navy-border/90
          bg-[linear-gradient(135deg,rgba(15,30,53,0.96),rgba(7,13,24,0.98))]
          px-5 py-6 sm:px-7 lg:px-8 lg:py-8"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute left-0 top-16 h-56 w-56 rounded-full bg-green/10 blur-3xl" />
        </div>

        <div className="relative space-y-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold/80">
                Al Kowser Academy
              </p>
              <h1 className="mt-3 font-display text-3xl leading-tight text-cream sm:text-4xl lg:text-[3.15rem]">
                Explore Quran, Arabic, Hadith, Fiqh, Seerah, and more in one place.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-cream-muted sm:text-[15px]">
                Choose the subject you want to study, open the course details, and continue your learning from a clear and organized library.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
              <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Courses</p>
                <p className="mt-2 font-display text-3xl text-cream">{stats.total}</p>
              </div>
              <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Categories</p>
                <p className="mt-2 font-display text-3xl text-gold">{stats.categories}</p>
              </div>
              <div className="rounded-[22px] border border-white/5 bg-navy-dark/45 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-muted">Free</p>
                <p className="mt-2 font-display text-3xl text-green-light">{stats.free}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/5 bg-navy-dark/55 p-4 lg:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_180px_200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
                <input
                  placeholder="Search by course title..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="input-field pl-9"
                />
              </div>

              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="input-field min-w-[140px]"
              >
                <option value="">All Levels</option>
                {LEVELS.filter(Boolean).map((item) => (
                  <option key={item} value={item} className="capitalize">
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input-field min-w-[160px]"
              >
                <option value="">All Categories</option>
                {CATS.filter(Boolean).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {(search || level || category) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-muted">
                  <Filter size={13} />
                  Active Filters
                </span>
                {search && <Badge variant="gold">"{search}"</Badge>}
                {level && <Badge variant="green">{level}</Badge>}
                {category && <Badge variant="blue">{category}</Badge>}
                <button
                  onClick={() => {
                    setSearch('');
                    setLevel('');
                    setCategory('');
                  }}
                  className="text-xs text-slate-muted transition-colors hover:text-cream"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {loading && (
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      )}

      {!loading && displayCourses.length === 0 && (
        <div className="rounded-[30px] border border-navy-border/80 bg-navy-card/75 px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-gold/20 bg-gold/10">
            <BookOpen size={28} className="text-gold" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-cream">No courses found</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-muted">
            Try widening your search or clearing the active filters to bring more courses back into view.
          </p>
        </div>
      )}

      {!loading && displayCourses.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-muted">
                Showing {displayCourses.length} {displayCourses.length === 1 ? 'Course' : 'Courses'}
              </p>
              <h2 className="mt-2 font-display text-2xl text-cream">Available Courses</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 2xl:grid-cols-3">
            {displayCourses.map((course) => {
              const enrolled = course.isSeriesGroup
                ? course.groupMembers.some((member) => member.enrolled)
                : enrolledIds.has(course.id);

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={course.isSeriesGroup ? course.progress : progressMap[course.id]}
                  enrolled={enrolled}
                  action={!enrolled && !course.isSeriesGroup ? (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling === course.id}
                      className="btn-primary w-full"
                    >
                      {enrolling === course.id ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Enrolling...
                        </span>
                      ) : 'Enroll Now'}
                    </button>
                  ) : null}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
