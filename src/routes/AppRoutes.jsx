import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminRoute from './AdminRoute.jsx';
import GuestRoute from './GuestRoute.jsx';
import FullPageLoader from './FullPageLoader.jsx';

// Pages are code-split so the landing page loads fast.
const Landing = lazy(() => import('../pages/Landing.jsx'));
const Login = lazy(() => import('../pages/Login.jsx'));
const Register = lazy(() => import('../pages/Register.jsx'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Scan = lazy(() => import('../pages/Scan.jsx'));
const Processing = lazy(() => import('../pages/Processing.jsx'));
const Result = lazy(() => import('../pages/Result.jsx'));
const Live = lazy(() => import('../pages/Live.jsx'));
const History = lazy(() => import('../pages/History.jsx'));
const ThreatMap = lazy(() => import('../pages/ThreatMap.jsx'));
const Notifications = lazy(() => import('../pages/Notifications.jsx'));
const Profile = lazy(() => import('../pages/Profile.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const AdminOverview = lazy(() => import('../pages/admin/Overview.jsx'));
const AdminHeadlines = lazy(() => import('../pages/admin/Headlines.jsx'));
const AdminUsers = lazy(() => import('../pages/admin/Users.jsx'));
const AdminScans = lazy(() => import('../pages/admin/Scans.jsx'));
const AdminEntities = lazy(() => import('../pages/admin/Entities.jsx'));
const AdminEvaluate = lazy(() => import('../pages/admin/Evaluate.jsx'));
const AdminBroadcast = lazy(() => import('../pages/admin/Broadcast.jsx'));

const S = ({ children }) => <Suspense fallback={<FullPageLoader />}>{children}</Suspense>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<S><Landing /></S>} />
        <Route element={<GuestRoute />}>
          <Route path="login" element={<S><Login /></S>} />
          <Route path="register" element={<S><Register /></S>} />
        </Route>
        <Route path="forgot-password" element={<S><ForgotPassword /></S>} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<S><Dashboard /></S>} />
          <Route path="scan/:scanId/processing" element={<S><Processing /></S>} />
          <Route path="result/:scanId" element={<S><Result /></S>} />
          <Route path="live" element={<S><Live /></S>} />
          <Route path="history" element={<S><History /></S>} />
          <Route path="threat-map" element={<S><ThreatMap /></S>} />
          <Route path="notifications" element={<S><Notifications /></S>} />
          <Route path="profile" element={<S><Profile /></S>} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<S><AdminOverview /></S>} />
            <Route path="headlines" element={<S><AdminHeadlines /></S>} />
            <Route path="users" element={<S><AdminUsers /></S>} />
            <Route path="scans" element={<S><AdminScans /></S>} />
            <Route path="entities" element={<S><AdminEntities /></S>} />
            <Route path="evaluate" element={<S><AdminEvaluate /></S>} />
            <Route path="broadcast" element={<S><AdminBroadcast /></S>} />
          </Route>
        </Route>

        <Route path="*" element={<S><NotFound /></S>} />
      </Route>

      {/* Scan tool uses a full-height layout without the footer (ChatGPT-style). */}
      <Route element={<AppLayout bare />}>
        <Route element={<ProtectedRoute />}>
          <Route path="scan" element={<S><Scan /></S>} />
        </Route>
      </Route>
    </Routes>
  );
}
