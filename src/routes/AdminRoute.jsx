import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { isAdmin } from '../utils/roles.js';
import FullPageLoader from './FullPageLoader.jsx';

/** Only role === "admin". Logged-in non-admins are sent to their dashboard. */
export default function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  // Wait for the session check; redirecting before it finishes bounces admins to /login.
  if (status !== 'ready') return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin(user)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
