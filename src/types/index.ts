export interface Track {
  id: string;
  title: string;
  artist: string;
  source: 'youtube' | 'audio';
  urlOrVideoId: string;
  durationSec: number;
  thumbnail: string;
  category?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  role: 'host' | 'listener';
  avatar: string;
  joinedAt: number;
  isAudioUnlocked?: boolean;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  createdAt: number;
  hostId: string;
  currentTrack: Track;
  isPlaying: boolean;
  positionSec: number;
  lastSyncTimestamp: number;
  playbackRate: number;
  queue: Track[];
  users: UserInfo[];
}

export interface ReactionEvent {
  id: string;
  emoji: string;
  userName: string;
  x: number; // percentage across screen
}

export interface ChatMessage {
  id: string;
  text: string;
  userName: string;
  avatar: string;
  timestamp: number;
}

export interface CoupleProfile {
  id: string;
  name: string;
  phone?: string;
  avatar: string;
  coupleCode: string; // e.g. "LOVE-9481"
  partnerName?: string;
  partnerPhone?: string;
  partnerCoupleCode?: string;
  isLinked: boolean;
  anniversaryDate?: string;
  loveNote?: string;
  createdAt: number;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  createdAt: number;
  tracks: Track[];
}

export type AmbienceTheme =
  | 'off'
  | 'rainbow'
  | 'romantic'
  | 'cyberpunk'
  | 'sunset'
  | 'aurora'
  | 'candlelight'
  | 'fairylights'
  | 'rain';

export type AmbienceSoundType = 'none' | 'rain' | 'crackle' | 'breeze';

export interface AmbienceConfig {
  theme: AmbienceTheme;
  sound: AmbienceSoundType;
  volume: number; // 0 to 1
  intensity?: 'soft' | 'medium' | 'vibrant' | 'ultra';
}
