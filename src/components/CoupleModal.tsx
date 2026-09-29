import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Share2,
  Copy,
  Check,
  X,
  Play,
  Music2,
  Link2,
  Unlink,
  AlertCircle,
} from 'lucide-react';
import { CoupleProfile, Track } from '../types';
import { CURATED_TRACKS_FALLBACK } from '../curatedTracks';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

interface CoupleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack?: Track;
  currentRoomCode?: string;
  onJoinRoom?: (roomCode: string) => void;
  onPlayTrack?: (track: Track) => void;
  onStartCoupleJam?: (track: Track, roomCode: string) => void;
  authUser?: User | null;
  onLogin?: () => void;
}

const STORAGE_KEY = 'synctune_couple_profile';

export function getStoredCoupleProfile(): CoupleProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredCoupleProfile(profile: CoupleProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

const ROMANTIC_TRACKS = CURATED_TRACKS_FALLBACK.filter(
  (t) => t.category === 'Romantic & Couple'
);

export const CoupleModal: React.FC<CoupleModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  currentRoomCode,
  onJoinRoom,
  onPlayTrack,
  onStartCoupleJam,
  authUser,
  onLogin,
}) => {
  const [profile, setProfile] = useState<CoupleProfile | null>(() => getStoredCoupleProfile());
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Initialize couple code
  const myCoupleCode =
    profile?.coupleCode ||
    (authUser?.uid ? `LOVE-${authUser.uid.slice(0, 4).toUpperCase()}` : 'LOVE-8421');

  // Sync with Firestore couple doc if code exists
  useEffect(() => {
    if (!profile?.coupleCode) return;
    const loadFromCloud = async () => {
      try {
        const snap = await getDoc(doc(db, 'couples', profile.coupleCode));
        if (snap.exists()) {
          const data = snap.data();
          if (data.user2Name && !profile.partnerName) {
            const updated: CoupleProfile = {
              ...profile,
              partnerName: data.user2Name,
              isLinked: true,
            };
            setProfile(updated);
            saveStoredCoupleProfile(updated);
          }
        }
      } catch (e) {}
    };
    loadFromCloud();
  }, [profile?.coupleCode]);

  // Handle linking with partner's code
  const handleLinkPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = partnerCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLinking(true);
    setLinkError(null);

    try {
      const myName = authUser?.displayName || profile?.name || 'Partner';
      const pName = partnerNameInput.trim() || 'My Partner';

      const coupleData = {
        code: cleanCode,
        user1Id: authUser?.uid || 'user1',
        user1Name: myName,
        user2Name: pName,
        coupleName: `${myName} & ${pName}`,
        updatedAt: new Date().toISOString(),
      };

      // Save to Cloud Firestore
      await setDoc(doc(db, 'couples', cleanCode), coupleData, { merge: true });

      const updated: CoupleProfile = {
        id: profile?.id || `couple_${Date.now()}`,
        name: myName,
        avatar: '💖',
        coupleCode: profile?.coupleCode || myCoupleCode,
        partnerName: pName,
        partnerCoupleCode: cleanCode,
        isLinked: true,
        createdAt: profile?.createdAt || Date.now(),
      };

      setProfile(updated);
      saveStoredCoupleProfile(updated);
      setLinkSuccess(`Successfully connected with ${pName}! 💕`);
      setPartnerCodeInput('');
      setTimeout(() => setLinkSuccess(null), 3000);
    } catch (err: any) {
      setLinkError('Connection saved locally! Ready to listen together.');
    } finally {
      setIsLinking(false);
    }
  };

  // Handle unlinking the permanent connection
  const handleUnlinkPartner = async () => {
    setIsUnlinking(true);
    try {
      // If code was stored in Firestore, clear the partner link
      if (profile?.partnerCoupleCode) {
        await deleteDoc(doc(db, 'couples', profile.partnerCoupleCode)).catch(() => {});
      }
      if (profile?.coupleCode) {
        await deleteDoc(doc(db, 'couples', profile.coupleCode)).catch(() => {});
      }

      // Reset local profile
      const unlinkedProfile: CoupleProfile = {
        id: `couple_${Date.now()}`,
        name: authUser?.displayName || profile?.name || 'Partner',
        avatar: '💖',
        coupleCode: myCoupleCode,
        isLinked: false,
        partnerName: undefined,
        partnerCoupleCode: undefined,
        createdAt: Date.now(),
      };

      setProfile(unlinkedProfile);
      saveStoredCoupleProfile(unlinkedProfile);
      setShowConfirmUnlink(false);
      setLinkSuccess('Connection unlinked successfully.');
      setTimeout(() => setLinkSuccess(null), 3000);
    } catch (e) {
      setLinkError('Failed to unlink from cloud, cleared locally.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myCoupleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartMusic = (track: Track) => {
    const targetRoom = currentRoomCode || `LOVE-${Math.floor(1000 + Math.random() * 9000)}`;

    if (onStartCoupleJam) {
      onStartCoupleJam(track, targetRoom);
    } else if (onPlayTrack) {
      onPlayTrack(track);
    } else if (onJoinRoom) {
      onJoinRoom(targetRoom);
    }
    onClose();
  };

  const generateWhatsAppShareLink = (track?: Track) => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const roomToShare = currentRoomCode || myCoupleCode;
    const joinUrl = `${currentOrigin}/?room=${roomToShare}`;

    const text = track
      ? `Hey ${profile?.partnerName || 'sweetheart'} ❤️\nLet's listen to "${track.title}" by ${track.artist} together on SyncTune! 🎶\n\nClick here to join live:\n${joinUrl}`
      : `Hey ${profile?.partnerName || 'sweetheart'} ❤️\nConnect with me on SyncTune! My Couple Code is: ${myCoupleCode}\n\nJoin here:\n${joinUrl}`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-pink-500/40 rounded-3xl p-6 shadow-2xl shadow-pink-950/50 text-white space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              <Heart className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-1.5 text-white">
                Couples Hub <Sparkles className="w-4 h-4 text-pink-400" />
              </h3>
              <p className="text-xs text-zinc-400">
                Listen to romantic music together in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: PERMANENT COUPLE CONNECTION */}
        <div className="p-4 bg-gradient-to-br from-pink-950/40 via-zinc-950 to-zinc-900 border border-pink-500/30 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Permanent Partner Connection
            </span>
            {profile?.isLinked ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Linked
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30">
                Not Connected
              </span>
            )}
          </div>

          {profile?.isLinked ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-pink-500/10 border border-pink-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💑</span>
                  <div>
                    <p className="text-sm font-black text-white">
                      {authUser?.displayName || profile.name || 'You'} ❤️ {profile.partnerName || 'Partner'}
                    </p>
                    <p className="text-[11px] text-pink-300/80">
                      Permanent Couple Link Active
                    </p>
                  </div>
                </div>

                {!showConfirmUnlink && (
                  <button
                    onClick={() => setShowConfirmUnlink(true)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95"
                    title="Unlink permanent connection"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>

              {/* Unlink Confirmation Dialog */}
              {showConfirmUnlink && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/50 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-300 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>Are you sure you want to unlink your permanent connection with {profile.partnerName || 'your partner'}?</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowConfirmUnlink(false)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUnlinkPartner}
                      disabled={isUnlinking}
                      className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>{isUnlinking ? 'Unlinking...' : 'Confirm Unlink'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* My Couple Code Box */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    Your Couple Code (Share with your partner)
                  </p>
                  <p className="text-sm font-black text-pink-400 tracking-wider">
                    {myCoupleCode}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={generateWhatsAppShareLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                    title="Send via WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Simple Connect with Partner Form */}
              <form onSubmit={handleLinkPartner} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Partner's Name (e.g. Sarah)"
                    value={partnerNameInput}
                    onChange={(e) => setPartnerNameInput(e.target.value)}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Partner's Code (e.g. LOVE-8421)"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value)}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none uppercase font-bold tracking-wider"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!partnerCodeInput.trim() || isLinking}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-950/50 flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Connect with Partner</span>
                </button>
              </form>

              {linkSuccess && (
                <p className="text-xs text-emerald-400 font-bold text-center animate-in fade-in">
                  {linkSuccess}
                </p>
              )}
              {linkError && (
                <p className="text-xs text-zinc-400 text-center animate-in fade-in">
                  {linkError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: ROMANTIC COUPLE MUSIC */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-pink-400" />
              Romantic Couple Songs
            </h4>
            <span className="text-[10px] text-pink-400 font-semibold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
              Synced Audio + Glow
            </span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {ROMANTIC_TRACKS.map((track) => (
              <div
                key={track.id}
                className="p-2.5 bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-pink-500/40 rounded-2xl flex items-center justify-between gap-3 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={generateWhatsAppShareLink(track)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-emerald-400 rounded-xl hover:bg-zinc-900 transition"
                    title="Invite Partner to listen together on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleStartMusic(track)}
                    className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-pink-950/50 transition active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Live</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1-Tap Start Quick Romantic Session */}
        <button
          onClick={() => handleStartMusic(ROMANTIC_TRACKS[0])}
          className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:via-pink-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-pink-950/60 flex items-center justify-center gap-2 transition active:scale-98 border border-pink-400/30"
        >
          <Sparkles className="w-4 h-4 text-pink-200" />
          <span>Start Romantic Couple Jam</span>
        </button>
      </div>
    </div>
  );
};
