import { useEffect, useState } from 'react';
import { BookOpen, Users, GraduationCap, Award, TrendingUp, ArrowRight, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { fetchAdminStats } from '../../services/progressService';
import { fetchAllCoursesAdmin } from '../../services/courseService';
import { fetchAdminSupportTickets, isSupportSetupError } from '../../services/supportService';
import { StatCard, Card } from '../../components/ui/index.jsx';

export default function AdminDashboard() {
  const { profile }          = useAuthStore();
  const [stats, setStats]    = useState({});
  const [courses, setCourses]= useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportReady, setSupportReady] = useState(true);
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminStats(),
      fetchAllCoursesAdmin(),
      fetchAdminSupportTickets({ limit: 5 }).catch((err) => {
        if (!isSupportSetupError(err)) {
          console.error(err);
        }
        setSupportReady(false);
        return [];
      }),
    ])
      .then(([s, c, support]) => {
        setStats(s);
        setCourses(c.slice(0, 5));
        setSupportTickets(support);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-slate-muted text-sm mb-1">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold text-cream">
          {profile?.name} ✨
        </h1>
        <p className="text-slate-muted text-sm mt-1">
          Al Kawser Admin — Manage your Islamic learning platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.totalUsers || 0}
          icon={Users} color="gold" />
        <StatCard label="Total Courses" value={stats.totalCourses || 0}
          icon={BookOpen} color="green" />
        <StatCard label="Enrollments" value={stats.totalEnrollments || 0}
          icon={GraduationCap} color="blue" />
        <StatCard label="Certificates" value={stats.totalCertificates || 0}
          icon={Award} color="gold" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-lg font-semibold text-cream mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Create New Course', to: '/admin/courses/create', icon: BookOpen, color: 'gold' },
            { label: 'Manage Users',      to: '/admin/users',          icon: Users,   color: 'green' },
            { label: 'View Analytics',    to: '/admin/analytics',      icon: TrendingUp, color: 'blue' },
            { label: 'Support Inbox',     to: '/admin/support',        icon: LifeBuoy, color: 'gold' },
          ].map(({ label, to, icon: Icon, color }) => (
            <Link key={to} to={to}
              className="glass-card p-5 flex items-center gap-4 hover:border-gold/30
                hover:shadow-gold transition-all duration-200 group">
              <div className={`p-3 rounded-xl ${
                color === 'gold'  ? 'bg-gold/10 border-gold/20 text-gold' :
                color === 'green' ? 'bg-green/10 border-green/20 text-green-light' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
              } border`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-cream text-sm group-hover:text-gold transition-colors">
                  {label}
                </p>
              </div>
              <ArrowRight size={16} className="text-slate-muted group-hover:text-gold
                group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-cream">Recent Courses</h2>
          <Link to="/admin/courses"
            className="text-sm text-gold hover:text-gold-light flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <Card className="p-0 overflow-hidden">
          {courses.length === 0 ? (
            <div className="text-center py-12 text-slate-muted text-sm">
              No courses yet. <Link to="/admin/courses/create" className="text-gold">Create your first course</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-border">
                  <th className="text-left text-xs text-slate-muted font-semibold p-4 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="text-left text-xs text-slate-muted font-semibold p-4 uppercase tracking-wider hidden md:table-cell">
                    Level
                  </th>
                  <th className="text-left text-xs text-slate-muted font-semibold p-4 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left text-xs text-slate-muted font-semibold p-4 uppercase tracking-wider">
                    Lessons
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c, i) => (
                  <tr key={c.id}
                    className={`border-b border-navy-border/50 hover:bg-navy-border/20 transition-colors
                      ${i === courses.length - 1 ? 'border-none' : ''}`}>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-cream line-clamp-1">{c.title}</p>
                      <p className="text-xs text-slate-muted">{c.category}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`badge-${c.level === 'beginner' ? 'green' : 'gold'}`}>
                        {c.level}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={c.is_published
                        ? 'text-green-light text-xs font-semibold'
                        : 'text-slate-muted text-xs'}>
                        {c.is_published ? '● Published' : '○ Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-cream">{c.total_lessons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Recent Support */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-cream">Recent Support Requests</h2>
          <Link to="/admin/support"
            className="text-sm text-gold hover:text-gold-light flex items-center gap-1">
            Open inbox <ArrowRight size={14} />
          </Link>
        </div>

        <Card className="p-0 overflow-hidden">
          {!supportReady ? (
            <div className="text-center py-10 text-slate-muted text-sm">
              Run the latest Supabase SQL to enable the support inbox.
            </div>
          ) : supportTickets.length === 0 ? (
            <div className="text-center py-10 text-slate-muted text-sm">
              No complaints yet.
            </div>
          ) : (
            <div className="divide-y divide-navy-border/50">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cream truncate">{ticket.subject}</p>
                    <p className="text-xs text-slate-muted mt-1 truncate">
                      {ticket.user?.name || ticket.user?.email || 'Student'} • {ticket.course?.title || 'General issue'}
                    </p>
                  </div>
                  <span className={
                    ticket.status === 'resolved'
                      ? 'badge-green'
                      : ticket.status === 'in_progress'
                        ? 'badge-blue'
                        : 'badge-gold'
                  }>
                    {ticket.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
