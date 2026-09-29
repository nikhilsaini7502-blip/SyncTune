import React from 'react';
import { RoomState, UserInfo } from '../types';
import { User } from 'firebase/auth';
import { QrCode, Users, Wifi, Disc3, Sparkles, LogOut, Copy, Check, User as UserIcon } from 'lucide-react';

interface PartyHeaderProps {
  room: RoomState;
  currentUser: UserInfo;
  latencyMs: number;
  onOpenQR: () => void;
  onOpenMembers: () => void;
  onLeaveRoom: () => void;
  authUser?: User | null;
  onOpenAuth?: () => void;
}

export const PartyHeader: React.FC<PartyHeaderProps> = ({
  room,
  currentUser,
  latencyMs,
  onOpenQR,
  onOpenMembers,
  onLeaveRoom,
  authUser,
  onOpenAuth,
}) => {
  const isHost = currentUser.role === 'host';
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Disc3 className="w-5 h-5 text-black animate-[spin_6s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white">SyncTune</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Jam
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Together in Real-Time
            </p>
          </div>
        </div>

        {/* Center: Room Code & Quick QR Button */}
        <div className="flex items-center gap-2">
          {/* Room Code Badge */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="px-3 py-1.5 flex items-center gap-1.5 hover:bg-zinc-800/80 transition"
            >
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                Room:
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {room.roomCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
              )}
            </button>

            {/* QR Code Action Button */}
            <button
              onClick={onOpenQR}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border-l border-zinc-800"
              title="Open QR Code & Share"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>

        {/* Right side: Listeners, Latency, Leave */}
        <div className="flex items-center gap-2.5">
          {/* Members count */}
          <button
            onClick={onOpenMembers}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition"
            title="View participants"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{room.users.length}</span>
          </button>

          {/* Latency badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] font-mono text-zinc-400"
            title={`Ping to sync clock: ${latencyMs}ms`}
          >
            <Wifi className={`w-3 h-3 ${latencyMs < 100 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{latencyMs}ms</span>
          </div>

          {/* User profile, Auth & Leave */}
          <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-xs transition active:scale-95"
                title={authUser ? `Logged in as ${authUser.displayName || authUser.email}` : 'Login with Google'}
              >
                {authUser ? (
                  <>
                    {authUser.photoURL ? (
                      <img
                        src={authUser.photoURL}
                        alt=""
                        className="w-5 h-5 rounded-lg object-cover border border-emerald-400/50"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                        {authUser.displayName?.[0] || 'U'}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-emerald-400 hidden xl:inline">Account</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-bold text-zinc-300">Login</span>
                  </>
                )}
              </button>
            )}

            <span
              className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 hidden sm:flex items-center justify-center text-xs"
              title={`${currentUser.name} (${isHost ? 'Host DJ' : 'Listener'})`}
            >
              {currentUser.avatar || '🎧'}
            </span>

            {/* Prominent Large Exit Jam Button */}
            <button
              onClick={onLeaveRoom}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-950/50 border border-rose-500/60 transition active:scale-95"
              title={isHost ? 'End Jam / Exit Room' : 'Leave Live Jam'}
            >
              <LogOut className="w-4 h-4" />
              <span>{isHost ? 'Exit Jam' : 'Leave'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
