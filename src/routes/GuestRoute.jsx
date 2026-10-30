import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { homeFor, returnPath } from '../utils/roles.js';
import FullPageLoader from './FullPageLoader.jsx';

/** Login/register: already logged-in users go straight to where they wanted (or their home page). */
export default function GuestRoute() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status !== 'ready') return <FullPageLoader />;
  if (user) return <Navigate to={returnPath(location.state?.from, user) || homeFor(user)} replace />;
  return <Outlet />;
}
