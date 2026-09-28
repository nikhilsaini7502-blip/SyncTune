import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Phone, UserCheck, Share2, Copy, Check, MessageCircle, ExternalLink, X, Radio } from 'lucide-react';
import { CoupleProfile, Track } from '../types';

interface CoupleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack?: Track;
  currentRoomCode?: string;
  onJoinRoom?: (roomCode: string) => void;
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

export const CoupleModal: React.FC<CoupleModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  currentRoomCode,
  onJoinRoom,
}) => {
  const [profile, setProfile] = useState<CoupleProfile | null>(() => getStoredCoupleProfile());
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [partnerNameInput, setPartnerNameInput] = useState(profile?.partnerName || '');
  const [partnerPhoneInput, setPartnerPhoneInput] = useState(profile?.partnerPhone || '');
  const [copied, setCopied] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<{
    isOnline: boolean;
    currentTrack?: Track;
    roomCode?: string;
  } | null>(null);

  // Poll partner's live listening status if linked
  useEffect(() => {
    if (!profile?.partnerCoupleCode) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/couple/status/${encodeURIComponent(profile.partnerCoupleCode || '')}`);
        if (res.ok) {
          const data = await res.json();
          setPartnerStatus(data);
        }
      } catch (e) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [profile?.partnerCoupleCode]);

  // Report self heartbeat to server if profile exists
  useEffect(() => {
    if (!profile) return;

    const sendHeartbeat = () => {
      fetch('/api/couple/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleCode: profile.coupleCode,
          name: profile.name,
          phone: profile.phone,
          currentTrack,
          roomCode: currentRoomCode,
          isPlaying: Boolean(currentTrack),
        }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [profile, currentTrack, currentRoomCode]);

  // Create initial profile if none exists
  const handleSaveMyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const code =
      profile?.coupleCode || `LOVE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: CoupleProfile = {
      id: profile?.id || `couple_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      avatar: '💖',
      coupleCode: code,
      partnerName: partnerNameInput.trim() || undefined,
      partnerPhone: partnerPhoneInput.trim() || undefined,
      partnerCoupleCode: partnerCodeInput.trim().toUpperCase() || profile?.partnerCoupleCode,
      isLinked: Boolean(partnerCodeInput.trim() || profile?.partnerCoupleCode),
      createdAt: profile?.createdAt || Date.now(),
    };

    setProfile(newProfile);
    saveStoredCoupleProfile(newProfile);
  };

  const handleLinkPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !partnerCodeInput.trim()) return;

    const updated: CoupleProfile = {
      ...profile,
      partnerName: partnerNameInput.trim() || 'My Love',
      partnerPhone: partnerPhoneInput.trim() || undefined,
      partnerCoupleCode: partnerCodeInput.trim().toUpperCase(),
      isLinked: true,
    };

    setProfile(updated);
    saveStoredCoupleProfile(updated);
  };

  const handleCopyCode = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.coupleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateWhatsAppShareLink = () => {
    if (!profile) return '#';
    const recipientPhone = (profile.partnerPhone || '').replace(/[^0-9]/g, '');
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const roomParam = currentRoomCode ? `?room=${currentRoomCode}` : '';
    const listenUrl = `${currentOrigin}/${roomParam}`;

    const text = currentTrack
      ? `Hey ${profile.partnerName || 'sweetheart'} ❤️ I am listening to "${currentTrack.title}" by ${currentTrack.artist} on SyncTune right now! 🎶\n\nCome listen live with me:\n${listenUrl}`
      : `Hey ${profile.partnerName || 'sweetheart'} ❤️ Let's link on SyncTune and listen to music together! My Couple Code is: ${profile.coupleCode}\n\nJoin here: ${currentOrigin}`;

    const phoneSegment = recipientPhone ? `phone=${encodeURIComponent(recipientPhone)}&` : '';
    return `https://api.whatsapp.com/send?${phoneSegment}text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-pink-500/30 rounded-3xl p-6 shadow-2xl shadow-pink-950/40 text-white space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-1.5 text-white">
                Two Hearts Jam (Couples & Partners) <Sparkles className="w-4 h-4 text-pink-400" />
              </h3>
              <p className="text-xs text-zinc-400">
                Private synced listening & sweet WhatsApp notifications
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

        {/* Live Partner Activity Alert if connected */}
        {profile?.isLinked && partnerStatus?.isOnline && (
          <div className="p-3.5 bg-gradient-to-r from-rose-950/60 to-pink-950/60 border border-pink-500/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping" />
                <p className="text-xs font-bold text-pink-200">
                  {profile.partnerName || 'Partner'} is online right now!
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                LIVE
              </span>
            </div>

            {partnerStatus.currentTrack && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={partnerStatus.currentTrack.thumbnail}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-pink-500/30"
                  />
                  <div className="truncate text-xs">
                    <p className="font-bold text-white truncate">
                      {partnerStatus.currentTrack.title}
                    </p>
                    <p className="text-zinc-400 truncate text-[11px]">
                      {partnerStatus.currentTrack.artist}
                    </p>
                  </div>
                </div>

                {partnerStatus.roomCode && onJoinRoom && (
                  <button
                    onClick={() => {
                      onJoinRoom(partnerStatus.roomCode!);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-pink-500 hover:bg-pink-400 text-black font-extrabold text-xs rounded-xl shrink-0 transition shadow-md"
                  >
                    Join Room
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Existing Profile View or Setup Form */}
        {!profile ? (
          <form onSubmit={handleSaveMyProfile} className="space-y-4">
            <div className="p-4 bg-pink-950/20 border border-pink-500/20 rounded-2xl text-xs text-pink-200 leading-relaxed">
              Create your private couple account. You will receive a unique Couple Code to share with your boyfriend or girlfriend so you can tune into songs together anywhere!
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Aryan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Your WhatsApp Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-black font-extrabold rounded-xl text-sm transition shadow-lg shadow-pink-500/25 active:scale-98"
            >
              Create Couple Account 💖
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* My Couple Code Box */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Your Private Couple Code:</span>
                <span className="text-pink-400 font-medium">{profile.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xl font-black text-pink-400 tracking-wider">
                  {profile.coupleCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Share this code with your partner so they can link with you.
              </p>
            </div>

            {/* Link Partner Section */}
            {!profile.isLinked ? (
              <form onSubmit={handleLinkPartner} className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-400" /> Link With Your Partner
                </h4>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Partner's Couple Code (ask them for their code)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOVE-4819"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-mono text-pink-300 placeholder-zinc-600 focus:outline-none focus:border-pink-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Partner's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya"
                      value={partnerNameInput}
                      onChange={(e) => setPartnerNameInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Partner's WhatsApp #</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765..."
                      value={partnerPhoneInput}
                      onChange={(e) => setPartnerPhoneInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!partnerCodeInput.trim()}
                  className="w-full py-2.5 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-black font-extrabold rounded-xl text-xs transition"
                >
                  Link Together ❤️
                </button>
              </form>
            ) : (
              <div className="p-4 bg-zinc-950/80 border border-pink-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Linked with: <span className="text-pink-400">{profile.partnerName || 'Sweetheart'}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {profile.partnerCoupleCode}
                  </span>
                </div>

                {profile.partnerPhone && (
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    WhatsApp: <span className="text-zinc-300 font-mono">{profile.partnerPhone}</span>
                  </p>
                )}
              </div>
            )}

            {/* Direct WhatsApp Song Notification Button */}
            <div className="pt-2">
              <a
                href={generateWhatsAppShareLink()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>
                  {currentTrack
                    ? `Notify ${profile.partnerName || 'Partner'} on WhatsApp 🎶`
                    : 'Invite Partner on WhatsApp 💬'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
              </a>
              <p className="text-[11px] text-zinc-400 text-center mt-2">
                Sends a sweet message to your partner showing what song you're listening to right now with a 1-tap join link!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
