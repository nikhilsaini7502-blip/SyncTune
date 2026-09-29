import { useEffect, useRef, useState, useCallback } from 'react';
import { RoomState, Track, UserInfo, ReactionEvent, ChatMessage } from '../types';
import { db, auth } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { CURATED_TRACKS_FALLBACK } from '../curatedTracks';

export function useSyncSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [syncMode, setSyncMode] = useState<'ws' | 'firestore'>('firestore');
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(20);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clockOffsetRef = useRef<number>(0);
  const firestoreUnsubRef = useRef<Unsubscribe | null>(null);
  const currentRoomCodeRef = useRef<string | null>(null);
  const currentUserRef = useRef<UserInfo | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Real-time smoothed latency & clock offset updater
  const updateLatencyMeasurement = useCallback((rtt: number, serverTime?: number) => {
    const sampleLatency = Math.max(2, Math.round(rtt / 2));
    setLatencyMs((prev) => {
      if (prev <= 0) return sampleLatency;
      return Math.round(prev * 0.65 + sampleLatency * 0.35);
    });

    if (typeof serverTime === 'number') {
      const receiveTime = Date.now();
      const estServerTime = serverTime + rtt / 2;
      const offsetSample = estServerTime - receiveTime;
      clockOffsetRef.current = Math.round(clockOffsetRef.current * 0.5 + offsetSample * 0.5);
    }
  }, []);

  // Quick HTTP ping calibrator for serverless/Firestore or baseline calibration
  const recalibrateLatency = useCallback(async () => {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/ping', { cache: 'no-store' });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        const rtt = performance.now() - t0;
        updateLatencyMeasurement(rtt, data.serverTime);
        return Math.round(rtt / 2);
      }
    } catch {
      // Fallback baseline
    }
    return latencyMs;
  }, [updateLatencyMeasurement, latencyMs]);

  // Fallback ping loop if WebSocket is closed / serverless
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
      recalibrateLatency();
    }, 3200);

    return () => clearInterval(interval);
  }, [recalibrateLatency]);

  // Attempt WebSocket connection for low-latency server setups
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let active = true;
    let ws: WebSocket;
    let pingInterval: any;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setSyncMode('ws');
        setIsConnected(true);
        setError(null);

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', clientTime: Date.now() }));
          }
        }, 2500);
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          const receiveTime = Date.now();

          switch (data.type) {
            case 'pong': {
              const rtt = receiveTime - data.clientTime;
              updateLatencyMeasurement(rtt, data.serverTime);
              break;
            }

            case 'room_joined': {
              setCurrentUser(data.room.users.find((u: UserInfo) => u.id === data.userId) || null);
              setRoom(data.room);
              currentRoomCodeRef.current = data.room.roomCode;
              setError(null);
              break;
            }

            case 'user_joined':
            case 'users_updated': {
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
        setSyncMode('firestore');
        setIsConnected(true);
      };

      ws.onerror = () => {
        setSyncMode('firestore');
        setIsConnected(true);
      };
    } catch (err) {
      setSyncMode('firestore');
      setIsConnected(true);
    }

    return () => {
      active = false;
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [updateLatencyMeasurement]);

  // Safe WebSocket sender helper
  const safeSend = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.error('Failed to stringify WebSocket message:', err);
      }
    }
    return false;
  }, []);

  // Universal Join Room (Dual-channel: Subscribes to Firestore real-time listener AND sends WebSocket)
  const sendJoin = useCallback(
    async (params: {
      roomId?: string;
      roomCode?: string;
      userName: string;
      role: 'host' | 'listener';
      avatar?: string;
    }) => {
      // Generate clean 4-character code if not provided
      let code = (params.roomCode || params.roomId || '').toUpperCase().trim();
      if (!code) {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        for (let i = 0; i < 4; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      currentRoomCodeRef.current = code;

      const uid =
        auth.currentUser?.uid ||
        `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const userObj: UserInfo = {
        id: uid,
        name: params.userName || (params.role === 'host' ? 'Host (DJ)' : 'Music Lover'),
        role: params.role,
        avatar: params.avatar || (params.role === 'host' ? '👑' : '🎧'),
        joinedAt: Date.now(),
        isAudioUnlocked: true,
      };

      // 1. Send WebSocket join if available
      safeSend({
        type: 'join',
        roomId: code,
        roomCode: code,
        userName: String(userObj.name),
        role: params.role === 'host' ? 'host' : 'listener',
        avatar: userObj.avatar,
      });

      const initialTrack: Track = CURATED_TRACKS_FALLBACK[0];

      // Optimistic instant transition for host - Never gets stuck waiting for cloud network!
      if (params.role === 'host') {
        const newHostRoom: RoomState = {
          roomId: code,
          roomCode: code,
          createdAt: Date.now(),
          hostId: uid,
          currentTrack: initialTrack,
          isPlaying: false,
          positionSec: 0,
          lastSyncTimestamp: Date.now(),
          playbackRate: 1,
          queue: [], // Clean empty queue
          users: [userObj],
        };

        setCurrentUser(userObj);
        setRoom(newHostRoom);
        setError(null);

        // Asynchronously persist to Cloud Firestore for cross-device sync
        try {
          const roomRef = doc(db, 'rooms', code);
          setDoc(
            roomRef,
            {
              ...newHostRoom,
              reactions: [],
              chatMessages: [],
              updatedAt: Date.now(),
            },
            { merge: true }
          ).catch((e) => console.warn('Firestore room setDoc error:', e));

          if (firestoreUnsubRef.current) {
            firestoreUnsubRef.current();
          }

          firestoreUnsubRef.current = onSnapshot(
            roomRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();

                setRoom((prev) => {
                  const rawUsers = data.users;
                  const usersList: UserInfo[] = Array.isArray(rawUsers) && rawUsers.length > 0
                    ? rawUsers
                    : rawUsers && typeof rawUsers === 'object'
                    ? Object.values(rawUsers)
                    : (prev?.users || [userObj]);

                  const baseTrack = data.currentTrack || prev?.currentTrack || initialTrack;
                  return {
                    roomId: data.roomId || code,
                    roomCode: data.roomCode || code,
                    createdAt: data.createdAt || Date.now(),
                    hostId: data.hostId || uid,
                    currentTrack: baseTrack,
                    isPlaying: Boolean(data.isPlaying),
                    positionSec: typeof data.positionSec === 'number' ? data.positionSec : 0,
                    lastSyncTimestamp: Number(data.lastSyncTimestamp) || Date.now(),
                    playbackRate: Number(data.playbackRate) || 1,
                    queue: Array.isArray(data.queue) ? data.queue : [],
                    users: usersList,
                  };
                });

                if (Array.isArray(data.chatMessages)) {
                  setChatMessages(data.chatMessages);
                }
              }
            },
            (err) => console.warn('Firestore host snapshot error:', err)
          );
        } catch (err: any) {
          console.warn('Firestore host init note:', err);
        }

        return;
      }

      // For Listener:
      setCurrentUser(userObj);
      setError(null);

      // Connect to Cloud Firestore for real-time room sync
      try {
        const roomRef = doc(db, 'rooms', code);
        const snapshot = await getDoc(roomRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as RoomState;
          const existingUsers = data.users || [];
          const updatedUsers = existingUsers.filter((u) => u.id !== uid);
          updatedUsers.push(userObj);

          updateDoc(roomRef, {
            users: updatedUsers,
            updatedAt: Date.now(),
          }).catch(() => {});

          setRoom({
            ...data,
            users: updatedUsers,
          });
        } else {
          // Optimistic listener fallback room while waiting for sync
          const fallbackRoom: RoomState = {
            roomId: code,
            roomCode: code,
            createdAt: Date.now(),
            hostId: 'host',
            currentTrack: initialTrack,
            isPlaying: false,
            positionSec: 0,
            lastSyncTimestamp: Date.now(),
            playbackRate: 1,
            queue: [],
            users: [userObj],
          };
          setRoom(fallbackRoom);
        }

        // Attach Realtime Firestore Listener for cross-device instant sync
        if (firestoreUnsubRef.current) {
          firestoreUnsubRef.current();
        }

        firestoreUnsubRef.current = onSnapshot(
          roomRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();

              setRoom((prev) => {
                const rawUsers = data.users;
                const usersList: UserInfo[] = Array.isArray(rawUsers) && rawUsers.length > 0
                  ? rawUsers
                  : rawUsers && typeof rawUsers === 'object'
                  ? Object.values(rawUsers)
                  : (prev?.users || [userObj]);

                const baseTrack = data.currentTrack || prev?.currentTrack || initialTrack;
                return {
                  roomId: data.roomId || code,
                  roomCode: data.roomCode || code,
                  createdAt: data.createdAt || Date.now(),
                  hostId: data.hostId || uid,
                  currentTrack: baseTrack,
                  isPlaying: Boolean(data.isPlaying),
                  positionSec: typeof data.positionSec === 'number' ? data.positionSec : 0,
                  lastSyncTimestamp: Number(data.lastSyncTimestamp) || Date.now(),
                  playbackRate: Number(data.playbackRate) || 1,
                  queue: Array.isArray(data.queue) ? data.queue : [],
                  users: usersList,
                };
              });

              if (Array.isArray(data.chatMessages)) {
                setChatMessages(data.chatMessages);
              }
            }
          },
          (err) => console.warn('Firestore listener snapshot error:', err)
        );
      } catch (err: any) {
        console.warn('Firestore room sync note:', err);
      }
    },
    [safeSend]
  );

  // Dual-channel Play
  const sendPlay = useCallback(
    (positionSec: number) => {
      const pos = typeof positionSec === 'number' && !isNaN(positionSec) ? positionSec : 0;
      safeSend({ type: 'play', positionSec: pos });

      // Always update Firestore doc so Phone gets it even if on cellular or background tab
      const code = currentRoomCodeRef.current;
      if (code) {
        updateDoc(doc(db, 'rooms', code), {
          isPlaying: true,
          positionSec: pos,
          lastSyncTimestamp: Date.now(),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend]
  );

  // Dual-channel Pause
  const sendPause = useCallback(
    (positionSec: number) => {
      const pos = typeof positionSec === 'number' && !isNaN(positionSec) ? positionSec : 0;
      safeSend({ type: 'pause', positionSec: pos });

      const code = currentRoomCodeRef.current;
      if (code) {
        updateDoc(doc(db, 'rooms', code), {
          isPlaying: false,
          positionSec: pos,
          lastSyncTimestamp: Date.now(),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend]
  );

  // Dual-channel Seek
  const sendSeek = useCallback(
    (positionSec: number) => {
      const pos = typeof positionSec === 'number' && !isNaN(positionSec) ? positionSec : 0;
      safeSend({ type: 'seek', positionSec: pos });

      const code = currentRoomCodeRef.current;
      if (code) {
        updateDoc(doc(db, 'rooms', code), {
          positionSec: pos,
          lastSyncTimestamp: Date.now(),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend]
  );

  // Dual-channel Change Track
  const sendChangeTrack = useCallback(
    (track: Track, autoPlay: boolean = true) => {
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

      const code = currentRoomCodeRef.current;
      if (code) {
        updateDoc(doc(db, 'rooms', code), {
          currentTrack: cleanTrack,
          isPlaying: Boolean(autoPlay),
          positionSec: 0,
          lastSyncTimestamp: Date.now(),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend]
  );

  const sendAudioUnlocked = useCallback(() => {
    safeSend({ type: 'audio_unlocked' });
  }, [safeSend]);

  // Dual-channel Add to Queue
  const sendAddQueue = useCallback(
    (track: Track) => {
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

      const code = currentRoomCodeRef.current;
      if (code) {
        updateDoc(doc(db, 'rooms', code), {
          queue: arrayUnion(cleanTrack),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend]
  );

  // Dual-channel Remove from Queue
  const sendRemoveQueue = useCallback(
    (index: number) => {
      const idx = typeof index === 'number' ? index : 0;
      safeSend({ type: 'remove_queue', index: idx });

      const code = currentRoomCodeRef.current;
      if (code && room?.queue) {
        const nextQueue = [...room.queue];
        nextQueue.splice(idx, 1);
        updateDoc(doc(db, 'rooms', code), {
          queue: nextQueue,
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend, room]
  );

  // Dual-channel Reaction
  const sendReaction = useCallback(
    (emoji: string) => {
      const cleanEmoji = String(emoji);
      const newReaction: ReactionEvent = {
        id: `rx_${Date.now()}_${Math.random()}`,
        emoji: cleanEmoji,
        userName: currentUserRef.current?.name || 'Friend',
        x: Math.floor(Math.random() * 70) + 15,
      };

      setReactions((prev) => [...prev.slice(-20), newReaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3000);

      safeSend({ type: 'send_reaction', emoji: cleanEmoji });
    },
    [safeSend]
  );

  // Dual-channel Chat
  const sendChat = useCallback(
    (text: string) => {
      if (typeof text !== 'string' || !text.trim()) return;
      const cleanText = text.trim().slice(0, 150);

      const chatMsg: ChatMessage = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: cleanText,
        userName: currentUserRef.current?.name || 'Someone',
        avatar: currentUserRef.current?.avatar || '🎧',
        timestamp: Date.now(),
      };

      safeSend({ type: 'send_chat', text: cleanText });

      const code = currentRoomCodeRef.current;
      if (code) {
        updateDoc(doc(db, 'rooms', code), {
          chatMessages: arrayUnion(chatMsg),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    },
    [safeSend]
  );

  // Dual-channel Next Track
  const sendNextTrack = useCallback(() => {
    safeSend({ type: 'next_track' });

    const code = currentRoomCodeRef.current;
    if (code && room && room.queue.length > 0) {
      const nextTrack = room.queue[0];
      const remainingQueue = room.queue.slice(1);
      updateDoc(doc(db, 'rooms', code), {
        currentTrack: nextTrack,
        queue: remainingQueue,
        isPlaying: true,
        positionSec: 0,
        lastSyncTimestamp: Date.now(),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  }, [safeSend, room]);

  const sendTrackEnded = useCallback(() => {
    sendNextTrack();
  }, [sendNextTrack]);

  // Precise current position calculator
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
    syncMode,
    currentUser,
    room,
    latencyMs,
    clockOffsetMs: clockOffsetRef.current,
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
  };
}
