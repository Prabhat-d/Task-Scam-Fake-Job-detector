import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { ExternalLink, X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * GoogleAuthButton
 * Uses the genuine Google Identity Services SDK via @react-oauth/google.
 * Opens Google's official account chooser (accounts.google.com).
 * Validates real Google accounts via Google UserInfo API.
 */
export default function GoogleAuthButton({ onAuthSuccess, mode = 'login' }) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Fetch verified profile from official Google OAuth2 UserInfo endpoint
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch verified Google profile');

        const userInfo = await res.json();
        // Genuine profile returned by Google
        await onAuthSuccess({
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
          googleId: userInfo.sub
        });
        toast.success(`Welcome, ${userInfo.name}!`);
      } catch (err) {
        console.error('[GoogleAuth] Profile fetch error:', err);
        toast.error('Failed to verify Google account credentials.');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('[GoogleAuth] OAuth error:', error);
      toast.error('Google Sign-In was cancelled or failed.');
    },
    flow: 'implicit'
  });

  const handleClick = () => {
    // Check if client ID is configured
    if (!clientId || clientId.trim() === '' || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      setShowConfigModal(true);
      return;
    }
    login();
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-line bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-sm transition-all dark:bg-slate-900 dark:border-ink dark:text-slate-100 dark:hover:bg-slate-800/80 disabled:opacity-50"
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
        <span>
          {loading
            ? 'Connecting to Google...'
            : mode === 'register'
            ? 'Sign up with Google'
            : 'Continue with Google'}
        </span>
      </button>

      {/* Helpful Setup Modal if VITE_GOOGLE_CLIENT_ID is not yet configured */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-page border border-line rounded-2xl p-6 shadow-2xl text-heading space-y-4 relative animate-scaleUp dark:border-ink">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="absolute right-4 top-4 text-subtle hover:text-heading"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Setup Real Google OAuth</h3>
                <p className="text-xs text-subtle">Requires Google Cloud OAuth 2.0 Client ID</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} /> Genuine Google Authentication
              </p>
              <p>
                To open the official Google account chooser, connect your Google Cloud Console Client ID.
              </p>
            </div>

            <div className="text-xs space-y-2.5 text-subtle leading-relaxed">
              <p className="font-medium text-heading">3 Easy Steps (Takes 60 seconds):</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  Open{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    Google Cloud Console <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  Click <b>Create Credentials &rarr; OAuth Client ID</b> (Application type: <b>Web application</b>)
                </li>
                <li>
                  Set <b>Authorized JavaScript origins</b> to: <code className="bg-card px-1.5 py-0.5 rounded mono text-primary">http://localhost:5173</code>
                </li>
                <li>
                  Copy your Client ID and paste it into <code className="bg-card px-1.5 py-0.5 rounded mono text-primary">Frontend/.env</code>:
                  <div className="mt-1 p-2 bg-card rounded mono text-[11px] select-all border border-line dark:border-ink break-all">
                    VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
                  </div>
                </li>
              </ol>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
