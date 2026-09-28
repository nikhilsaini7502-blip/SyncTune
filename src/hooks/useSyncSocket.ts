import { useEffect, useRef, useState, useCallback } from 'react';
import { RoomState, Track, UserInfo, ReactionEvent, ChatMessage } from '../types';

export function useSyncSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clockOffsetRef = useRef<number>(0); // serverTime - localTime

  // Connect & heartbeat
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let active = true;
    let ws: WebSocket;
    let pingInterval: any;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setIsConnected(true);
          setError(null);

          // Start clock sync pings
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', clientTime: Date.now() }));
            }
          }, 3500);
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            const receiveTime = Date.now();

            switch (data.type) {
              case 'pong': {
                const rtt = receiveTime - data.clientTime;
                setLatencyMs(Math.round(rtt / 2));
                const estServerTime = data.serverTime + rtt / 2;
                clockOffsetRef.current = estServerTime - receiveTime;
                break;
              }

              case 'room_joined': {
                setCurrentUser(data.room.users.find((u: UserInfo) => u.id === data.userId) || null);
                setRoom(data.room);
                setError(null);
                break;
              }

              case 'user_joined': {
                setRoom((prev) => (prev ? { ...prev, users: data.users } : null));
                break;
              }

              case 'user_left': {
                setRoom((prev) =>
                  prev
                    ? {
                        ...prev,
                        users: data.users,
                        hostId: data.hostId || prev.hostId,
                      }
                    : null
                );
                break;
              }

              case 'users_updated': {
                setRoom((prev) => (prev ? { ...prev, users: data.users } : null));
                break;
              }

              case 'playback_sync': {
                setRoom((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    isPlaying: data.isPlaying,
                    positionSec: data.positionSec,
                    lastSyncTimestamp: data.lastSyncTimestamp,
                    playbackRate: data.playbackRate ?? prev.playbackRate,
                  };
                });
                break;
              }

              case 'track_changed': {
                setRoom((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    currentTrack: data.currentTrack,
                    queue: data.queue !== undefined ? data.queue : prev.queue,
                    isPlaying: data.isPlaying,
                    positionSec: data.positionSec,
                    lastSyncTimestamp: data.lastSyncTimestamp,
                  };
                });
                break;
              }

              case 'queue_updated': {
                setRoom((prev) => (prev ? { ...prev, queue: data.queue } : null));
                break;
              }

              case 'reaction': {
                const newReaction: ReactionEvent = {
                  id: data.id,
                  emoji: data.emoji,
                  userName: data.userName,
                  x: Math.floor(Math.random() * 70) + 15,
                };
                setReactions((prev) => [...prev.slice(-20), newReaction]);
                setTimeout(() => {
                  setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
                }, 3000);
                break;
              }

              case 'chat_message': {
                setChatMessages((prev) => [...prev.slice(-50), data.chat]);
                break;
              }

              case 'error': {
                setError(data.message || 'Error occurred');
                break;
              }
            }
          } catch (e) {
            console.error('Failed to parse websocket message:', e);
          }
        };

        ws.onclose = () => {
          if (!active) return;
          setIsConnected(false);
          clearInterval(pingInterval);
          // Auto reconnect after 2 seconds
          setTimeout(() => {
            if (active) connect();
          }, 2000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    }

    connect();

    return () => {
      active = false;
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const safeSend = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to stringify WebSocket message:', err);
      }
    }
  }, []);

  const sendJoin = useCallback(
    (params: {
      roomId?: string;
      roomCode?: string;
      userName: string;
      role: 'host' | 'listener';
      avatar?: string;
    }) => {
      safeSend({
        type: 'join',
        roomId: params.roomId ? String(params.roomId) : undefined,
        roomCode: params.roomCode ? String(params.roomCode) : undefined,
        userName: String(params.userName || ''),
        role: params.role === 'host' ? 'host' : 'listener',
        avatar: params.avatar ? String(params.avatar) : undefined,
      });
    },
    [safeSend]
  );

  const sendPlay = useCallback((positionSec: number) => {
    const pos = typeof positionSec === 'number' && !isNaN(positionSec) ? positionSec : 0;
    safeSend({ type: 'play', positionSec: pos });
  }, [safeSend]);

  const sendPause = useCallback((positionSec: number) => {
    const pos = typeof positionSec === 'number' && !isNaN(positionSec) ? positionSec : 0;
    safeSend({ type: 'pause', positionSec: pos });
  }, [safeSend]);

  const sendSeek = useCallback((positionSec: number) => {
    const pos = typeof positionSec === 'number' && !isNaN(positionSec) ? positionSec : 0;
    safeSend({ type: 'seek', positionSec: pos });
  }, [safeSend]);

  const sendChangeTrack = useCallback((track: Track, autoPlay: boolean = true) => {
    if (!track) return;
    const cleanTrack: Track = {
      id: String(track.id),
      title: String(track.title),
      artist: String(track.artist),
      source: track.source === 'audio' ? 'audio' : 'youtube',
      urlOrVideoId: String(track.urlOrVideoId),
      durationSec: Number(track.durationSec) || 200,
      thumbnail: String(track.thumbnail || ''),
      category: track.category ? String(track.category) : undefined,
    };
    safeSend({ type: 'change_track', track: cleanTrack, autoPlay: Boolean(autoPlay) });
  }, [safeSend]);

  const sendAudioUnlocked = useCallback(() => {
    safeSend({ type: 'audio_unlocked' });
  }, [safeSend]);

  const sendAddQueue = useCallback((track: Track) => {
    if (!track) return;
    const cleanTrack: Track = {
      id: String(track.id),
      title: String(track.title),
      artist: String(track.artist),
      source: track.source === 'audio' ? 'audio' : 'youtube',
      urlOrVideoId: String(track.urlOrVideoId),
      durationSec: Number(track.durationSec) || 200,
      thumbnail: String(track.thumbnail || ''),
      category: track.category ? String(track.category) : undefined,
    };
    safeSend({ type: 'add_queue', track: cleanTrack });
  }, [safeSend]);

  const sendRemoveQueue = useCallback((index: number) => {
    const idx = typeof index === 'number' ? index : 0;
    safeSend({ type: 'remove_queue', index: idx });
  }, [safeSend]);

  const sendReaction = useCallback((emoji: string) => {
    safeSend({ type: 'send_reaction', emoji: String(emoji) });
  }, [safeSend]);

  const sendChat = useCallback((text: string) => {
    if (typeof text === 'string' && text.trim()) {
      safeSend({ type: 'send_chat', text: text.trim().slice(0, 150) });
    }
  }, [safeSend]);

  const sendNextTrack = useCallback(() => {
    safeSend({ type: 'next_track' });
  }, [safeSend]);

  const sendTrackEnded = useCallback(() => {
    safeSend({ type: 'track_ended' });
  }, [safeSend]);

  // Compute precise current position based on server sync timestamp and offset
  const getAuthoritativeTime = useCallback(() => {
    if (!room) return 0;
    if (!room.isPlaying) {
      return room.positionSec;
    }
    const currentServerTime = Date.now() + clockOffsetRef.current;
    const elapsedSec = Math.max(0, (currentServerTime - room.lastSyncTimestamp) / 1000);
    const calculated = room.positionSec + elapsedSec * (room.playbackRate || 1);
    if (room.currentTrack?.durationSec && calculated > room.currentTrack.durationSec) {
      return room.currentTrack.durationSec;
    }
    return calculated;
  }, [room]);

  return {
    isConnected,
    currentUser,
    room,
    latencyMs,
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
  };
}
