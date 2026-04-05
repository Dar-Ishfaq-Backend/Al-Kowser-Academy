import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, GraduationCap, Award,
  Users, Settings, LogOut, Bookmark, ChevronLeft,
  BarChart3, PlusCircle, Moon, Sun, Star, LifeBuoy
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const STUDENT_NAV = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/courses',     label: 'Courses',      icon: BookOpen },
  { to: '/bookmarks',   label: 'Bookmarks',    icon: Bookmark },
  { to: '/certificates',label: 'Certificates', icon: Award },
  { to: '/support',     label: 'Support',      icon: LifeBuoy },
];

const ADMIN_NAV = [
  { to: '/admin',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/courses',      label: 'Courses',      icon: BookOpen },
  { to: '/admin/courses/create', label: 'Add Course', icon: PlusCircle },
  { to: '/admin/users',        label: 'Users',        icon: Users },
  { to: '/admin/analytics',    label: 'Analytics',    icon: BarChart3 },
  { to: '/admin/support',      label: 'Support',      icon: LifeBuoy },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { profile, signOut, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const navItems = isAdmin() ? ADMIN_NAV : STUDENT_NAV;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Sign out failed');
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-navy-dark border-r border-navy-border
        flex flex-col transition-all duration-300 z-40
        ${collapsed ? 'w-[70px]' : 'w-[240px]'}`}
    >
      {/* ── Brand ── */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-navy-border
        ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green to-gold
          flex items-center justify-center flex-shrink-0 shadow-gold">
          <span className="font-arabic text-navy text-base font-bold">ك</span>
        </div>
        {!collapsed && (
          <div>
            <div className="font-display text-sm font-bold text-gold tracking-widest uppercase">
              Al Kawser
            </div>
            <div className="text-[10px] text-slate-muted tracking-[0.15em] uppercase">
              {isAdmin() ? 'Admin Panel' : 'Learning Platform'}
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('/admin') || to.endsWith('/dashboard')}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ── User & Footer ── */}
      <div className="border-t border-navy-border p-3 space-y-2">
        {/* Streak badge */}
        {!collapsed && profile?.streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/20">
            <Star size={14} className="text-gold" />
            <span className="text-xs text-gold font-semibold">
              {profile.streak} day streak 🔥
            </span>
          </div>
        )}

        {/* Profile */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green to-gold
              flex items-center justify-center text-navy text-sm font-bold flex-shrink-0">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-cream truncate">{profile?.name}</p>
              <p className="text-[10px] text-slate-muted truncate capitalize">{profile?.role}</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={`nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={`nav-link w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <ChevronLeft
            size={16}
            className={`flex-shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
