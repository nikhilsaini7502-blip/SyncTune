import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Track, RoomState, UserInfo } from '../types';
import { Volume2, VolumeX, Radio, Music, AlertCircle, RefreshCw, SkipForward, Sparkles, Heart } from 'lucide-react';
import { useThumbnailColors } from '../hooks/useThumbnailColors';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface SyncPlayerProps {
  room: RoomState;
  currentUser: UserInfo;
  isHost: boolean;
  onPlay: (pos: number) => void;
  onPause: (pos: number) => void;
  onSeek: (pos: number) => void;
  onNextTrack?: () => void;
  onTrackEnded?: () => void;
  onAudioUnlocked: () => void;
  getAuthoritativeTime: () => number;
  onOpenAmbience?: () => void;
  onOpenCouple?: () => void;
}

export const SyncPlayer: React.FC<SyncPlayerProps> = ({
  room,
  currentUser,
  isHost,
  onPlay,
  onPause,
  onSeek,
  onNextTrack,
  onTrackEnded,
  onAudioUnlocked,
  getAuthoritativeTime,
  onOpenAmbience,
  onOpenCouple,
}) => {
  const currentTrack = room.currentTrack;
  const isPlaying = room.isPlaying;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  const [isYtReady, setIsYtReady] = useState(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(currentTrack.durationSec || 200);
  const [syncStatus, setSyncStatus] = useState<'locked' | 'syncing' | 'paused'>('locked');
  const [viewMode, setViewMode] = useState<'visualizer' | 'video'>('visualizer');
  const hasEndedRef = useRef<string | null>(null);

  useEffect(() => {
    hasEndedRef.current = null;
  }, [currentTrack.id]);

  // Dynamically extract dominant colors from current track's thumbnail
  const colors = useThumbnailColors(currentTrack.thumbnail, currentTrack.id, currentTrack.title);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsYtReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      setIsYtReady(true);
    };
  }, []);

  // Initialize or update YouTube Player
  useEffect(() => {
    if (!isYtReady || currentTrack.source !== 'youtube' || !ytContainerRef.current) return;

    const initialPos = getAuthoritativeTime();

    // If player already exists, simply load the new video without destroying and recreating DOM
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById({
          videoId: currentTrack.urlOrVideoId,
          startSeconds: Math.floor(initialPos),
        });
        if (isPlaying) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
        return;
      } catch (e) {
        console.warn('loadVideoById failed, re-initializing player target:', e);
      }
    }

    let destroyed = false;

    try {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }

      // Create an un-managed inner DOM element with a string ID
      ytContainerRef.current.innerHTML = '<div id="synctune-yt-player-target" style="width:100%;height:100%;"></div>';

      const player = new window.YT.Player('synctune-yt-player-target', {
        height: '100%',
        width: '100%',
        videoId: currentTrack.urlOrVideoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: isHost ? 1 : 0,
          disablekb: isHost ? 0 : 1,
          fs: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          start: Math.floor(initialPos),
        },
        events: {
          onReady: (event: any) => {
            if (destroyed) return;
            ytPlayerRef.current = event.target;
            event.target.setVolume(isMuted ? 0 : volume * 100);

            const dur = event.target.getDuration();
            if (dur && dur > 0) setDurationSec(dur);

            if (isPlaying) {
              event.target.playVideo();
              setTimeout(() => {
                const state = event.target.getPlayerState();
                if (state !== 1 && !currentUser.isAudioUnlocked && !isHost) {
                  setNeedsUserGesture(true);
                }
              }, 600);
            }
          },
          onStateChange: (event: any) => {
            if (destroyed) return;
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 1) {
              setNeedsUserGesture(false);
              setSyncStatus('locked');
            } else if (event.data === 2) {
              setSyncStatus('paused');
            } else if (event.data === 0) {
              setSyncStatus('paused');
              if (hasEndedRef.current !== currentTrack.id) {
                hasEndedRef.current = currentTrack.id;
                if (onTrackEnded) {
                  onTrackEnded();
                }
              }
            }
          },
          onError: (err: any) => {
            console.warn('YouTube Player error:', err);
          },
        },
      });
    } catch (e) {
      console.error('Failed to instantiate YouTube Player', e);
    }

    return () => {
      destroyed = true;
    };
  }, [isYtReady, currentTrack.urlOrVideoId, currentTrack.source]);

  // Cleanup YouTube player strictly on unmount
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
    };
  }, []);

  // Handle direct audio source (HTML5 Audio)
  useEffect(() => {
    if (currentTrack.source !== 'audio' || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = currentTrack.urlOrVideoId;
    audio.volume = isMuted ? 0 : volume;

    const initialPos = getAuthoritativeTime();
    audio.currentTime = initialPos;

    audio.onended = () => {
      setSyncStatus('paused');
      if (hasEndedRef.current !== currentTrack.id) {
        hasEndedRef.current = currentTrack.id;
        if (onTrackEnded) {
          onTrackEnded();
        }
      }
    };

    if (isPlaying) {
      audio
        .play()
        .then(() => {
          setNeedsUserGesture(false);
          setSyncStatus('locked');
        })
        .catch(() => {
          if (!isHost) {
            setNeedsUserGesture(true);
          }
        });
    } else {
      audio.pause();
    }
  }, [currentTrack.id, currentTrack.urlOrVideoId, currentTrack.source]);

  // Master Clock & Drift Synchronization Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const targetTime = getAuthoritativeTime();
      let currentLocalTime = 0;

      if (currentTrack.source === 'youtube' && ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            currentLocalTime = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration();
            if (dur && dur > 0) setDurationSec(dur);

            // Sync play/pause state
            const ytState = ytPlayerRef.current.getPlayerState();
            if (isPlaying && ytState !== 1 && ytState !== 3) {
              ytPlayerRef.current.playVideo();
            } else if (!isPlaying && ytState === 1) {
              ytPlayerRef.current.pauseVideo();
            }

            // Sync drift
            const drift = Math.abs(currentLocalTime - targetTime);
            if (isPlaying && drift > 0.5) {
              setSyncStatus('syncing');
              ytPlayerRef.current.seekTo(targetTime, true);
              setTimeout(() => setSyncStatus('locked'), 400);
            }
          }
        } catch (e) {
          // ignore
        }
      } else if (currentTrack.source === 'audio' && audioRef.current) {
        currentLocalTime = audioRef.current.currentTime || 0;
        if (audioRef.current.duration) setDurationSec(audioRef.current.duration);

        if (isPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(() => setNeedsUserGesture(true));
        } else if (!isPlaying && !audioRef.current.paused) {
          audioRef.current.pause();
        }

        const drift = Math.abs(currentLocalTime - targetTime);
        if (isPlaying && drift > 0.5) {
          setSyncStatus('syncing');
          audioRef.current.currentTime = targetTime;
          setTimeout(() => setSyncStatus('locked'), 300);
        }
      }

      // Check if song reached the end
      if (
        isPlaying &&
        durationSec > 10 &&
        (currentLocalTime >= durationSec - 1 || targetTime >= durationSec)
      ) {
        if (hasEndedRef.current !== currentTrack.id) {
          hasEndedRef.current = currentTrack.id;
          if (onTrackEnded) {
            onTrackEnded();
          }
        }
      }

      setCurrentTimeSec(isPlaying ? Math.min(targetTime, durationSec) : room.positionSec);
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.source, getAuthoritativeTime, room.positionSec]);

  // Volume & Mute listener
  useEffect(() => {
    if (currentTrack.source === 'youtube' && ytPlayerRef.current) {
      try {
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      } catch (e) {}
    } else if (currentTrack.source === 'audio' && audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
    }
  }, [volume, isMuted, currentTrack.source]);

  // Unlock Audio Button on User Interaction (Mobile autoplay requirement)
  const handleUnlockAudio = () => {
    setNeedsUserGesture(false);
    onAudioUnlocked();

    const targetPos = getAuthoritativeTime();

    if (currentTrack.source === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
        ytPlayerRef.current.seekTo(targetPos, true);
        ytPlayerRef.current.playVideo();
      } catch (e) {}
    } else if (currentTrack.source === 'audio' && audioRef.current) {
      audioRef.current.currentTime = targetPos;
      audioRef.current.play().catch(console.error);
    }
  };

  const handleManualSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = parseFloat(e.target.value);
    setCurrentTimeSec(newPos);
    if (isHost) {
      onSeek(newPos);
      if (currentTrack.source === 'youtube' && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(newPos, true);
      } else if (currentTrack.source === 'audio' && audioRef.current) {
        audioRef.current.currentTime = newPos;
      }
    }
  };

  const handleResync = () => {
    const target = getAuthoritativeTime();
    setSyncStatus('syncing');
    if (currentTrack.source === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(target, true);
        if (isPlaying) ytPlayerRef.current.playVideo();
      } catch (e) {}
    } else if (currentTrack.source === 'audio' && audioRef.current) {
      audioRef.current.currentTime = target;
      if (isPlaying) audioRef.current.play().catch(console.error);
    }
    setTimeout(() => setSyncStatus('locked'), 500);
  };

  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative w-full">
      {/* Dynamic Animated Ambient Background Glow */}
      <div className="absolute -inset-4 sm:-inset-8 -z-10 rounded-3xl pointer-events-none overflow-hidden transition-all duration-1000">
        {/* Glow Layer 1 - Primary Hues with breathing pulse */}
        <div
          className={`absolute -inset-8 sm:-inset-14 blur-3xl transition-all duration-1000 ease-out ${
            isPlaying ? 'opacity-40 animate-[pulseGlow_7s_ease-in-out_infinite]' : 'opacity-20'
          }`}
          style={{
            background: `radial-gradient(circle at 35% 30%, ${colors.primary} 0%, ${colors.secondary} 40%, transparent 75%)`,
          }}
        />

        {/* Glow Layer 2 - Secondary Ambient Counter Hues */}
        <div
          className={`absolute -inset-8 sm:-inset-14 blur-2xl transition-all duration-1000 ease-out ${
            isPlaying ? 'opacity-30 animate-[pulseGlowSecondary_9s_ease-in-out_infinite]' : 'opacity-15'
          }`}
          style={{
            background: `radial-gradient(circle at 75% 70%, ${colors.secondary} 0%, ${colors.primary} 45%, transparent 70%)`,
          }}
        />

        {/* Subtle Horizontal Backlight Beam */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-44 blur-2xl opacity-20 transition-all duration-1000"
          style={{
            background: `linear-gradient(90deg, transparent 5%, ${colors.primary} 50%, transparent 95%)`,
          }}
        />
      </div>

      {/* Main Player Card */}
      <div
        className="relative w-full rounded-2xl bg-zinc-950/85 backdrop-blur-xl border shadow-2xl overflow-hidden transition-all duration-700"
        style={{
          borderColor: colors.borderRgba,
          boxShadow: `0 20px 50px -15px ${colors.glowRgba}`,
        }}
      >
        {/* Mobile Autoplay Unlock Banner */}
        {needsUserGesture && (
          <div
            className="text-white p-3.5 px-5 flex items-center justify-between shadow-lg animate-pulse z-20 transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 animate-spin" />
              <div>
                <p className="font-bold text-sm">Tap to Start Synchronized Sound</p>
                <p className="text-xs text-white/90">
                  Tap to sync audio and listen together in real-time
                </p>
              </div>
            </div>
            <button
              onClick={handleUnlockAudio}
              className="px-4 py-2 bg-white text-zinc-900 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:bg-zinc-100 transition active:scale-95"
            >
              🔊 Tap to Sync
            </button>
          </div>
        )}

        {/* Hidden / Embedded Video Container */}
        <div
          className={`w-full transition-all duration-300 ${
            viewMode === 'video' && currentTrack.source === 'youtube'
              ? 'aspect-video h-auto block'
              : 'h-0 overflow-hidden opacity-0 pointer-events-none'
          }`}
        >
          <div ref={ytContainerRef} className="w-full h-full" />
        </div>

        {/* Direct HTML5 Audio element for fallback */}
        <audio ref={audioRef} playsInline preload="auto" />

        {/* Visualizer & Cover View */}
        {viewMode === 'visualizer' && (
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
            {/* Inner Ambient Glow matching dominant color */}
            <div
              className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000"
              style={{
                backgroundImage: `radial-gradient(circle, ${colors.primary}, transparent)`,
                opacity: isPlaying ? 0.35 : 0.15,
              }}
            />

            {/* Vinyl / Album Art */}
            <div className="relative group shrink-0">
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border relative transition-all duration-500 ${
                  isPlaying ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: colors.borderRgba,
                  boxShadow: `0 12px 30px -10px ${colors.glowRgba}`,
                  outlineColor: colors.primary,
                }}
              >
                <img
                  src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Floating Vinyl Pin */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-zinc-300 border border-white/10 uppercase tracking-wider flex items-center gap-1">
                  {currentTrack.source === 'youtube' ? 'YouTube' : 'Audio Stream'}
                </div>
              </div>

              {/* Rotating Vinyl Accent behind cover when playing */}
              <div
                className={`absolute -right-3 top-3 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-zinc-950 bg-zinc-900 -z-10 shadow-lg transition-transform duration-700 ${
                  isPlaying ? 'translate-x-4 animate-[spin_8s_linear_infinite]' : 'translate-x-0'
                }`}
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #18181b 30%, #27272a 40%, #18181b 50%, #27272a 60%, #09090b 70%)',
                }}
              >
                <div
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full border-2 border-zinc-900 flex items-center justify-center transition-colors duration-1000"
                  style={{
                    backgroundColor: colors.primary,
                  }}
                >
                  <Music className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>

            {/* Song Details & Equalizer */}
            <div className="flex-1 w-full flex flex-col justify-center text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors duration-700"
                  style={{
                    backgroundColor: `${colors.borderRgba}`,
                    color: colors.primary,
                    borderColor: colors.borderRgba,
                  }}
                >
                  {currentTrack.category || 'Live Jam'}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5 ${
                    syncStatus === 'locked'
                      ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                      : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'locked' && isPlaying
                        ? 'bg-emerald-400 animate-ping'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-zinc-500'
                    }`}
                  />
                  {syncStatus === 'locked' ? 'Sync Locked' : 'Syncing...'}
                </span>

                {!isHost && (
                  <button
                    onClick={handleResync}
                    title="Resync to DJ"
                    className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 border border-zinc-700 transition"
                  >
                    <RefreshCw className="w-3 h-3" /> Resync
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-lg">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-medium text-zinc-400 truncate max-w-lg">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Equalizer Waveform Bars adapting to dominant track colors */}
              <div className="flex items-center justify-center sm:justify-start gap-1 h-8 pt-1">
                {[40, 75, 100, 60, 85, 45, 95, 70, 50, 80, 65, 90, 35, 75].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying ? 'opacity-90' : 'opacity-25'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(15, h * (0.5 + Math.random() * 0.5))}%` : '15%',
                      background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Player Controls Bar */}
        <div className="p-4 sm:p-5 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-col gap-3">
          {/* Timeline Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>{formatTime(currentTimeSec)}</span>
              <span>{formatTime(durationSec)}</span>
            </div>

            <input
              type="range"
              min={0}
              max={Math.max(10, durationSec)}
              step={0.5}
              value={Math.min(currentTimeSec, durationSec)}
              onChange={handleManualSeek}
              disabled={!isHost}
              style={{ accentColor: colors.hex }}
              className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                !isHost ? 'opacity-80 cursor-default' : ''
              }`}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: View toggle & Host label */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentTrack.source === 'youtube' && (
                <button
                  onClick={() => setViewMode(viewMode === 'visualizer' ? 'video' : 'visualizer')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition"
                >
                  {viewMode === 'visualizer' ? '📺 Video' : '🎨 Art'}
                </button>
              )}

              {onOpenAmbience && (
                <button
                  onClick={onOpenAmbience}
                  title="Atmospheric Lights & Tunes"
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-teal-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ambience
                </button>
              )}

              {onOpenCouple && (
                <button
                  onClick={onOpenCouple}
                  title="Couples Mode & WhatsApp Notification"
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-pink-950/60 hover:bg-pink-900/60 text-pink-300 border border-pink-500/40 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Heart className="w-3.5 h-3.5 fill-current text-pink-400" /> Couple
                </button>
              )}

              <div className="text-xs text-zinc-400 hidden sm:inline-block">
                {isHost ? (
                  <span
                    className="font-medium transition-colors duration-700"
                    style={{ color: colors.primary }}
                  >
                    🎧 Host DJ
                  </span>
                ) : (
                  <span>Synced in real-time</span>
                )}
              </div>
            </div>

            {/* Center: Play/Pause Controls */}
            <div className="flex items-center gap-2.5">
              {isHost ? (
                <>
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        onPause(currentTimeSec);
                      } else {
                        onPlay(currentTimeSec);
                      }
                    }}
                    className="w-12 h-12 rounded-full text-black flex items-center justify-center font-bold shadow-lg transition-all duration-300 active:scale-95"
                    style={{
                      backgroundColor: colors.primary,
                      boxShadow: `0 10px 25px -5px ${colors.glowRgba}`,
                    }}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (onNextTrack) onNextTrack();
                    }}
                    title={room.queue && room.queue.length > 0 ? `Next: ${room.queue[0].title}` : 'Skip to Next Song'}
                    className="w-10 h-10 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95 border border-zinc-700/60 shadow-sm"
                    aria-label="Skip to Next Song"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: colors.primary }}
                    />
                    {isPlaying ? 'Live Streaming' : 'Paused by DJ'}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Local Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                style={{ accentColor: colors.hex }}
                className="w-20 sm:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                aria-label="Volume slider"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
