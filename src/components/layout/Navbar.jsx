import { Bell, Search, Menu } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar({ onMenuToggle, title = '' }) {
  const { profile } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between
      px-6 bg-navy/90 backdrop-blur-md border-b border-navy-border">

      {/* Left: menu + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="text-slate-muted hover:text-cream transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="font-display text-base font-semibold text-cream tracking-wide hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Right: search + notif + avatar */}
      <div className="flex items-center gap-3">
        {/* Search bar (decorative, can hook up later) */}
        <div className="hidden md:flex items-center gap-2 bg-navy-dark border border-navy-border
          rounded-xl px-3 py-2 text-sm text-slate-muted w-48 cursor-pointer
          hover:border-gold/30 transition-all">
          <Search size={14} />
          <span>Search courses…</span>
        </div>

        {/* Notification bell */}
        <button className="relative text-slate-muted hover:text-cream transition-colors p-2
          rounded-xl hover:bg-navy-border/50">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green to-gold
          flex items-center justify-center text-navy text-sm font-bold cursor-pointer
          hover:shadow-gold transition-all">
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}
