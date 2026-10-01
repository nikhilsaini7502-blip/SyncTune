import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

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
  users: Record<string, UserInfo>;
}

// Curated library with popular tracks (Top Trending Instagram Reels, YouTube hits & Viral tracks)
export const CURATED_TRACKS: Track[] = [
  {
    id: 'tr1',
    title: 'Tauba Tauba',
    artist: 'Karan Aujla (Bad Newz)',
    source: 'youtube',
    urlOrVideoId: 'LK7-_xhn3c8',
    durationSec: 218,
    thumbnail: 'https://img.youtube.com/vi/LK7-_xhn3c8/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr2',
    title: 'Big Dawgs',
    artist: 'Hanumankind & Kalmi',
    source: 'youtube',
    urlOrVideoId: 'hOHKltAiKXQ',
    durationSec: 234,
    thumbnail: 'https://img.youtube.com/vi/hOHKltAiKXQ/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr3',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    source: 'youtube',
    urlOrVideoId: 'eVli-tstM5E',
    durationSec: 175,
    thumbnail: 'https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr4',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    source: 'youtube',
    urlOrVideoId: 'd5gf9dXHevw',
    durationSec: 196,
    thumbnail: 'https://img.youtube.com/vi/d5gf9dXHevw/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr5',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    source: 'youtube',
    urlOrVideoId: 'kPa7bsKwL-8',
    durationSec: 251,
    thumbnail: 'https://img.youtube.com/vi/kPa7bsKwL-8/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'tr6',
    title: 'Aayi Nai (Stree 2)',
    artist: 'Pawan Singh, Simran Choudhary, Sachin-Jigar',
    source: 'youtube',
    urlOrVideoId: 'y1ozWpLpDlc',
    durationSec: 178,
    thumbnail: 'https://img.youtube.com/vi/y1ozWpLpDlc/hqdefault.jpg',
    category: 'YouTube Top Grossing',
  },
  {
    id: 'tr7',
    title: 'Illuminati',
    artist: 'Sushin Shyam & Dabzee (Aavesham)',
    source: 'youtube',
    urlOrVideoId: 'tOM-nWPcR4U',
    durationSec: 195,
    thumbnail: 'https://img.youtube.com/vi/tOM-nWPcR4U/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr8',
    title: 'Millionaire',
    artist: 'Yo Yo Honey Singh (Glory)',
    source: 'youtube',
    urlOrVideoId: 'XO8wew38VM8',
    durationSec: 198,
    thumbnail: 'https://img.youtube.com/vi/XO8wew38VM8/hqdefault.jpg',
    category: 'YouTube Top Grossing',
  },
  {
    id: 'tr9',
    title: 'Sajni (Laapataa Ladies)',
    artist: 'Arijit Singh & Ram Sampath',
    source: 'youtube',
    urlOrVideoId: 'k3g_WjLCsgo',
    durationSec: 170,
    thumbnail: 'https://img.youtube.com/vi/k3g_WjLCsgo/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'tr10',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    source: 'youtube',
    urlOrVideoId: 'gHDdeV2p_p8',
    durationSec: 251,
    thumbnail: 'https://img.youtube.com/vi/gHDdeV2p_p8/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'tr11',
    title: 'Husn',
    artist: 'Anuv Jain',
    source: 'youtube',
    urlOrVideoId: 'gJLVTKhTnog',
    durationSec: 218,
    thumbnail: 'https://img.youtube.com/vi/gJLVTKhTnog/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'tr12',
    title: 'Gulabi Sadi',
    artist: 'Sanju Rathod',
    source: 'youtube',
    urlOrVideoId: 'q8Pe_Y37U18',
    durationSec: 202,
    thumbnail: 'https://img.youtube.com/vi/q8Pe_Y37U18/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr13',
    title: 'Beautiful Things',
    artist: 'Benson Boone',
    source: 'youtube',
    urlOrVideoId: 'Oa_RSwwpPaA',
    durationSec: 180,
    thumbnail: 'https://img.youtube.com/vi/Oa_RSwwpPaA/hqdefault.jpg',
    category: 'Trending Reels',
  },
  {
    id: 'tr14',
    title: 'One Love',
    artist: 'Shubh',
    source: 'youtube',
    urlOrVideoId: '4Ty64s3k4gA',
    durationSec: 158,
    thumbnail: 'https://img.youtube.com/vi/4Ty64s3k4gA/hqdefault.jpg',
    category: 'YouTube Top Grossing',
  },
  {
    id: 'tr15',
    title: 'Kesariya (Brahmāstra)',
    artist: 'Arijit Singh & Pritam',
    source: 'youtube',
    urlOrVideoId: 'g6fnFALEseI',
    durationSec: 268,
    thumbnail: 'https://img.youtube.com/vi/g6fnFALEseI/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'tr16',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    source: 'youtube',
    urlOrVideoId: '2Vv-BfVoq4g',
    durationSec: 263,
    thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'tr17',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    source: 'youtube',
    urlOrVideoId: 'GxldQ9eX2wo',
    durationSec: 178,
    thumbnail: 'https://img.youtube.com/vi/GxldQ9eX2wo/hqdefault.jpg',
    category: 'Romantic & Couple',
  },
  {
    id: 'l1',
    title: 'Lo-Fi Chill Beats: Rainy Night',
    artist: 'SyncTune Studio',
    source: 'audio',
    urlOrVideoId: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    durationSec: 154,
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    category: 'Chill & Lo-Fi',
  },
  {
    id: 'l2',
    title: 'Synthwave Midnight Drive',
    artist: 'Neon Horizon',
    source: 'audio',
    urlOrVideoId: 'https://cdn.freesound.org/previews/530/530704_11861866-lq.mp3',
    durationSec: 180,
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    category: 'Electronic',
  },
];

// Room storage
const rooms = new Map<string, RoomState>();
const socketToUser = new Map<WebSocket, { roomId: string; userId: string }>();

function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

const app = express();
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// In-memory device audio store for syncing uploaded songs across all users
interface UploadedAudio {
  id: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
  durationSec: number;
  title: string;
  artist: string;
  uploadedAt: number;
}
const uploadedAudios = new Map<string, UploadedAudio>();

// Couple live status store
interface CoupleLiveStatus {
  coupleCode: string;
  name: string;
  phone?: string;
  currentTrack?: Track;
  roomId?: string;
  roomCode?: string;
  isPlaying?: boolean;
  lastActive: number;
}
const coupleStatuses = new Map<string, CoupleLiveStatus>();

// API endpoints
app.get('/api/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    serverTime: Date.now(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    totalConnections: socketToUser.size,
    timestamp: Date.now(),
  });
});

app.get('/api/curated-tracks', (req, res) => {
  res.json({ tracks: CURATED_TRACKS });
});

// Device audio file upload (Phone & PC)
app.post('/api/upload-audio', (req, res) => {
  try {
    const { fileName, base64Data, mimeType, title, artist, durationSec } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedTitle = title || fileName?.replace(/\.[^/.]+$/, '') || 'Local Device Audio';
    const parsedArtist = artist || 'Uploaded from Device';
    const dur = Number(durationSec) > 0 ? Number(durationSec) : 180;

    uploadedAudios.set(id, {
      id,
      fileName: fileName || `${id}.mp3`,
      mimeType: mimeType || 'audio/mpeg',
      data: buffer,
      durationSec: dur,
      title: parsedTitle,
      artist: parsedArtist,
      uploadedAt: Date.now(),
    });

    const track: Track = {
      id,
      title: parsedTitle,
      artist: parsedArtist,
      source: 'audio',
      urlOrVideoId: `/api/audio/${id}`,
      durationSec: dur,
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      category: 'Device Audio',
    };

    res.json({ success: true, track });
  } catch (err: any) {
    console.error('Audio upload error:', err);
    res.status(500).json({ error: 'Failed to process audio upload' });
  }
});

// Stream uploaded audio with HTTP 206 partial content support for smooth seeking
app.get('/api/audio/:id', (req, res) => {
  const item = uploadedAudios.get(req.params.id);
  if (!item) {
    res.status(404).send('Audio file not found');
    return;
  }

  const total = item.data.length;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const partialstart = parts[0];
    const partialend = parts[1];

    const start = parseInt(partialstart, 10);
    const end = partialend ? parseInt(partialend, 10) : total - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': item.mimeType,
    });
    res.end(item.data.slice(start, end + 1));
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': item.mimeType,
      'Accept-Ranges': 'bytes',
    });
    res.end(item.data);
  }
});

// Couple presence & listening status
app.post('/api/couple/heartbeat', (req, res) => {
  const { coupleCode, name, phone, currentTrack, roomId, roomCode, isPlaying } = req.body;
  if (!coupleCode) {
    res.status(400).json({ error: 'Couple code is required' });
    return;
  }
  coupleStatuses.set(coupleCode.toUpperCase().trim(), {
    coupleCode: coupleCode.toUpperCase().trim(),
    name: name || 'Partner',
    phone,
    currentTrack,
    roomId,
    roomCode,
    isPlaying: Boolean(isPlaying),
    lastActive: Date.now(),
  });
  res.json({ success: true });
});

app.get('/api/couple/status/:partnerCode', (req, res) => {
  const code = req.params.partnerCode.toUpperCase().trim();
  const status = coupleStatuses.get(code);
  if (!status || Date.now() - status.lastActive > 15 * 60 * 1000) {
    res.json({ isOnline: false });
    return;
  }
  res.json({
    isOnline: true,
    name: status.name,
    phone: status.phone,
    currentTrack: status.currentTrack,
    roomId: status.roomId,
    roomCode: status.roomCode,
    isPlaying: status.isPlaying,
    lastActive: status.lastActive,
  });
});

// Spotify OAuth & Resolution endpoints (per oauth-integration skill)
app.get('/api/auth/spotify/url', (req, res) => {
  const origin = req.headers.referer ? new URL(req.headers.referer).origin : `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/auth/spotify/callback`;
  const clientId = process.env.SPOTIFY_CLIENT_ID || 'your_spotify_client_id';
  const scope = 'user-read-private user-read-email playlist-read-private user-top-read';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}`;
  res.json({ url: authUrl });
});

app.get(['/auth/spotify/callback', '/auth/spotify/callback/'], (req, res) => {
  res.send(`
    <html>
      <body style="background:#121212;color:white;font-family:system-ui,sans-serif;text-align:center;padding:50px;">
        <h2 style="color:#1db954;">Spotify Connected Successfully!</h2>
        <p>SyncTune has connected with your Spotify session.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'spotify' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// YouTube video search cache for Spotify imports
const ytSearchCache = new Map<string, string>();

async function searchYouTubeForSong(title: string, artist: string): Promise<string> {
  const query = `${title} ${artist}`.trim();
  if (ytSearchCache.has(query)) {
    return ytSearchCache.get(query)!;
  }
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (match && match[1]) {
      ytSearchCache.set(query, match[1]);
      return match[1];
    }
  } catch (e) {}
  return 'BddP6PYo2gs';
}

app.post('/api/spotify/resolve', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL required' });
    return;
  }

  try {
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);

    let embedUrl = '';
    if (playlistMatch) {
      embedUrl = `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
    } else if (albumMatch) {
      embedUrl = `https://open.spotify.com/embed/album/${albumMatch[1]}`;
    } else if (trackMatch) {
      embedUrl = `https://open.spotify.com/embed/track/${trackMatch[1]}`;
    } else {
      embedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    }

    const spotifyRes = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const html = await spotifyRes.text();
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      const entity = data?.props?.pageProps?.state?.data?.entity;

      if (entity) {
        const coverArt =
          entity.coverArt?.sources?.[0]?.url ||
          'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400';
        const playlistName = entity.title || entity.name || 'Spotify Playlist';

        // Check for full track list in playlist or album
        if (entity.trackList && Array.isArray(entity.trackList) && entity.trackList.length > 0) {
          const rawTracks = entity.trackList.slice(0, 25);
          const tracks: Track[] = await Promise.all(
            rawTracks.map(async (item: any, idx: number) => {
              const title = item.title || `Track ${idx + 1}`;
              const artist = item.subtitle || entity.subtitle || 'Spotify Artist';
              const durationSec = item.duration ? Math.round(item.duration / 1000) : 210;
              const videoId = await searchYouTubeForSong(title, artist);

              return {
                id: `sp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                title,
                artist,
                source: 'youtube' as const,
                urlOrVideoId: videoId,
                durationSec,
                thumbnail: coverArt,
                category: 'Spotify Playlist',
              };
            })
          );

          res.json({
            type: 'playlist',
            playlistName,
            tracks,
          });
          return;
        }

        // Single track item
        const title = entity.title || entity.name || 'Spotify Track';
        const artist = entity.subtitle || entity.artists?.[0]?.name || 'Spotify Artist';
        const durationSec = entity.duration ? Math.round(entity.duration / 1000) : 210;
        const videoId = await searchYouTubeForSong(title, artist);

        const singleTrack: Track = {
          id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title,
          artist,
          source: 'youtube',
          urlOrVideoId: videoId,
          durationSec,
          thumbnail: coverArt,
          category: 'Spotify Track',
        };

        res.json({
          type: 'track',
          playlistName: title,
          tracks: [singleTrack],
        });
        return;
      }
    }

    // Fallback via oembed
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedRes = await fetch(oembedUrl);
    if (!oembedRes.ok) throw new Error('Spotify metadata lookup failed');
    const oembedData = (await oembedRes.json()) as any;
    let title = oembedData.title || 'Spotify Track';
    let artist = 'Spotify Artist';
    if (title.includes(' by ')) {
      const parts = title.split(' by ');
      title = parts[0];
      artist = parts[1];
    }
    const videoId = await searchYouTubeForSong(title, artist);

    const fallbackTrack: Track = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      artist,
      source: 'youtube',
      urlOrVideoId: videoId,
      durationSec: 210,
      thumbnail: oembedData.thumbnail_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400',
      category: 'Spotify Import',
    };

    res.json({
      type: 'track',
      playlistName: title,
      tracks: [fallbackTrack],
    });
  } catch (err: any) {
    console.error('Spotify resolve error:', err);
    res.status(400).json({ error: 'Could not resolve Spotify URL. Please verify link.' });
  }
});

app.get('/api/rooms/check/:codeOrId', (req, res) => {
  const query = req.params.codeOrId.toUpperCase().trim();
  let found: RoomState | undefined;
  for (const r of rooms.values()) {
    if (r.roomId === req.params.codeOrId || r.roomCode.toUpperCase() === query) {
      found = r;
      break;
    }
  }

  if (!found) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  res.json({
    roomId: found.roomId,
    roomCode: found.roomCode,
    currentTrack: found.currentTrack,
    isPlaying: found.isPlaying,
    listenerCount: Object.keys(found.users).length,
  });
});

app.post('/api/parse-track', (req, res) => {
  const { input, title, artist } = req.body;
  if (!input) {
    res.status(400).json({ error: 'Input required' });
    return;
  }

  const ytId = extractYouTubeId(input);
  if (ytId) {
    const track: Track = {
      id: `yt_${ytId}`,
      title: title || `YouTube: ${ytId}`,
      artist: artist || 'YouTube Stream',
      source: 'youtube',
      urlOrVideoId: ytId,
      durationSec: 240, // default placeholder until player loads
      thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      category: 'Custom YouTube',
    };
    res.json({ track });
    return;
  }

  if (input.startsWith('http') && (input.endsWith('.mp3') || input.endsWith('.wav') || input.endsWith('.ogg') || input.includes('audio') || input.includes('stream'))) {
    const track: Track = {
      id: `audio_${Date.now()}`,
      title: title || 'Custom Web Audio',
      artist: artist || 'Direct Stream',
      source: 'audio',
      urlOrVideoId: input,
      durationSec: 180,
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      category: 'Direct Audio',
    };
    res.json({ track });
    return;
  }

  res.status(400).json({ error: 'Invalid URL or YouTube ID. Please provide a YouTube link or audio stream URL.' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      const meta = socketToUser.get(client);
      if (meta && meta.roomId === roomId) {
        client.send(payload);
      }
    }
  });
}

function getSanitizedRoom(room: RoomState) {
  return {
    roomId: room.roomId,
    roomCode: room.roomCode,
    createdAt: room.createdAt,
    hostId: room.hostId,
    currentTrack: room.currentTrack,
    isPlaying: room.isPlaying,
    positionSec: room.positionSec,
    lastSyncTimestamp: room.lastSyncTimestamp,
    playbackRate: room.playbackRate,
    queue: room.queue,
    users: Object.values(room.users),
  };
}

export function advanceToNextTrack(room: RoomState, reason: string = 'auto') {
  let nextTrack: Track;
  if (room.queue.length > 0) {
    nextTrack = room.queue.shift()!;
  } else {
    const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === room.currentTrack.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % CURATED_TRACKS.length : 0;
    nextTrack = CURATED_TRACKS[nextIndex];
  }

  const now = Date.now();
  room.currentTrack = nextTrack;
  room.positionSec = 0;
  room.isPlaying = true;
  room.lastSyncTimestamp = now;

  broadcastToRoom(room.roomId, {
    type: 'track_changed',
    currentTrack: room.currentTrack,
    queue: room.queue,
    isPlaying: true,
    positionSec: 0,
    lastSyncTimestamp: now,
    byUser: 'Auto DJ',
    reason,
  });
}

// Background ticker to advance songs if ended
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.isPlaying && room.currentTrack && room.currentTrack.durationSec > 10) {
      const elapsed = (now - room.lastSyncTimestamp) / 1000 + room.positionSec;
      if (elapsed >= room.currentTrack.durationSec + 2) {
        advanceToNextTrack(room, 'server_timer_ended');
      }
    }
  }
}, 2000);

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const now = Date.now();

      switch (data.type) {
        case 'ping': {
          ws.send(JSON.stringify({
            type: 'pong',
            clientTime: data.clientTime,
            serverTime: now,
          }));
          break;
        }

        case 'join': {
          const { roomId, roomCode, userName, role, avatar } = data;
          let room: RoomState | undefined;

          // Lookup existing room
          if (roomId && rooms.has(roomId)) {
            room = rooms.get(roomId);
          } else if (roomCode) {
            const codeUpper = roomCode.toUpperCase().trim();
            for (const r of rooms.values()) {
              if (r.roomCode.toUpperCase() === codeUpper) {
                room = r;
                break;
              }
            }
          }

          // If not found and user wants to host, create new room
          if (!room) {
            if (role === 'host' || !roomId) {
              const newRoomId = roomId || `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              let newCode = generateRoomCode();
              while (Array.from(rooms.values()).some((r) => r.roomCode === newCode)) {
                newCode = generateRoomCode();
              }

              room = {
                roomId: newRoomId,
                roomCode: newCode,
                createdAt: now,
                hostId: '',
                currentTrack: CURATED_TRACKS[0],
                isPlaying: false,
                positionSec: 0,
                lastSyncTimestamp: now,
                playbackRate: 1,
                queue: [],
                users: {},
              };
              rooms.set(newRoomId, room);
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Room not found. Check the code or scan QR again.' }));
              return;
            }
          }

          const userId = `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const effectiveRole: 'host' | 'listener' =
            role === 'host' || Object.keys(room.users).length === 0 ? 'host' : 'listener';

          if (effectiveRole === 'host' && !room.hostId) {
            room.hostId = userId;
          }

          const userInfo: UserInfo = {
            id: userId,
            name: userName || (effectiveRole === 'host' ? 'Host (DJ)' : `Guest ${Object.keys(room.users).length + 1}`),
            role: effectiveRole,
            avatar: avatar || (effectiveRole === 'host' ? '🎧' : '🎵'),
            joinedAt: now,
            isAudioUnlocked: false,
          };

          room.users[userId] = userInfo;
          socketToUser.set(ws, { roomId: room.roomId, userId });

          // Send current authoritative room state to the newly connected user
          ws.send(JSON.stringify({
            type: 'room_joined',
            userId,
            room: getSanitizedRoom(room),
            serverTime: now,
          }));

          // Notify others in room
          broadcastToRoom(room.roomId, {
            type: 'user_joined',
            user: userInfo,
            users: Object.values(room.users),
          }, ws);
          break;
        }

        case 'play': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          const pos = typeof data.positionSec === 'number' ? Math.max(0, data.positionSec) : room.positionSec;
          room.isPlaying = true;
          room.positionSec = pos;
          room.lastSyncTimestamp = now;

          broadcastToRoom(room.roomId, {
            type: 'playback_sync',
            isPlaying: true,
            positionSec: pos,
            lastSyncTimestamp: now,
            playbackRate: room.playbackRate,
            byUser: room.users[meta.userId]?.name || 'DJ',
          });
          break;
        }

        case 'pause': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          const pos = typeof data.positionSec === 'number' ? Math.max(0, data.positionSec) : room.positionSec;
          room.isPlaying = false;
          room.positionSec = pos;
          room.lastSyncTimestamp = now;

          broadcastToRoom(room.roomId, {
            type: 'playback_sync',
            isPlaying: false,
            positionSec: pos,
            lastSyncTimestamp: now,
            playbackRate: room.playbackRate,
            byUser: room.users[meta.userId]?.name || 'DJ',
          });
          break;
        }

        case 'seek': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          const pos = typeof data.positionSec === 'number' ? Math.max(0, data.positionSec) : 0;
          room.positionSec = pos;
          room.lastSyncTimestamp = now;

          broadcastToRoom(room.roomId, {
            type: 'playback_sync',
            isPlaying: room.isPlaying,
            positionSec: pos,
            lastSyncTimestamp: now,
            playbackRate: room.playbackRate,
            byUser: room.users[meta.userId]?.name || 'DJ',
          });
          break;
        }

        case 'sync_heartbeat': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          const pos = typeof data.positionSec === 'number' ? Math.max(0, data.positionSec) : room.positionSec;
          room.positionSec = pos;
          room.isPlaying = Boolean(data.isPlaying);
          room.lastSyncTimestamp = now;

          broadcastToRoom(room.roomId, {
            type: 'playback_sync',
            isPlaying: room.isPlaying,
            positionSec: pos,
            lastSyncTimestamp: now,
            playbackRate: room.playbackRate,
            isHeartbeat: true,
          }, ws);
          break;
        }

        case 'change_track': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room || !data.track) return;

          room.currentTrack = data.track;
          room.positionSec = 0;
          room.isPlaying = data.autoPlay !== false;
          room.lastSyncTimestamp = now;

          broadcastToRoom(room.roomId, {
            type: 'track_changed',
            currentTrack: room.currentTrack,
            queue: room.queue,
            isPlaying: room.isPlaying,
            positionSec: 0,
            lastSyncTimestamp: now,
            byUser: room.users[meta.userId]?.name || 'DJ',
          });
          break;
        }

        case 'next_track': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          advanceToNextTrack(room, 'user_skipped');
          break;
        }

        case 'track_ended': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          // Prevent rapid duplicate triggers within 3 seconds
          if (now - room.lastSyncTimestamp < 3000) return;

          advanceToNextTrack(room, 'track_ended');
          break;
        }

        case 'audio_unlocked': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room || !room.users[meta.userId]) return;

          room.users[meta.userId].isAudioUnlocked = true;
          broadcastToRoom(room.roomId, {
            type: 'users_updated',
            users: Object.values(room.users),
          });
          break;
        }

        case 'add_queue': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room || !data.track) return;

          room.queue.push(data.track);
          broadcastToRoom(room.roomId, {
            type: 'queue_updated',
            queue: room.queue,
          });
          break;
        }

        case 'remove_queue': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room || typeof data.index !== 'number') return;

          room.queue.splice(data.index, 1);
          broadcastToRoom(room.roomId, {
            type: 'queue_updated',
            queue: room.queue,
          });
          break;
        }

        case 'send_reaction': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room) return;

          broadcastToRoom(room.roomId, {
            type: 'reaction',
            emoji: data.emoji || '🔥',
            userName: room.users[meta.userId]?.name || 'Friend',
            id: `rx_${Date.now()}_${Math.random()}`,
          });
          break;
        }

        case 'send_chat': {
          const meta = socketToUser.get(ws);
          if (!meta) return;
          const room = rooms.get(meta.roomId);
          if (!room || !data.text) return;

          const chatItem = {
            id: `chat_${Date.now()}`,
            text: String(data.text).slice(0, 150),
            userName: room.users[meta.userId]?.name || 'Friend',
            avatar: room.users[meta.userId]?.avatar || '🎵',
            timestamp: now,
          };

          broadcastToRoom(room.roomId, {
            type: 'chat_message',
            chat: chatItem,
          });
          break;
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    const meta = socketToUser.get(ws);
    if (!meta) return;
    socketToUser.delete(ws);

    const room = rooms.get(meta.roomId);
    if (!room) return;

    delete room.users[meta.userId];

    // If host left and there are other users, transfer host to next user
    if (room.hostId === meta.userId) {
      const remainingUsers = Object.values(room.users);
      if (remainingUsers.length > 0) {
        remainingUsers[0].role = 'host';
        room.hostId = remainingUsers[0].id;
      }
    }

    const remainingCount = Object.keys(room.users).length;
    if (remainingCount === 0) {
      // Keep room in memory for 1 hour before garbage collection
      setTimeout(() => {
        const check = rooms.get(meta.roomId);
        if (check && Object.keys(check.users).length === 0) {
          rooms.delete(meta.roomId);
        }
      }, 60 * 60 * 1000);
    } else {
      broadcastToRoom(room.roomId, {
        type: 'user_left',
        userId: meta.userId,
        users: Object.values(room.users),
        hostId: room.hostId,
      });
    }
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncTune Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
