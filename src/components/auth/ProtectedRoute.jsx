import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

/** Redirect to /login if unauthenticated */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

/** Redirect to /dashboard if not admin */
export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuthStore();
  const location = useLocation();

  if (loading)  return <LoadingSpinner fullScreen />;
  if (!user)    return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

/** Redirect to /dashboard if already logged in */
export function GuestRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) return <LoadingSpinner fullScreen />;
  if (user)    return <Navigate to="/dashboard" replace />;

  return children;
}
