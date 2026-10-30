import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';
import { setUnauthorizedHandler } from './api/axios.js';

/**
 * Root component: restores the session, wires the 401 handler and renders routes + toasts.
 */
export default function App() {
  const init = useAuthStore((s) => s.init);
  const clearSession = useAuthStore((s) => s.clearSession);
  const theme = useThemeStore((s) => s.theme);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, [init]);

  // Any 401 from the API logs the user out and sends them to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate('/login', { replace: true });
    });
  }, [clearSession, navigate]);

  const dark = theme === 'dark';
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: dark ? '#1e293b' : '#ffffff',
            color: dark ? '#e2e8f0' : '#334155',
            border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            fontSize: '14px',
          },
        }}
      />
    </>
  );
}
