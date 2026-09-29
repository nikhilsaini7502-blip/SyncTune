import React, { useEffect, useState } from 'react';
import { useSyncSocket } from './hooks/useSyncSocket';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { JoinScreen } from './components/JoinScreen';
import { PartyHeader } from './components/PartyHeader';
import { SyncPlayer } from './components/SyncPlayer';
import { CuratedMusicSelector } from './components/CuratedMusicSelector';
import { QRCodeModal } from './components/QRCodeModal';
import { MembersAndChatModal } from './components/MembersAndChatModal';
import { ReactionsOverlay } from './components/ReactionsOverlay';
import { AmbienceOverlay } from './components/AmbienceOverlay';
import { CoupleModal } from './components/CoupleModal';
import { AuthModal } from './components/AuthModal';
import { CURATED_TRACKS_FALLBACK } from './curatedTracks';
import { Track, AmbienceConfig } from './types';
import { QrCode, Sparkles, Share2, Music, Users, Radio, Heart } from 'lucide-react';

export default function App() {
  const {
    user: authUser,
    cloudPlaylists,
    isAuthenticating,
    authError,
    loginWithGoogle,
    loginWithGoogleRedirect,
    logout,
    clearAuthError,
    savePlaylistToCloud,
    deletePlaylistFromCloud,
  } = useFirebaseAuth();

  const {
    isConnected,
    currentUser,
    room,
    latencyMs,
    clockOffsetMs,
    recalibrateLatency,
    reactions,
    chatMessages,
    error,
    setError,
    sendJoin,
    sendPlay,
    sendPause,
    sendSeek,
    sendChangeTrack,
    sendNextTrack,
    sendTrackEnded,
    sendAudioUnlocked,
    sendAddQueue,
    sendRemoveQueue,
    sendReaction,
    sendChat,
    getAuthoritativeTime,
  } = useSyncSocket();

  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAmbienceOpen, setIsAmbienceOpen] = useState(false);
  const [isCoupleOpen, setIsCoupleOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [ambienceConfig, setAmbienceConfig] = useState<AmbienceConfig>({
    theme: 'off',
    sound: 'none',
    volume: 0.35,
    intensity: 'vibrant',
  });
  const [curatedTracks, setCuratedTracks] = useState<Track[]>(CURATED_TRACKS_FALLBACK);

  // Check URL query params for ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('room');
      if (codeFromUrl) {
        setInitialRoomCode(codeFromUrl.toUpperCase());
      }
    }
  }, []);

  // Fetch curated tracks library from server or retain fallback safely
  useEffect(() => {
    fetch('/api/curated-tracks')
      .then((res) => {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
          setCuratedTracks(data.tracks);
        }
      })
      .catch(() => {
        // Retain CURATED_TRACKS_FALLBACK for Vercel / serverless deployments
      });
  }, []);

  // Automatically show QR code modal once when host creates a fresh room
  useEffect(() => {
    if (room && currentUser && currentUser.role === 'host' && room.users.length === 1) {
      // Small timeout for smooth initial mount
      const timer = setTimeout(() => {
        setIsQRModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [room?.roomId]);

  const handleJoin = ({
    roomCode,
    userName,
    role,
    avatar,
  }: {
    roomCode?: string;
    userName: string;
    role: 'host' | 'listener';
    avatar: string;
  }) => {
    sendJoin({
      roomCode,
      userName,
      role,
      avatar,
    });
  };

  const handleLeaveRoom = () => {
    window.location.href = window.location.pathname;
  };

  // If not joined to a room yet, render Join/Host Screen
  if (!room || !currentUser) {
    return (
      <JoinScreen
        onJoin={handleJoin}
        initialRoomCode={initialRoomCode}
        error={error}
        authUser={authUser}
        isAuthenticating={isAuthenticating}
        authError={authError}
        onLogin={loginWithGoogle}
        onLoginRedirect={loginWithGoogleRedirect}
        onLogout={logout}
        onClearAuthError={clearAuthError}
      />
    );
  }

  const isHost = currentUser.role === 'host' || room.hostId === currentUser.id;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-emerald-500 selection:text-black font-sans">
      {/* Top Header */}
      <PartyHeader
        room={room}
        currentUser={currentUser}
        latencyMs={latencyMs}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenMembers={() => setIsMembersModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        authUser={authUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Party Room Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Invite Banner for Host */}
        {isHost && (
          <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900/80 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Invite Friends with QR Code <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </h3>
                <p className="text-xs text-zinc-400">
                  Friends can scan this QR code on their mobile to listen together in live sync!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-emerald-400 text-sm font-bold tracking-wider">
                {room.roomCode}
              </div>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Show QR Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Synchronized Player Component */}
        <SyncPlayer
          room={room}
          currentUser={currentUser}
          isHost={isHost}
          latencyMs={latencyMs}
          clockOffsetMs={clockOffsetMs}
          onRecalibrateLatency={recalibrateLatency}
          onPlay={(pos) => sendPlay(pos)}
          onPause={(pos) => sendPause(pos)}
          onSeek={(pos) => sendSeek(pos)}
          onNextTrack={sendNextTrack}
          onTrackEnded={sendTrackEnded}
          onAudioUnlocked={sendAudioUnlocked}
          getAuthoritativeTime={getAuthoritativeTime}
          onOpenAmbience={() => setIsAmbienceOpen(true)}
          onOpenCouple={() => setIsCoupleOpen(true)}
        />

        {/* Music Library, Custom YouTube Link, and Queue */}
        <CuratedMusicSelector
          curatedTracks={curatedTracks.length > 0 ? curatedTracks : [room.currentTrack]}
          currentTrackId={room.currentTrack.id}
          isHost={isHost}
          queue={room.queue || []}
          onSelectTrack={(track) => sendChangeTrack(track, true)}
          onAddToQueue={(track) => sendAddQueue(track)}
          onRemoveFromQueue={(idx) => sendRemoveQueue(idx)}
          authUser={authUser}
          onLogin={() => setIsAuthModalOpen(true)}
          cloudPlaylists={cloudPlaylists}
          onSavePlaylistToCloud={savePlaylistToCloud}
          onDeletePlaylistFromCloud={deletePlaylistFromCloud}
        />
      </main>

      {/* Floating Reaction Overlay & Dock */}
      <ReactionsOverlay
        reactions={reactions}
        onSendReaction={sendReaction}
      />

      {/* QR Code Invite Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        roomCode={room.roomCode}
        roomId={room.roomId}
        hostName={
          room.users.find((u) => u.id === room.hostId || u.role === 'host')?.name || 'Host DJ'
        }
        listenerCount={room.users.length}
      />

      {/* Participants and Chat Modal */}
      <MembersAndChatModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        users={room.users}
        hostId={room.hostId}
        currentUserId={currentUser.id}
        chatMessages={chatMessages}
        onSendMessage={sendChat}
      />

      {/* Screen Ambience Atmosphere & Audio FX */}
      <AmbienceOverlay
        config={ambienceConfig}
        onChangeConfig={setAmbienceConfig}
        isOpen={isAmbienceOpen}
        onClose={() => setIsAmbienceOpen(false)}
      />

      {/* Couples & Partners Love Connection Modal */}
      <CoupleModal
        isOpen={isCoupleOpen}
        onClose={() => setIsCoupleOpen(false)}
        currentTrack={room.currentTrack}
        currentRoomCode={room.roomCode}
        onJoinRoom={(code) =>
          handleJoin({
            roomCode: code,
            userName: currentUser.name,
            role: 'listener',
            avatar: currentUser.avatar,
          })
        }
        onPlayTrack={(track) => {
          sendChangeTrack(track, true);
          setAmbienceConfig((prev) => ({ ...prev, theme: 'romantic', intensity: 'vibrant' }));
        }}
        onStartCoupleJam={(track) => {
          sendChangeTrack(track, true);
          setAmbienceConfig((prev) => ({ ...prev, theme: 'romantic', intensity: 'vibrant' }));
        }}
        authUser={authUser}
        onLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Account & Google Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={authUser || null}
        isAuthenticating={isAuthenticating}
        authError={authError}
        onLoginGoogle={loginWithGoogle}
        onLoginRedirect={loginWithGoogleRedirect}
        onLogout={logout}
        onClearError={clearAuthError}
      />

      {/* Quick Access Floating Glow Chip */}
      {ambienceConfig.theme !== 'off' && (
        <button
          onClick={() => setIsAmbienceOpen(true)}
          className="fixed bottom-20 right-4 z-40 px-3.5 py-1.5 rounded-full bg-zinc-950/90 border border-pink-500/50 text-white text-xs font-bold shadow-xl shadow-pink-500/30 flex items-center gap-2 backdrop-blur-md hover:scale-105 active:scale-95 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
          <span>Glow: {ambienceConfig.theme.toUpperCase()}</span>
        </button>
      )}

      {/* Bottom status spacer for reaction dock */}
      <div className="h-16" />
    </div>
  );
}
