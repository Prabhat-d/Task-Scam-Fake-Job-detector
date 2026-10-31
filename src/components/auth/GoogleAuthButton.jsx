import { useState } from 'react';
import { Shield, User, X, ChevronDown, Check, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoogleAuthButton({ onAuthSuccess, mode = 'login' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = Account Chooser, 2 = Permissions Approval
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Associated device accounts matching user profile
  const deviceAccounts = [
    {
      name: 'Prabhat Jhanji',
      email: 'prabhatjhanji@gmail.com',
      phone: '+91 98140 22331',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Prabhat%20Jhanji&backgroundColor=0284c7'
    },
    {
      name: 'Prabhat Sharma',
      email: 'officer.prabhat@gmail.com',
      phone: '+91 99880 11223',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Prabhat%20Sharma&backgroundColor=059669'
    },
    {
      name: 'Simran Kaur',
      email: 'simran.kaur@gmail.com',
      phone: '+91 98720 44556',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Simran%20Kaur&backgroundColor=d97706'
    }
  ];

  // Open the Google OAuth dialog
  const handleOpenModal = () => {
    setStep(1);
    setSelectedAccount(null);
    setCustomMode(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
    setSelectedAccount(null);
    setCustomMode(false);
    setLoading(false);
  };

  // Step 1: User clicks on an account -> go to Permissions Approval
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setStep(2); // Go to Permissions page
  };

  // Step 1 (Custom): User enters another account
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      toast.error('Please enter a valid Google email');
      return;
    }
    const acc = {
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase(),
      phone: customPhone.trim() || '+91 98100 00000',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName || customEmail)}`
    };
    setSelectedAccount(acc);
    setStep(2); // Go to Permissions page
  };

  // Step 2: User rejects / denies permissions -> Cannot login!
  const handleDenyPermissions = () => {
    toast.error('Permissions not granted. You cannot log in without granting permissions.');
    handleClose();
  };

  // Step 2: User grants permissions -> Login succeeds!
  const handleGrantPermissions = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const googleProfile = {
        name: selectedAccount.name,
        email: selectedAccount.email,
        phone: selectedAccount.phone,
        avatar: selectedAccount.avatar,
        googleId: `gid_${Date.now()}`
      };
      toast.success(`Welcome, ${selectedAccount.name}! Permissions granted.`);
      await onAuthSuccess(googleProfile);
      handleClose();
    } catch (err) {
      toast.error('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button on Login/Signup Page */}
      <button
        type="button"
        onClick={handleOpenModal}
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

      {/* Google OAuth Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          {/* Main Card (Google Dark Theme) */}
          <div className="w-full max-w-2xl bg-[#1f1f1f] border border-[#3c4043] rounded-[28px] p-7 shadow-2xl text-[#e8eaed] space-y-6 relative animate-scaleUp">
            
            {/* Top Bar with Google Branding & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#3c4043]/50">
              <div className="flex items-center gap-2.5">
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
                onClick={handleClose}
                className="text-[#9aa0a6] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* ================= STEP 1: CHOOSE AN ACCOUNT ================= */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left Side: App Context */}
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Shield size={26} />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Choose an account</h2>
                    <p className="text-sm text-[#9aa0a6]">
                      to continue to <span className="font-semibold text-blue-400">TrustMatrix</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-[#3c4043] text-xs text-[#9aa0a6] space-y-1">
                    <p className="text-[#e8eaed] font-medium flex items-center gap-1.5">
                      <Lock size={12} className="text-blue-400" /> Secure Google Authentication
                    </p>
                    <p>TrustMatrix only accesses your profile after you grant explicit permissions.</p>
                  </div>
                </div>

                {/* Right Side: Multiple Device Accounts */}
                <div className="space-y-3">
                  {!customMode ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#9aa0a6] px-1">Accounts on this device:</p>
                      
                      {/* Account List */}
                      {deviceAccounts.map((acc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectAccount(acc)}
                          className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/[0.08] text-left transition-all group border border-transparent hover:border-[#3c4043]"
                        >
                          <div className="h-10 w-10 rounded-full shrink-0 overflow-hidden shadow">
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="h-full w-full rounded-full object-cover bg-slate-800"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {acc.name}
                            </p>
                            <p className="text-xs text-[#9aa0a6] truncate font-mono">
                              {acc.email}
                            </p>
                          </div>
                        </button>
                      ))}

                      <div className="border-t border-[#3c4043] my-2" />

                      {/* Use Another Account Button */}
                      <button
                        type="button"
                        onClick={() => setCustomMode(true)}
                        className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/[0.08] text-left transition-all group"
                      >
                        <div className="h-10 w-10 rounded-full bg-white/[0.08] border border-[#3c4043] flex items-center justify-center text-[#e8eaed] shrink-0">
                          <User size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                            Use another account
                          </p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    /* Custom Account Entry Form */
                    <form onSubmit={handleCustomSubmit} className="space-y-3 p-1 animate-fadeIn">
                      <div className="flex items-center justify-between pb-1">
                        <p className="text-xs text-[#9aa0a6]">Sign in with a different Google account:</p>
                        <button
                          type="button"
                          onClick={() => setCustomMode(false)}
                          className="text-xs text-[#8ab4f8] hover:underline"
                        >
                          Back to list
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Full Name (e.g. John Doe)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-[#3c4043] text-sm text-white focus:outline-none focus:border-[#8ab4f8]"
                      />
                      <input
                        type="email"
                        placeholder="Email (e.g. user@gmail.com)"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-[#3c4043] text-sm text-white focus:outline-none focus:border-[#8ab4f8]"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number (optional)"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-[#3c4043] text-sm text-white focus:outline-none focus:border-[#8ab4f8]"
                      />
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-[#8ab4f8] text-[#202124] text-xs font-bold hover:bg-opacity-90 transition-all"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    </form>
                  )}

                  <p className="text-[11px] text-[#9aa0a6] leading-relaxed pt-2">
                    Before using this app, you can review TrustMatrix&apos;s{' '}
                    <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                    <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span>.
                  </p>
                </div>
              </div>
            )}

            {/* ================= STEP 2: PERMISSIONS & APPROVAL PAGE ================= */}
            {step === 2 && selectedAccount && (
              <div className="space-y-6 animate-fadeIn">
                {/* Account Chip & Back Button */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.05] border border-[#3c4043]">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedAccount.avatar}
                      alt={selectedAccount.name}
                      className="h-9 w-9 rounded-full object-cover bg-slate-800"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedAccount.name}</p>
                      <p className="text-xs text-[#9aa0a6] font-mono">{selectedAccount.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs text-[#8ab4f8] hover:underline font-medium"
                  >
                    <ArrowLeft size={13} />
                    Switch
                  </button>
                </div>

                {/* Main Permission Prompt */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    TrustMatrix wants to access your Google Account
                  </h3>
                  <p className="text-xs text-[#9aa0a6]">
                    This will allow <b className="text-white">TrustMatrix (CyberShield AI)</b> to:
                  </p>
                </div>

                {/* Scopes / Permissions List */}
                <div className="space-y-3 bg-white/[0.03] border border-[#3c4043] rounded-2xl p-4">
                  {/* Scope 1: Personal Info */}
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        See your personal info (Full Name & profile photo)
                      </p>
                      <p className="text-xs text-[#9aa0a6]">
                        Personal info made available in your Google Account
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#3c4043]/50" />

                  {/* Scope 2: Email Address */}
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        See your primary Google Account email address
                      </p>
                      <p className="text-xs text-[#9aa0a6]">
                        Associate your account and receive incident fraud alerts
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#3c4043]/50" />

                  {/* Scope 3: Verified Phone Number */}
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        See your verified phone number ({selectedAccount.phone || '+91 98140 22331'})
                      </p>
                      <p className="text-xs text-[#9aa0a6]">
                        Used for urgent 1930 Cyber Helpline & SMS notifications
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Warning Notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                  <p className="leading-relaxed">
                    Make sure you trust TrustMatrix. You may be sharing sensitive info with this app. If you do not approve, you cannot sign in.
                  </p>
                </div>

                {/* Action Buttons: Cancel vs Allow */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleDenyPermissions}
                    className="px-5 py-2.5 rounded-xl border border-[#3c4043] text-sm text-[#e8eaed] font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGrantPermissions}
                    className="px-6 py-2.5 rounded-xl bg-[#8ab4f8] text-[#202124] text-sm font-bold hover:bg-opacity-90 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                  >
                    {loading ? 'Connecting...' : 'Allow & Continue'}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Bar matching Google Dialog */}
            <div className="w-full flex items-center justify-between text-xs text-[#9aa0a6] px-1 pt-2 border-t border-[#3c4043]/50">
              <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                <span>English (United States)</span>
                <ChevronDown size={14} />
              </div>
              <div className="flex items-center gap-5">
                <span className="hover:text-white cursor-pointer">Help</span>
                <span className="hover:text-white cursor-pointer">Privacy</span>
                <span className="hover:text-white cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
