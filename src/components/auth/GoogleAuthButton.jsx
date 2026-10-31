import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

export default function GoogleAuthButton({ onAuthSuccess, mode = 'login' }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch verified user profile directly from Google servers
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch verified Google profile');

        const userInfo = await res.json();
        // userInfo contains authentic Google data: { sub, name, email, picture, email_verified }
        await onAuthSuccess({
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
          googleId: userInfo.sub
        });
        toast.success(`Welcome, ${userInfo.name}!`);
      } catch (err) {
        console.error('Google profile fetch error:', err);
        toast.error('Google Sign-In failed. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      toast.error('Google Sign-In was cancelled.');
    },
    flow: 'implicit'
  });

  const handleClick = () => {
    if (!clientId || clientId.trim() === '' || clientId.includes('YOUR_')) {
      toast.error('Google Client ID not set yet. Please paste your Client ID into Frontend/.env');
      return;
    }
    login();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-line bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-sm transition-all dark:bg-slate-900 dark:border-ink dark:text-slate-100 dark:hover:bg-slate-800/80"
    >
      {/* Official Google G Logo */}
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
    </button>
  );
}
