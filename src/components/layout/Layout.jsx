import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ title }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-navy pattern-overlay">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? '70px' : '240px' }}
      >
        <Navbar onMenuToggle={() => setCollapsed(c => !c)} title={title} />
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto page-enter">
            <Outlet />
          </div>
        </main>
        <footer className="text-center text-[11px] text-slate-muted py-4 border-t border-navy-border/50">
          © {new Date().getFullYear()} Al Kawser Islamic Learning Platform · Built with{' '}
          <span className="text-gold">♥</span> for the Ummah
        </footer>
      </div>
    </div>
  );
}
