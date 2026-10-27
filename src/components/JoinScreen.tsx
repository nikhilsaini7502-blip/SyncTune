import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Sparkles,
  Headphones,
  Users2,
  Heart,
  Loader2,
  AlertCircle,
  Music,
  User as UserIcon,
  Shuffle,
  SkipBack,
  SkipForward,
  Pause,
  Guitar,
  Mic,
  Zap,
  Flame,
  Gamepad2,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { CoupleModal, getStoredCoupleProfile } from './CoupleModal';
import { AuthModal } from './AuthModal';
import { User } from 'firebase/auth';
import { AuthErrorInfo } from '../hooks/useFirebaseAuth';

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
  isAuthenticating?: boolean;
  authError?: AuthErrorInfo | null;
  onLogin?: () => Promise<any>;
  onLoginRedirect?: () => Promise<any>;
  onLogout?: () => Promise<any>;
  onClearAuthError?: () => void;
}

interface AvatarOption {
  id: string;
  char: string;
  label: string;
  type: 'icon' | 'emoji';
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'headphones', char: '🎧', label: 'Headphones', type: 'icon' },
  { id: 'guitar', char: '🎸', label: 'Guitar', type: 'icon' },
  { id: 'piano', char: '🎹', label: 'Piano', type: 'icon' },
  { id: 'mic', char: '🎤', label: 'Mic', type: 'icon' },
  { id: 'sax', char: '🎷', label: 'Sax', type: 'emoji' },
  { id: 'runner', char: '🏃', label: 'Runner', type: 'icon' },
  { id: 'gamepad', char: '🎮', label: 'Gamepad', type: 'icon' },
  { id: 'lightning', char: '⚡', label: 'Lightning', type: 'icon' },
  { id: 'flame', char: '🔥', label: 'Flame', type: 'icon' },
  { id: 'sparkles', char: '✨', label: 'Sparkles', type: 'icon' },
];

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onJoin,
  initialRoomCode,
  error,
  authUser,
  isAuthenticating = false,
  authError = null,
  onLogin,
  onLoginRedirect,
  onLogout,
  onClearAuthError,
}) => {
  const [mode, setMode] = useState<'options' | 'join_code'>('options');
  const [userName, setUserName] = useState(authUser?.displayName || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState('headphones');
  const [isHosting, setIsHosting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  useEffect(() => {
    if (error) {
      setIsHosting(false);
      setIsJoining(false);
    }
  }, [error]);

  useEffect(() => {
    if (isHosting || isJoining) {
      const timer = setTimeout(() => {
        setIsHosting(false);
        setIsJoining(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isHosting, isJoining]);

  const selectedAvatar =
    AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId)?.char || '🎧';

  const handleStartHost = () => {
    setIsHosting(true);
    setValidationError(null);

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    onJoin({
      roomCode: code,
      userName: userName.trim() || 'Host DJ',
      role: 'host',
      avatar: selectedAvatar,
    });
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const code = roomCode.trim().toUpperCase();

    if (!code) {
      setValidationError('Please enter a 4-letter Room Code.');
      return;
    }

    setIsJoining(true);
    onJoin({
      roomCode: code,
      userName: userName.trim() || 'Music Lover',
      role: 'listener',
      avatar: selectedAvatar,
    });
  };

  const renderAvatarIcon = (av: AvatarOption) => {
    switch (av.id) {
      case 'headphones':
        return <Headphones className="w-4 h-4" />;
      case 'guitar':
        return <Guitar className="w-4 h-4" />;
      case 'piano':
        return <SlidersHorizontal className="w-4 h-4" />;
      case 'mic':
        return <Mic className="w-4 h-4" />;
      case 'sax':
        return <span className="text-sm">🎷</span>;
      case 'runner':
        return <Activity className="w-4 h-4" />;
      case 'gamepad':
        return <Gamepad2 className="w-4 h-4" />;
      case 'lightning':
        return <Zap className="w-4 h-4" />;
      case 'flame':
        return <Flame className="w-4 h-4" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <span>{av.char}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#070c14] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,#132437_0%,#0c1622_50%,#070c14_100%)] pointer-events-none" />

      {/* Background concentric glowing sound rings (Left) */}
      <div className="absolute top-[42%] left-[6%] -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
        <div className="w-[620px] h-[620px] rounded-full border border-[#1b3149]/20" />
        <div className="w-[460px] h-[460px] rounded-full border border-[#203954]/25 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-[300px] h-[300px] rounded-full border border-[#264465]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-[160px] h-[160px] rounded-full border border-[#2d5077]/35 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Floating Left Music Note Badge */}
      <div className="absolute top-[22%] left-[10%] xl:left-[12%] w-12 h-12 rounded-full bg-[#122132]/80 border border-[#233d5b]/70 backdrop-blur-md flex items-center justify-center text-slate-300 shadow-xl pointer-events-none hidden md:flex z-0">
        <Music className="w-5 h-5 text-slate-300" />
      </div>

      {/* Background concentric glowing sound rings (Right) */}
      <div className="absolute top-[42%] right-[6%] translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
        <div className="w-[620px] h-[620px] rounded-full border border-[#1b3149]/20" />
        <div className="w-[460px] h-[460px] rounded-full border border-[#203954]/25 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-[300px] h-[300px] rounded-full border border-[#264465]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-[160px] h-[160px] rounded-full border border-[#2d5077]/35 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Floating Right Music Note Badge */}
      <div className="absolute top-[24%] right-[16%] xl:right-[19%] w-12 h-12 rounded-full bg-[#122132]/80 border border-[#233d5b]/70 backdrop-blur-md flex items-center justify-center text-slate-300 shadow-xl pointer-events-none hidden md:flex z-0">
        <Music className="w-5 h-5 text-slate-300" />
      </div>

      {/* Ambient Curved Wave Overlays */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          d="M-100 400 C 300 280, 500 500, 900 340 C 1200 220, 1400 420, 1600 320"
          fill="none"
          stroke="#2f547c"
          strokeWidth="1.2"
        />
        <path
          d="M-100 440 C 260 320, 520 540, 880 380 C 1180 260, 1380 450, 1600 370"
          fill="none"
          stroke="#1d3752"
          strokeWidth="1"
        />
      </svg>

      {/* Top Header Bar */}
      <header className="px-6 sm:px-12 py-5 flex items-center justify-between z-20 sticky top-0 bg-transparent">
        {/* Left Brand Badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#142335] border border-[#263e59] shadow-md flex items-center justify-center text-slate-200">
            <svg
              className="w-5 h-5 text-slate-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight leading-tight">
              SyncTune
            </h1>
            <p className="text-xs text-slate-400 font-medium">Live Together Jam</p>
          </div>
        </div>

        {/* Right: High-Contrast White Pill Login/Account Button */}
        <div>
          {authUser ? (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#132335] border border-[#284360] hover:bg-[#182c42] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
              title="Account settings"
            >
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-sky-400/40"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px] flex items-center justify-center">
                  {authUser.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="text-slate-100 max-w-[130px] truncate">
                {authUser.displayName || 'Account'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
              title="Sign in with Google"
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

      {/* Main Content Area with Left & Right Floating Elements */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 z-10 relative">
        {/* Left Floating Decorative Glass Card: "Now Playing Together" */}
        <div className="hidden xl:block absolute left-8 2xl:left-14 top-[50%] -translate-y-1/2 rotate-[-6deg] w-[260px] select-none pointer-events-none transition-transform hover:rotate-0 duration-300 z-10">
          <div className="bg-[#0f1b29]/80 backdrop-blur-xl border border-[#233a52]/80 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.65)] text-left">
            {/* Header */}
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between mb-3">
              <span>Now Playing Together</span>
              <Music className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Artwork & Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#18283a] to-[#0c141e] border border-[#253e5a] overflow-hidden flex items-center justify-center shrink-0 shadow-md relative">
                {/* Stylized night mountain artwork */}
                <svg
                  className="w-full h-full text-slate-500"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <circle cx="36" cy="12" r="4" fill="#cbd5e1" opacity="0.6" />
                  <path
                    d="M6 38 L20 22 L28 32 L34 26 L42 38 Z"
                    fill="#1e344d"
                  />
                  <path
                    d="M14 38 L24 26 L30 34 L36 29 L44 38 Z"
                    fill="#2a4869"
                    opacity="0.8"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs truncate">
                  Midnight Vibes
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Chill Collective
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-1 bg-[#1e344d] rounded-full overflow-hidden">
                <div className="w-[58%] h-full bg-slate-200 rounded-full" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex justify-between mt-1">
                <span>2:14</span>
                <span>3:56</span>
              </div>
            </div>

            {/* Media controls */}
            <div className="flex items-center justify-between mt-2.5 pt-1 text-slate-300">
              <Shuffle className="w-3.5 h-3.5 text-slate-400" />
              <SkipBack className="w-4 h-4 text-slate-300" />
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center shadow-md">
                <Pause className="w-3.5 h-3.5 fill-current" />
              </div>
              <SkipForward className="w-4 h-4 text-slate-300" />
              <Heart className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Right Floating Decorative Graphic: Dotted 3D Globe with glowing arcs & pins */}
        <div className="hidden xl:block absolute right-8 2xl:right-14 top-[50%] -translate-y-1/2 w-[320px] select-none pointer-events-none z-10">
          <div className="relative w-full aspect-square flex items-center justify-center">
            {/* Dotted globe vector with nodes */}
            <svg
              className="w-full h-full"
              viewBox="0 0 340 340"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient
                  id="globeGrad"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="30%"
                  fy="30%"
                >
                  <stop offset="0%" stopColor="#1e3a58" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#0c1622" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#080e15" stopOpacity="0" />
                </radialGradient>
                <linearGradient
                  id="arcGrad1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Sphere subtle glow background */}
              <circle
                cx="170"
                cy="170"
                r="135"
                fill="url(#globeGrad)"
                stroke="#223f5f"
                strokeWidth="1"
                strokeOpacity="0.35"
              />

              {/* Latitude lines */}
              <ellipse
                cx="170"
                cy="170"
                rx="135"
                ry="45"
                stroke="#2a4b70"
                strokeWidth="0.8"
                strokeDasharray="3 4"
                strokeOpacity="0.4"
              />
              <ellipse
                cx="170"
                cy="170"
                rx="135"
                ry="95"
                stroke="#2a4b70"
                strokeWidth="0.8"
                strokeDasharray="3 4"
                strokeOpacity="0.4"
              />
              <ellipse
                cx="170"
                cy="170"
                rx="45"
                ry="135"
                stroke="#2a4b70"
                strokeWidth="0.8"
                strokeDasharray="3 4"
                strokeOpacity="0.4"
              />
              <ellipse
                cx="170"
                cy="170"
                rx="95"
                ry="135"
                stroke="#2a4b70"
                strokeWidth="0.8"
                strokeDasharray="3 4"
                strokeOpacity="0.4"
              />

              {/* Dotted continent patterns (dense stylized points) */}
              {/* North America & Europe cluster */}
              {[
                [110, 110],
                [120, 105],
                [130, 115],
                [140, 120],
                [150, 110],
                [160, 100],
                [175, 95],
                [190, 105],
                [200, 115],
                [215, 120],
                [130, 135],
                [145, 140],
                [160, 130],
                [175, 135],
                [190, 145],
                [205, 140],
                [125, 155],
                [140, 160],
                [155, 155],
                [170, 165],
                [185, 170],
                [220, 150],
                [235, 140],
                [250, 155],
                [135, 180],
                [150, 185],
                [165, 180],
                [180, 190],
                [210, 180],
                [230, 185],
                [145, 205],
                [160, 210],
                [175, 215],
                [190, 205],
                [215, 210],
                [235, 215],
                [165, 235],
                [180, 240],
                [195, 235],
                [210, 240],
                [175, 260],
                [190, 265],
              ].map(([x, y], idx) => (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#7ca2c9"
                  opacity={0.4 + (idx % 3) * 0.2}
                />
              ))}

              {/* Glowing connecting orbital arcs */}
              <path
                d="M 85 140 Q 150 70 235 125"
                fill="none"
                stroke="url(#arcGrad1)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <path
                d="M 120 220 Q 200 270 275 190"
                fill="none"
                stroke="url(#arcGrad1)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              <path
                d="M 100 135 Q 180 180 265 205"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                opacity="0.4"
              />

              {/* Avatar Node 1 (Top Left) */}
              <circle
                cx="85"
                cy="140"
                r="16"
                fill="#122234"
                stroke="#335980"
                strokeWidth="2"
              />
              <circle cx="85" cy="136" r="4.5" fill="#93c5fd" />
              <path
                d="M 77 149 C 77 144, 93 144, 93 149"
                stroke="#93c5fd"
                strokeWidth="1.8"
                fill="none"
              />

              {/* Avatar Node 2 (Top Right) */}
              <circle
                cx="235"
                cy="125"
                r="16"
                fill="#122234"
                stroke="#335980"
                strokeWidth="2"
              />
              <circle cx="235" cy="121" r="4.5" fill="#93c5fd" />
              <path
                d="M 227 134 C 227 129, 243 129, 243 134"
                stroke="#93c5fd"
                strokeWidth="1.8"
                fill="none"
              />

              {/* Avatar Node 3 (Bottom Left) */}
              <circle
                cx="105"
                cy="235"
                r="16"
                fill="#122234"
                stroke="#335980"
                strokeWidth="2"
              />
              <circle cx="105" cy="231" r="4.5" fill="#93c5fd" />
              <path
                d="M 97 244 C 97 239, 113 239, 113 244"
                stroke="#93c5fd"
                strokeWidth="1.8"
                fill="none"
              />

              {/* Avatar Node 4 (Right Edge) */}
              <circle
                cx="275"
                cy="195"
                r="16"
                fill="#122234"
                stroke="#335980"
                strokeWidth="2"
              />
              <circle cx="275" cy="191" r="4.5" fill="#93c5fd" />
              <path
                d="M 267 204 C 267 199, 283 199, 283 204"
                stroke="#93c5fd"
                strokeWidth="1.8"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Center Main Presentation & Card */}
        <div className="w-full max-w-[500px] mx-auto z-10 flex flex-col items-center">
          {/* Centered Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#112030]/90 border border-[#233d59] text-slate-300 text-xs font-semibold shadow-inner mb-4">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Spotify Jam Style · Worldwide Sync</span>
          </div>

          {/* Centered Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-white leading-[1.15] text-center max-w-xl mx-auto">
            Listen to Songs Together <br />
            <span className="bg-gradient-to-r from-[#a3cbee] via-[#c2e0f8] to-[#86b1d4] bg-clip-text text-transparent">
              Everywhere in Real-Time
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto text-center leading-relaxed mt-3 mb-6">
            Host a room, share your QR code with friends, and play synchronized
            music live across devices!
          </p>

          {/* Main Glassmorphism Form Card */}
          <div className="bg-[#101b27]/85 backdrop-blur-2xl border border-[#223950]/80 rounded-[28px] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] w-full space-y-4">
            {/* Nickname Input Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5">
                Your Name / Nickname
              </label>
              <div className="bg-[#0b131d]/90 border border-[#21354b] rounded-2xl px-4 py-3 flex items-center gap-3 text-white focus-within:border-[#3f6b96] focus-within:ring-2 focus-within:ring-[#3f6b96]/20 transition">
                <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Alex, Jordan, DJ Max"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={25}
                  className="bg-transparent text-white placeholder-[#455c74] text-sm font-medium focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Avatar Selector Row */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 tracking-wide mb-2">
                Choose Avatar
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = selectedAvatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(av.id)}
                      title={av.label}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition active:scale-95 ${
                        isSelected
                          ? 'bg-white text-slate-950 font-bold shadow-lg scale-105'
                          : 'bg-[#152332] border border-[#23384e] text-slate-300 hover:text-white hover:bg-[#1a2c3f]'
                      }`}
                    >
                      {renderAvatarIcon(av)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {(error || validationError) && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error || validationError}</span>
              </div>
            )}

            {/* Initial Room Code Detected Banner */}
            {initialRoomCode && (
              <div className="p-3 bg-[#13283c]/80 border border-[#2b517a] rounded-2xl flex items-center gap-3">
                <QrCode className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-white">QR Code Link Detected!</p>
                  <p className="text-slate-300">
                    Ready to join Room:{' '}
                    <strong className="text-sky-300 font-mono">
                      {initialRoomCode}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            {mode === 'options' ? (
              <div className="space-y-3 pt-1">
                {/* Primary Button: Host a Live Jam */}
                <button
                  type="button"
                  onClick={handleStartHost}
                  disabled={isHosting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#d6e3ee] via-[#c6d7e6] to-[#b3c7d9] hover:from-white hover:to-[#c6d7e6] disabled:opacity-75 text-[#0a141f] font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition active:scale-[0.98] cursor-pointer"
                >
                  {isHosting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0a141f]" />
                      <span>Starting Jam Room...</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="w-4 h-4" />
                      <span>Host a Live Jam</span>
                    </>
                  )}
                </button>

                {/* Secondary Button: Join with Code or QR */}
                <button
                  type="button"
                  onClick={() => setMode('join_code')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#142232] hover:bg-[#192b3e] text-white border border-[#243950] font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition active:scale-[0.98] cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-slate-300" />
                  <span>Join with Code or QR</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinWithCode} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Enter 4-Letter Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4B7K"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    autoFocus
                    className="w-full px-4 py-3 bg-[#0b131d]/90 border border-[#21354b] rounded-2xl text-center font-mono text-xl tracking-widest text-sky-400 placeholder-[#455c74] focus:outline-none focus:border-[#3f6b96] uppercase font-black"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('options');
                      setValidationError(null);
                    }}
                    className="flex-1 py-3 bg-[#142232] hover:bg-[#192b3e] text-slate-300 font-bold rounded-2xl text-sm border border-[#243950] transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining || !roomCode.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-[#d6e3ee] to-[#b3c7d9] hover:from-white hover:to-[#c6d7e6] disabled:opacity-50 text-[#0a141f] font-black rounded-2xl text-sm flex items-center justify-center gap-1.5 shadow-lg transition active:scale-[0.98] cursor-pointer"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0a141f]" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Jam</span>
                        <Users2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Couples Hub Sub-Card */}
            <div className="pt-2 border-t border-[#1a2d42]">
              <button
                type="button"
                onClick={() => setIsCoupleModalOpen(true)}
                className="w-full p-3.5 bg-[#121f2d] hover:bg-[#162637] border border-[#22374d] rounded-2xl flex items-center justify-between text-left transition group active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a2c3d] text-rose-300 flex items-center justify-center border border-[#2c455f] group-hover:scale-105 transition shadow-xs">
                    <Heart className="w-4 h-4 fill-current text-rose-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      Couples Hub
                      {coupleProfile?.isLinked && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                          Linked
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {coupleProfile?.isLinked
                        ? `Connected with ${coupleProfile.partnerName || 'Partner'} 💕`
                        : 'Connect with partner & play romantic tracks'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition">
                  Open &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Account & Google Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={authUser || null}
        isAuthenticating={isAuthenticating}
        authError={authError}
        onLoginGoogle={onLogin || (async () => {})}
        onLoginRedirect={onLoginRedirect || (async () => {})}
        onLogout={onLogout || (async () => {})}
        onClearError={onClearAuthError || (() => {})}
      />

      {/* Couple Link Modal */}
      <CoupleModal
        isOpen={isCoupleModalOpen}
        onClose={() => setIsCoupleModalOpen(false)}
        onJoinRoom={(code) => {
          setRoomCode(code);
          setMode('join_code');
        }}
        onStartCoupleJam={(_track, targetCode) => {
          onJoin({
            roomCode: targetCode,
            userName: userName.trim() || authUser?.displayName || 'Partner',
            role: 'host',
            avatar: '💖',
          });
        }}
        authUser={authUser}
        onLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Subtle Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-[#132233] bg-[#070c14]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-center gap-2 z-10">
        <span>SyncTune · Live synchronized music for friends worldwide</span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span className="text-slate-400">
          Real-Time Drift Auto-Steer Engine
        </span>
      </footer>
    </div>
  );
};
