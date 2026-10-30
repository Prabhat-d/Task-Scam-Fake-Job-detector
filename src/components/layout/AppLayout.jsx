import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeadlineTicker from './HeadlineTicker.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import RealtimeBridge from './RealtimeBridge.jsx';
import SosButton from './SosButton.jsx';
import { useAuthStore } from '../../store/authStore.js';

/**
 * Global layout: ticker → navbar → page → footer.
 * `bare` hides the footer (full-height tools like Scan).
 */
export default function AppLayout({ bare = false }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  // The result page has its own sticky action bar with Call 1930.
  const showSos = !pathname.startsWith('/result');
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] btn btn-primary">{t('common.skipToContent')}</a>
      <HeadlineTicker />
      <Navbar />
      {user && <RealtimeBridge />}
      <main id="main" className="flex-1 flex flex-col">
        <Outlet />
      </main>
      {!bare && <Footer />}
      {showSos && <SosButton />}
    </div>
  );
}
