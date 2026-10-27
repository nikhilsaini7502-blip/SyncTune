import React from 'react';
import { RoomState, UserInfo } from '../types';
import { User } from 'firebase/auth';
import { QrCode, Users, Wifi, LogOut, Copy, Check, User as UserIcon } from 'lucide-react';

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
    <header className="w-full bg-[#08101a]/90 border-b border-[#1c3149] backdrop-blur-md sticky top-0 z-30 px-4 py-3 shadow-xl select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#142335] border border-[#263e59] shadow-md flex items-center justify-center text-slate-200">
            <svg
              className="w-4 h-4 text-slate-200"
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
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                SyncTune
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-[#122335] text-sky-300 border border-[#244263]">
                Live Jam
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Together in Real-Time
            </p>
          </div>
        </div>

        {/* Center: Room Code & QR Share */}
        <div className="flex items-center gap-2">
          {/* Room Code Badge */}
          <div className="flex items-center bg-[#0d1825] border border-[#1f354e] rounded-xl overflow-hidden shadow-inner">
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="px-3 py-1.5 flex items-center gap-1.5 hover:bg-[#142436] transition cursor-pointer"
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Room:
              </span>
              <span className="font-mono text-xs font-black text-sky-400">
                {room.roomCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-sky-300 ml-0.5" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              )}
            </button>

            {/* QR Code Action Button */}
            <button
              onClick={onOpenQR}
              className="bg-gradient-to-r from-[#d6e3ee] to-[#b3c7d9] hover:from-white hover:to-[#c6d7e6] text-[#0a141f] px-3 py-1.5 text-xs font-black flex items-center gap-1.5 transition active:scale-95 border-l border-[#1f354e] shadow-sm cursor-pointer"
              title="Open QR Code & Share"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite QR</span>
            </button>
          </div>
        </div>

        {/* Right side: Listeners, Latency, Profile, Leave */}
        <div className="flex items-center gap-2">
          {/* Members count (100% Real active listeners in room) */}
          <button
            onClick={onOpenMembers}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0d1825] hover:bg-[#142436] border border-[#1f354e] text-xs font-bold text-slate-200 transition cursor-pointer"
            title="View participants"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>{room.users.length}</span>
            <span className="hidden md:inline text-slate-400 font-normal">
              listeners
            </span>
          </button>

          {/* Latency badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0d1825] border border-[#1f354e] text-[11px] font-mono text-slate-300"
            title={`Ping to master clock: ${latencyMs}ms`}
          >
            <Wifi
              className={`w-3 h-3 ${latencyMs < 100 ? 'text-sky-400' : 'text-amber-400'}`}
            />
            <span>{latencyMs}ms</span>
          </div>

          {/* User profile, Auth & Leave */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#1c3149]">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-[#0d1825] hover:bg-[#142436] border border-[#1f354e] text-xs transition active:scale-95 cursor-pointer"
                title={
                  authUser
                    ? `Logged in as ${authUser.displayName || authUser.email}`
                    : 'Login with Google'
                }
              >
                {authUser ? (
                  <>
                    {authUser.photoURL ? (
                      <img
                        src={authUser.photoURL}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover border border-sky-400/40"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-[10px]">
                        {authUser.displayName?.[0] || 'U'}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-sky-300 hidden xl:inline">
                      Account
                    </span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-300">
                      Login
                    </span>
                  </>
                )}
              </button>
            )}

            <span
              className="w-7 h-7 rounded-full bg-[#122132] border border-[#233d5b] hidden sm:flex items-center justify-center text-xs text-white"
              title={`${currentUser.name} (${isHost ? 'Host DJ' : 'Listener'})`}
            >
              {currentUser.avatar || '🎧'}
            </span>

            {/* Leave Room Button */}
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-rose-500/30 transition active:scale-95 shadow-sm cursor-pointer"
              title={isHost ? 'End Jam / Exit Room' : 'Leave Live Jam'}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{isHost ? 'Exit Jam' : 'Leave'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
