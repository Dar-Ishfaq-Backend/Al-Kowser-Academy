import { useEffect, useState } from 'react';
import { Users, BookOpen, GraduationCap, Award, TrendingUp } from 'lucide-react';
import { fetchAdminStats } from '../../services/progressService';
import { fetchAllEnrollments } from '../../services/courseService';
import { StatCard, Card, LoadingSpinner } from '../../components/ui/index.jsx';

export default function AdminAnalytics() {
  const [stats, setStats]       = useState({});
  const [enrollments, setEnr]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchAllEnrollments()])
      .then(([s, e]) => { setStats(s); setEnr(e); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  // Course enrollment counts
  const courseMap = {};
  enrollments.forEach(e => {
    if (!e.course) return;
    courseMap[e.course.title] = (courseMap[e.course.title] || 0) + 1;
  });
  const topCourses = Object.entries(courseMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">Analytics</h1>
        <p className="text-slate-muted text-sm mt-1">Platform performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"  value={stats.totalUsers || 0}       icon={Users}         color="gold" />
        <StatCard label="Total Courses"   value={stats.totalCourses || 0}     icon={BookOpen}      color="green" />
        <StatCard label="Enrollments"     value={stats.totalEnrollments || 0} icon={GraduationCap} color="blue" />
        <StatCard label="Certificates"    value={stats.totalCertificates || 0} icon={Award}        color="gold" />
      </div>

      {/* Top courses */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-gold" />
          <h2 className="font-display text-base font-semibold text-cream">Top Enrolled Courses</h2>
        </div>
        {topCourses.length === 0 ? (
          <p className="text-slate-muted text-sm text-center py-8">No enrollment data yet.</p>
        ) : (
          <div className="space-y-3">
            {topCourses.map(([title, count], i) => {
              const max = topCourses[0][1];
              return (
                <div key={title} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cream flex items-center gap-2">
                      <span className="text-xs text-slate-muted w-4">{i + 1}.</span>
                      {title}
                    </span>
                    <span className="text-gold font-bold">{count}</span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div className="progress-fill" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent enrollments */}
      <Card>
        <h2 className="font-display text-base font-semibold text-cream mb-5">Recent Enrollments</h2>
        {enrollments.length === 0 ? (
          <p className="text-slate-muted text-sm text-center py-8">No enrollments yet.</p>
        ) : (
          <div className="space-y-3">
            {enrollments.slice(0, 10).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2
                border-b border-navy-border/40 last:border-none">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green to-gold
                    flex items-center justify-center text-navy text-xs font-bold">
                    {e.user?.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-cream">{e.user?.name}</p>
                    <p className="text-xs text-slate-muted">{e.course?.title}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-muted">
                  {new Date(e.enrolled_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
