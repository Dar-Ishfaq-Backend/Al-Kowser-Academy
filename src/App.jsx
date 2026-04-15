import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import { missingSupabaseEnv, supabaseConfigError } from './lib/supabase';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/index.jsx';

// Auth
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyCertificate from './pages/public/VerifyCertificate';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses   from './pages/admin/AdminCourses';
import CreateCourse   from './pages/admin/CreateCourse';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCertificates from './pages/admin/AdminCertificates';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import CourseCatalog    from './pages/student/CourseCatalog';
import CourseDetail     from './pages/student/CourseDetail';
import CoursePlayer     from './pages/student/CoursePlayer';
import Certificates     from './pages/student/Certificates';
import Bookmarks        from './pages/student/Bookmarks';
import Support          from './pages/student/Support';
import AdminSupport     from './pages/admin/AdminSupport';

function ConfigErrorScreen() {
  return (
    <div className="min-h-screen bg-navy text-cream flex items-center justify-center p-6 pattern-overlay">
      <div className="w-full max-w-2xl glass-card p-8 md:p-10 border border-red-500/20 shadow-glass space-y-6">
        <div className="space-y-3">
          <p className="font-display text-sm tracking-[0.3em] uppercase text-red-300">
            Configuration Required
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-gold">
            The app is loading, but Supabase is not configured yet.
          </h1>
          <p className="text-cream-muted leading-7">
            This is why you were seeing a blank page. The app was crashing during startup before React could render anything useful.
          </p>
        </div>

        <div className="rounded-2xl border border-navy-border bg-navy-dark/60 p-5 space-y-3">
          <p className="text-sm font-semibold text-cream">Missing variables</p>
          <ul className="space-y-2 text-sm text-cream-muted">
            {missingSupabaseEnv.map((name) => (
              <li key={name} className="font-mono">{name}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 text-sm text-cream-muted">
          <p>Fix:</p>
          <p>1. Copy <code>.env.example</code> to <code>.env</code></p>
          <p>2. Fill in your real Supabase project URL and anon key</p>
          <p>3. Restart the Vite dev server</p>
        </div>

        <p className="text-xs text-slate-muted font-mono break-words">
          {supabaseConfigError}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  if (supabaseConfigError) return <ConfigErrorScreen />;
  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F1E35',
            color: '#E8DCC8',
            border: '1px solid #1C2E4A',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#2A8B62', secondary: '#0A1628' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#0A1628' } },
        }}
      />

      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />

        {/* ── Student ── */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"              element={<StudentDashboard />} />
          <Route path="/courses"                element={<CourseCatalog />} />
          <Route path="/courses/:id"            element={<CourseDetail />} />
          <Route path="/bookmarks"              element={<Bookmarks />} />
          <Route path="/certificates"           element={<Certificates />} />
          <Route path="/support"                element={<Support />} />
        </Route>

        {/* ── Course Player (no regular sidebar/navbar) ── */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/courses/:id/learn"      element={<CoursePlayer />} />
        </Route>

        {/* ── Admin ── */}
        <Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
          <Route index                          element={<AdminDashboard />} />
          <Route path="courses"                 element={<AdminCourses />} />
          <Route path="courses/create"          element={<CreateCourse />} />
          <Route path="courses/:id/edit"        element={<CreateCourse />} />
          <Route path="users"                   element={<AdminUsers />} />
          <Route path="analytics"               element={<AdminAnalytics />} />
          <Route path="certificates"            element={<AdminCertificates />} />
          <Route path="support"                 element={<AdminSupport />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
            <p className="font-arabic text-3xl text-gold">الكوثر</p>
            <h1 className="font-display text-4xl font-bold text-cream">404</h1>
            <p className="text-slate-muted">Page not found</p>
            <a href="/dashboard" className="btn-gold">Go Home</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
