import React, { useState, useEffect } from 'react';
import { Disc3, QrCode, Play, Radio, ArrowRight, Sparkles, Music2, Headphones, Users2, ShieldCheck, Heart, CloudCheck } from 'lucide-react';
import { CoupleModal, getStoredCoupleProfile } from './CoupleModal';
import { User } from 'firebase/auth';

interface JoinScreenProps {
  onJoin: (params: {
    roomCode?: string;
    userName: string;
    role: 'host' | 'listener';
    avatar: string;
  }) => void;
  initialRoomCode?: string;
  error?: string | null;
  authUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const AVATARS = ['🎧', '🎸', '🎹', '🎤', '🎷', '🕺', '💃', '⚡', '🔥', '✨', '💖', '💑'];

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onJoin,
  initialRoomCode,
  error,
  authUser,
  onLogin,
  onLogout,
}) => {
  const [mode, setMode] = useState<'options' | 'join_code'>('options');
  const [userName, setUserName] = useState(authUser?.displayName || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isChecking, setIsChecking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
  const coupleProfile = getStoredCoupleProfile();

  useEffect(() => {
    if (authUser?.displayName && !userName) {
      setUserName(authUser.displayName);
    }
  }, [authUser]);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join_code');
    }
  }, [initialRoomCode]);

  const handleStartHost = () => {
    onJoin({
      userName: userName.trim() || 'Host DJ',
      role: 'host',
      avatar: selectedAvatar,
    });
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const code = roomCode.trim().toUpperCase();

    if (!code) {
      setValidationError('Please enter a 4-letter Room Code.');
      return;
    }

    setIsChecking(true);
    try {
      // Validate room existence via API
      const res = await fetch(`/api/rooms/check/${encodeURIComponent(code)}`);
      if (!res.ok) {
        setValidationError('Room not found. Please verify the code or scan the QR code again.');
        setIsChecking(false);
        return;
      }

      onJoin({
        roomCode: code,
        userName: userName.trim() || 'Music Lover',
        role: 'listener',
        avatar: selectedAvatar,
      });
    } catch (err) {
      // If network fails, still attempt join through socket
      onJoin({
        roomCode: code,
        userName: userName.trim() || 'Music Lover',
        role: 'listener',
        avatar: selectedAvatar,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambient Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-900 z-10 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Disc3 className="w-6 h-6 text-black animate-[spin_8s_linear_infinite]" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-none text-white">
              SyncTune
            </h1>
            <span className="text-[11px] text-zinc-400 font-medium">
              Live Together Jam
            </span>
          </div>
        </div>

        {/* Right Corner: Google Account Login for Lifetime Playlist Persistence */}
        <div className="flex items-center gap-3">
          {authUser ? (
            <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-1.5 pr-3 shadow-md">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt=""
                  className="w-8 h-8 rounded-xl object-cover border border-emerald-400/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  {authUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-white truncate max-w-[130px]">
                  {authUser.displayName || 'Music Lover'}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Saved
                </p>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[11px] text-zinc-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-zinc-800 transition font-semibold ml-1"
                  title="Sign out of account"
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95 border border-zinc-200"
              title="Sign in with Google to save playlists forever"
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
              <span>Login / Account</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Center Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          {/* Tagline Box */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Spotify Jam Style · Worldwide Sync
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Listen to Songs Together <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Everywhere in Real-Time
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Host a room, share your QR code with friends, and play synchronized music live across devices!
            </p>
          </div>

          {/* User Name & Avatar selector */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 mb-4 backdrop-blur-md">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Your Name / Nickname
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Alex, Jordan, DJ Max"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={25}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Avatar Choice */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Choose Avatar
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition ${
                      selectedAvatar === av
                        ? 'bg-emerald-500/30 border-2 border-emerald-400 scale-110'
                        : 'bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Errors */}
            {(error || validationError) && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
                {error || validationError}
              </div>
            )}

            {/* If initial room code is found */}
            {initialRoomCode && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <QrCode className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-white">QR Code Scanned!</p>
                  <p className="text-zinc-400">
                    Ready to join Room: <strong className="text-emerald-400">{initialRoomCode}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Action options */}
            {mode === 'options' ? (
              <div className="space-y-3 pt-2">
                {/* Button 1: Host Room */}
                <button
                  type="button"
                  onClick={handleStartHost}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Host a Live Jam</span>
                </button>

                {/* Button 2: Join with Code / QR */}
                <button
                  type="button"
                  onClick={() => setMode('join_code')}
                  className="w-full py-3 px-5 bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-zinc-700 transition active:scale-[0.98]"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Join with Code or QR</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinWithCode} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Enter 4-Letter Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4B7K"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    autoFocus
                    className="w-full px-3.5 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-center font-mono text-xl tracking-widest text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 uppercase font-black"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('options');
                      setValidationError(null);
                    }}
                    className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isChecking}
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
                  >
                    {isChecking ? (
                      <span>Connecting...</span>
                    ) : (
                      <>
                        <span>Join Jam Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Couples & Partners Love Connection Mode Card */}
          <div className="bg-gradient-to-r from-pink-950/40 via-zinc-900/90 to-rose-950/40 border border-pink-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-500/20">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  Two Hearts Jam (Couples & Partners) <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {coupleProfile?.isLinked
                    ? `Linked with ${coupleProfile.partnerName || 'Partner'} ❤️ Direct WhatsApp notifications`
                    : 'Create a private couple link to listen live and send sweet WhatsApp song alerts!'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCoupleModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-black font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 shrink-0"
            >
              {coupleProfile ? 'Couple Hub 💖' : 'Couple Setup 💖'}
            </button>
          </div>

          {/* Quick Features List */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-400">
            <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <span className="block text-emerald-400 font-bold mb-0.5">1-Scan QR</span>
              <span>Direct Join</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <span className="block text-emerald-400 font-bold mb-0.5">Sub-Second</span>
              <span>Audio Sync</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <span className="block text-emerald-400 font-bold mb-0.5">Any Song</span>
              <span>YouTube & Web</span>
            </div>
          </div>
        </div>
      </main>

      {/* Couple Link Modal */}
      <CoupleModal
        isOpen={isCoupleModalOpen}
        onClose={() => setIsCoupleModalOpen(false)}
        onJoinRoom={(code) => {
          setRoomCode(code);
          setMode('join_code');
        }}
      />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400 border-t border-zinc-900">
        SyncTune · Live synchronized music for friends worldwide
      </footer>
    </div>
  );
};
