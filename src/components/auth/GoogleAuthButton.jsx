import { useState } from 'react';
import { Shield, User, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoogleAuthButton({ onAuthSuccess, mode = 'login' }) {
  const [showChooser, setShowChooser] = useState(false);
  const [customAccount, setCustomAccount] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // The primary detected Google Account shown in Image 1
  const defaultAccount = {
    name: 'Prabhat Jhanji',
    email: 'prabhatjhanji@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Prabhat%20Jhanji'
  };

  const handleSelectAccount = async (acc) => {
    setLoading(true);
    try {
      const googleProfile = {
        name: acc.name,
        email: acc.email,
        avatar: acc.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}`,
        googleId: `gid_${Date.now()}`
      };
      toast.success(`Signed in as ${acc.name}`);
      await onAuthSuccess(googleProfile);
      setShowChooser(false);
    } catch (err) {
      toast.error('Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      toast.error('Please enter a valid Google email');
      return;
    }
    handleSelectAccount({
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase()
    });
  };

  return (
    <>
      {/* Google Button on Page */}
      <button
        type="button"
        onClick={() => {
          setCustomAccount(false);
          setShowChooser(true);
        }}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-line bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-sm transition-all dark:bg-slate-900 dark:border-ink dark:text-slate-100 dark:hover:bg-slate-800/80"
      >
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

      {/* Google OAuth Modal Window (Pixel-Perfect Mirror of User Screenshot) */}
      {showChooser && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          {/* Main Google Dark Card */}
          <div className="w-full max-w-2xl bg-[#1f1f1f] border border-[#3c4043] rounded-[28px] p-8 shadow-2xl text-[#e8eaed] space-y-6 relative animate-scaleUp">
            {/* Top Google Header */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span className="text-sm font-medium text-[#e8eaed]">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowChooser(false)}
                className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#9aa0a6] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Two-Column Split Layout */}
            <div className="grid md:grid-cols-12 gap-8 pt-2">
              {/* Left Column: App Branding & Heading */}
              <div className="md:col-span-5 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-3xl font-normal text-white tracking-tight leading-tight">
                    Choose an account
                  </h2>
                  <p className="text-sm text-[#8ab4f8] mt-2 font-medium">
                    to continue to TrustMatrix
                  </p>
                </div>
              </div>

              {/* Right Column: Account Selection List */}
              <div className="md:col-span-7 space-y-4">
                {!customAccount ? (
                  <div className="space-y-1">
                    {/* Primary Google Account Card */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectAccount(defaultAccount)}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/[0.08] text-left transition-all group"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shrink-0 overflow-hidden shadow">
                        <img
                          src={defaultAccount.avatar}
                          alt={defaultAccount.name}
                          className="h-full w-full rounded-full object-cover bg-slate-800"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                          {defaultAccount.name}
                        </p>
                        <p className="text-xs text-[#9aa0a6] truncate font-mono">
                          {defaultAccount.email}
                        </p>
                      </div>
                    </button>

                    <div className="border-t border-[#3c4043] my-1" />

                    {/* Use Another Account */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setCustomAccount(true)}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/[0.08] text-left transition-all"
                    >
                      <div className="h-10 w-10 rounded-full bg-white/[0.08] border border-[#3c4043] flex items-center justify-center text-[#e8eaed] shrink-0">
                        <User size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">Use another account</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  /* Custom Account Entry Form */
                  <form onSubmit={handleCustomSubmit} className="space-y-3 p-1">
                    <p className="text-xs text-[#9aa0a6]">Sign in with a different Google Account:</p>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-[#3c4043] text-sm text-white focus:outline-none focus:border-[#8ab4f8]"
                    />
                    <input
                      type="email"
                      placeholder="Email or phone (e.g. user@gmail.com)"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-[#3c4043] text-sm text-white focus:outline-none focus:border-[#8ab4f8]"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setCustomAccount(false)}
                        className="text-xs text-[#8ab4f8] hover:underline"
                      >
                        Back to accounts
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-[#8ab4f8] text-[#202124] text-xs font-semibold hover:bg-opacity-90"
                      >
                        {loading ? 'Continuing...' : 'Next'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Terms Disclaimer */}
                <p className="text-[11px] text-[#9aa0a6] leading-relaxed pt-2">
                  Before using this app, you can review TrustMatrix&apos;s{' '}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                  <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar matching Google Dialog */}
          <div className="w-full max-w-2xl flex items-center justify-between text-xs text-[#9aa0a6] px-4 pt-3">
            <div className="flex items-center gap-1 cursor-pointer hover:text-white">
              <span>English (United States)</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-white cursor-pointer">Help</span>
              <span className="hover:text-white cursor-pointer">Privacy</span>
              <span className="hover:text-white cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
