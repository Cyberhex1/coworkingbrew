import React, { useState } from 'react';
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logOut,
} from '../firebase';
import { User } from 'firebase/auth';
import { soundEngine } from '../utils/audioSynth';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  LogOut,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      soundEngine.playCoin();
      confetti({ particleCount: 30, spread: 60 });
      setSuccessNotice(`Welcome, ${user.displayName || 'Coworker'}!`);
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1200);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      let user: User;
      if (tab === 'signup') {
        user = await signUpWithEmail(email, password, displayName || 'Cozy Member');
        setSuccessNotice(`Account registered! Welcome, ${user.displayName || displayName}!`);
      } else {
        user = await signInWithEmail(email, password);
        setSuccessNotice(`Welcome back, ${user.displayName || user.email}!`);
      }
      soundEngine.playCoin();
      confetti({ particleCount: 35, spread: 60 });
      if (onAuthSuccess) onAuthSuccess(user);
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1200);
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'Email/Password sign-in is not enabled yet in your Firebase console. Please enable it in Firebase Console > Authentication > Sign-in method, or sign in with Google below!'
        );
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Please check your credentials or create a new account.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please switch to the Sign In tab.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      soundEngine.playChime('chime');
      setSuccessNotice('Signed out successfully.');
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign out failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="w-full max-w-md bg-[#161226] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-purple-100 flex flex-col relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-800/40 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-xl shadow-lg">
              ☕
            </div>
            <div>
              <h2 className="font-cozy font-bold text-base sm:text-lg text-white">Cafe Member Pass</h2>
              <p className="text-[11px] text-purple-300">Firebase Cloud Sync & Account Login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-900/60 text-purple-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 bg-rose-950/70 border border-rose-500/50 text-rose-200 p-3 rounded-2xl text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* If Already Logged In */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="bg-purple-950/50 border border-purple-700/50 rounded-2xl p-4 flex items-center gap-3.5 shadow-inner">
              <div className="w-12 h-12 rounded-2xl bg-purple-700/60 border border-purple-400/40 flex items-center justify-center text-lg font-bold text-white shadow-md overflow-hidden">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm truncate font-cozy">
                    {currentUser.displayName || 'Cozy Coworker'}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                    Synced
                  </span>
                </div>
                <p className="text-xs text-purple-300 truncate font-mono mt-0.5">{currentUser.email}</p>
                <div className="flex items-center gap-1 text-[10px] text-purple-400 mt-1">
                  <Cloud className="w-3 h-3 text-cyan-400" />
                  <span>Firestore Cloud Sync Active</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-900/30 rounded-xl border border-purple-800/40 text-[11px] text-purple-200 space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Connected to mentalmedic-82280</span>
              </div>
              <p className="text-purple-300">
                Your tickets, bookshelves, reading bookmarks, and desk workstations are safely synchronized.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 bg-purple-950/70 hover:bg-rose-950/80 border border-purple-800 hover:border-rose-700/60 text-purple-200 hover:text-rose-200 rounded-xl text-xs font-cozy font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Cafe Member Pass</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-cozy font-bold text-xs shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2 text-[11px] text-purple-400">
              <div className="flex-1 h-px bg-purple-800/40" />
              <span>or with email</span>
              <div className="flex-1 h-px bg-purple-800/40" />
            </div>

            {/* Email / Password Tabs */}
            <div className="flex rounded-xl bg-purple-950/60 p-1 border border-purple-800/40 text-xs font-cozy">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'login' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'signup' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {tab === 'signup' && (
                <div>
                  <label className="text-[11px] font-cozy text-purple-300 block mb-1">Display Name</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Maya Lin"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-purple-950/80 border border-purple-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-purple-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-cozy text-purple-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-purple-950/80 border border-purple-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-purple-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-cozy text-purple-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-purple-950/80 border border-purple-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-purple-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-cozy font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Please wait...</span>
                ) : tab === 'signup' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Cafe Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Coworking Brew</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
