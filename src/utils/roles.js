/** Single admin check used by routes, navbar and the mock API (role may come back as "Admin"/"ADMIN"). */
export const isAdmin = (user) => String(user?.role || '').toLowerCase() === 'admin';

/** Where a user lands after login when nothing else was requested. */
export const homeFor = (user) => (isAdmin(user) ? '/admin' : '/dashboard');

/**
 * The page to return to after login (keeps ?query and #hash).
 * Admin pages are only returned to for admins, so a user never loops between /admin and /dashboard.
 */
export const returnPath = (from, user) => {
  if (!from?.pathname || from.pathname === '/login' || from.pathname === '/register') return null;
  if (from.pathname.startsWith('/admin') && !isAdmin(user)) return null;
  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
};
