import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Check,
  Copy,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Smartphone,
  Globe,
} from 'lucide-react';
import { AuthErrorInfo } from '../hooks/useFirebaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAuthenticating: boolean;
  authError: AuthErrorInfo | null;
  onLoginGoogle: () => Promise<any>;
  onLoginRedirect: () => Promise<any>;
  onLogout: () => Promise<any>;
  onClearError: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  isAuthenticating,
  authError,
  onLoginGoogle,
  onLoginRedirect,
  onLogout,
  onClearError,
}) => {
  const [copied, setCopied] = useState(false);
  const [showVercelGuide, setShowVercelGuide] = useState(false);

  if (!isOpen) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const isVercelHost = currentDomain.includes('vercel.app') || currentDomain.includes('run.app');

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGoogleClick = async () => {
    try {
      await onLoginGoogle();
      onClose();
    } catch (e) {
      // Error handled in hook state
    }
  };

  const handleRedirectClick = async () => {
    try {
      await onLoginRedirect();
    } catch (e) {
      // Error handled in hook state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 text-white space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-1.5 text-white">
                Account & Cloud Sync
              </h3>
              <p className="text-xs text-zinc-400">
                Save playlists and couple connections forever
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClearError();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALREADY LOGGED IN STATE */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950/80 border border-emerald-500/30 rounded-2xl flex items-center gap-3.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400/50"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-lg flex items-center justify-center">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white truncate">
                  {user.displayName || 'Music Lover'}
                </p>
                <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Cloud Synced
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                await onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-rose-950/50 text-zinc-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN STATE */
          <div className="space-y-4">
            {/* Error Banner: Unauthorized Domain on Vercel */}
            {authError?.isUnauthorizedDomain && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-3 text-left animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Vercel Domain Setup Required
                    </h4>
                    <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                      Google OAuth requires your Vercel URL to be whitelisted in Firebase Console before mobile logins can open.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-black/60 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-amber-300 truncate font-semibold">
                    {currentDomain}
                  </span>
                  <button
                    onClick={handleCopyDomain}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 transition shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-zinc-300 space-y-1 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <p className="font-bold text-white text-xs mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    How to fix in 1 minute:
                  </p>
                  <p>1. Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a></p>
                  <p>2. Select your project & go to <strong>Authentication &gt; Settings</strong> tab.</p>
                  <p>3. Under <strong>Authorized domains</strong>, click <strong>Add domain</strong> and paste <code>{currentDomain}</code>.</p>
                  <p>4. Save, then tap Sign In below!</p>
                </div>
              </div>
            )}

            {/* Error Banner: Mobile Popup Blocked */}
            {authError?.isPopupBlocked && (
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/50 rounded-2xl text-left space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Popup Blocked by Mobile Browser</span>
                </div>
                <p className="text-[11px] text-cyan-100/90 leading-relaxed">
                  Your phone's browser blocked the popup. Use the <strong>Page Redirect</strong> button below to sign in directly without popups.
                </p>
              </div>
            )}

            {/* Generic Error */}
            {authError && !authError.isUnauthorizedDomain && !authError.isPopupBlocked && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-300">
                {authError.message}
              </div>
            )}

            {/* Sign in with Google (Popup) */}
            <button
              onClick={handleGoogleClick}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition border border-zinc-200 disabled:opacity-50"
            >
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
              <span>{isAuthenticating ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Mobile Redirect Alternative Button */}
            <button
              onClick={handleRedirectClick}
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-zinc-700/60 transition active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mobile Phone Direct Sign-In (No Popups)</span>
            </button>

            {/* Vercel Domain Info Box */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowVercelGuide(!showVercelGuide)}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 font-semibold inline-flex items-center gap-1 transition"
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Hosting on Vercel? Check Authorized Domains setup</span>
              </button>

              {showVercelGuide && (
                <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-left text-[11px] text-zinc-400 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Current Domain:</span>
                    <button
                      onClick={handleCopyDomain}
                      className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <code className="block p-1.5 bg-zinc-900 rounded font-mono text-[10px] text-emerald-400 break-all">
                    {currentDomain}
                  </code>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Add this domain in Firebase Console under Authentication &gt; Settings &gt; Authorized Domains to enable Google Sign-In on your live site.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
