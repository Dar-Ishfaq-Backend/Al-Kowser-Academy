import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, Flame, Play, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { fetchUserEnrollments } from '../../services/courseService';
import { fetchCourseProgress, computeProgress } from '../../services/progressService';
import { StatCard, ProgressBar, Card } from '../../components/ui/index.jsx';
import CourseCard from '../../components/course/CourseCard';
import toast from 'react-hot-toast';
import { groupCatalogCourses } from '../../utils/courseSeries';

export default function StudentDashboard() {
  const { profile, user, updateStreak } = useAuthStore();
  const [enrollments, setEnrollments]   = useState([]);
  const [progressMap, setProgressMap]   = useState({});
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (user) {
      updateStreak();
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const enrs = await fetchUserEnrollments(user.id);
      setEnrollments(enrs);

      // Fetch progress for each enrolled course
      const pm = {};
      await Promise.all(
        enrs.map(async (e) => {
          if (!e.course) return;
          const rows = await fetchCourseProgress(user.id, e.course_id);
          pm[e.course_id] = computeProgress(rows, e.course.total_lessons || 1);
        })
      );
      setProgressMap(pm);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const completed = Object.values(progressMap).filter(p => p === 100).length;
  const inProgress = enrollments.length - completed;

  const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.course_id));
  const groupedEnrolledCourses = groupCatalogCourses(
    enrollments.map((enrollment) => enrollment.course).filter(Boolean),
    enrolledIds,
    progressMap,
  );

  const inProgressCourses = groupedEnrolledCourses.filter((course) => {
    if (course.isSeriesGroup) {
      return course.groupMembers.some((member) => member.progress < 100);
    }
    return (progressMap[course.id] || 0) < 100;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-slate-muted text-sm mb-1">{greeting},</p>
          <h1 className="font-display text-2xl font-bold text-cream">
            {profile?.name || 'Student'} 👋
          </h1>
          <p className="text-slate-muted text-sm mt-1">
            Continue your Islamic learning journey
          </p>
        </div>

        {profile?.streak > 0 && (
          <div className="flex items-center gap-2 bg-gold/10 border border-gold/20
            rounded-xl px-4 py-2.5 self-start sm:self-auto">
            <Flame size={18} className="text-gold" />
            <div>
              <p className="text-xs text-slate-muted">Daily Streak</p>
              <p className="text-lg font-bold text-gold font-display">{profile.streak} days</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled Courses" value={enrollments.length}
          icon={BookOpen} color="gold" />
        <StatCard label="In Progress" value={inProgress}
          icon={Play} color="green" />
        <StatCard label="Completed" value={completed}
          icon={Award} color="blue" />
        <StatCard label="Day Streak" value={`${profile?.streak || 0} 🔥`}
          icon={Flame} color="gold" />
      </div>

      {/* ── Continue Learning ── */}
      {inProgressCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-cream">Continue Learning</h2>
            <Link to="/courses" className="text-sm text-gold hover:text-gold-light flex items-center gap-1">
              Browse all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {inProgressCourses.slice(0, 3).map((course) => (
              course && (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={course.isSeriesGroup ? course.progress : (progressMap[course.id] || 0)}
                  enrolled
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {enrollments.length === 0 && !loading && (
        <Card className="text-center py-16 border-dashed border-navy-border">
          <div className="w-16 h-16 rounded-2xl bg-green/10 border border-green/20
            flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-green-light" />
          </div>
          <h3 className="font-display text-lg font-semibold text-cream mb-2">
            Begin Your Journey
          </h3>
          <p className="text-slate-muted text-sm mb-6 max-w-xs mx-auto">
            Enroll in your first Islamic course and start learning today.
          </p>
          <Link to="/courses" className="btn-gold inline-flex items-center gap-2">
            <BookOpen size={16} /> Browse Courses
          </Link>
        </Card>
      )}

      {/* ── All enrolled courses ── */}
      {enrollments.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-cream mb-4">
            All Enrolled Courses
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {enrollments.map(e => e.course && (
              <Link key={e.id} to={`/courses/${e.course_id}/learn`}
                className="glass-card p-4 flex items-center gap-4 hover:border-gold/30
                  hover:shadow-gold transition-all duration-200 group">
                <div className="w-12 h-12 rounded-xl bg-green/10 border border-green/20
                  flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} className="text-green-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cream text-sm truncate
                    group-hover:text-gold transition-colors">
                    {e.course.title}
                  </p>
                  <p className="text-xs text-slate-muted mt-0.5">
                    {e.course.total_lessons} lessons · {e.course.level}
                  </p>
                  <ProgressBar
                    value={progressMap[e.course_id] || 0}
                    showPercent={false}
                    height="h-1"
                  />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gold font-bold text-sm">
                    {progressMap[e.course_id] || 0}%
                  </p>
                  <p className="text-[10px] text-slate-muted">
                    {progressMap[e.course_id] === 100 ? '✅ Done' : 'In progress'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
