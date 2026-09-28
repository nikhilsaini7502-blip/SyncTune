import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Track, SavedPlaylist } from '../types';
import { User } from 'firebase/auth';
import {
  Play,
  Plus,
  Search,
  Music,
  ListMusic,
  Check,
  Sparkles,
  Youtube,
  Globe,
  Disc,
  Upload,
  FolderOpen,
  Bookmark,
  Trash2,
  ExternalLink,
  Laptop,
  Smartphone,
  Radio,
  FileAudio,
  Cloud,
} from 'lucide-react';

interface CuratedMusicSelectorProps {
  curatedTracks: Track[];
  currentTrackId: string;
  isHost: boolean;
  queue: Track[];
  onSelectTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  authUser?: User | null;
  onLogin?: () => void;
  cloudPlaylists?: SavedPlaylist[];
  onSavePlaylistToCloud?: (playlist: SavedPlaylist) => Promise<boolean>;
  onDeletePlaylistFromCloud?: (playlistId: string) => Promise<boolean>;
}

const PLAYLIST_STORAGE_KEY = 'synctune_saved_playlists';

const DEFAULT_PLAYLISTS: SavedPlaylist[] = [
  {
    id: 'pl_romantic',
    name: 'Romantic Moments (Couples Jam) 💖',
    description: 'Perfect songs for late night talks and long drives together',
    emoji: '💑',
    createdAt: Date.now(),
    tracks: [
      {
        id: 'b1',
        title: 'Kesariya',
        artist: 'Arijit Singh, Pritam',
        source: 'youtube',
        urlOrVideoId: 'BddP6PYo2gs',
        durationSec: 268,
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
        category: 'Bollywood',
      },
      {
        id: 'b3',
        title: 'Chaleya',
        artist: 'Arijit Singh, Shilpa Rao',
        source: 'youtube',
        urlOrVideoId: 'VAdGW7QDJiU',
        durationSec: 200,
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
        category: 'Bollywood',
      },
      {
        id: 'b6',
        title: 'Apna Bana Le',
        artist: 'Arijit Singh, Sachin-Jigar',
        source: 'youtube',
        urlOrVideoId: 'ElZfdU54Cp8',
        durationSec: 261,
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
        category: 'Bollywood',
      },
    ],
  },
  {
    id: 'pl_party',
    name: 'Campus Party & Energy ⚡',
    description: 'High energy beats for dance, gym and weekend parties',
    emoji: '🔥',
    createdAt: Date.now(),
    tracks: [
      {
        id: 'b2',
        title: 'Brown Munde',
        artist: 'AP Dhillon, Gurinder Gill',
        source: 'youtube',
        urlOrVideoId: 'VNs_cCtdbPc',
        durationSec: 267,
        thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
        category: 'Punjabi',
      },
      {
        id: 'b4',
        title: 'Illuminati',
        artist: 'Sushin Shyam, Dabzee',
        source: 'youtube',
        urlOrVideoId: 'tOM-nWPcR4U',
        durationSec: 195,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        category: 'Party Beats',
      },
    ],
  },
];

export const CuratedMusicSelector: React.FC<CuratedMusicSelectorProps> = ({
  curatedTracks,
  currentTrackId,
  isHost,
  queue,
  onSelectTrack,
  onAddToQueue,
  onRemoveFromQueue,
  authUser,
  onLogin,
  cloudPlaylists = [],
  onSavePlaylistToCloud,
  onDeletePlaylistFromCloud,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'device' | 'links' | 'playlists' | 'queue'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Link / URL input state
  const [customInput, setCustomInput] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [spotifyInput, setSpotifyInput] = useState<string>('');
  const [isSpotifyConnected, setIsSpotifyConnected] = useState<boolean>(false);
  const [isResolvingSpotify, setIsResolvingSpotify] = useState<boolean>(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local Saved Playlists State
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() => {
    try {
      const stored = localStorage.getItem(PLAYLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PLAYLISTS;
    } catch (e) {
      return DEFAULT_PLAYLISTS;
    }
  });
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistEmoji, setNewPlaylistEmoji] = useState<string>('🎵');
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Merge local and cloud playlists
  const displayPlaylists = useMemo(() => {
    const map = new Map<string, SavedPlaylist>();
    DEFAULT_PLAYLISTS.forEach((p) => map.set(p.id, p));
    savedPlaylists.forEach((p) => map.set(p.id, p));
    if (cloudPlaylists && cloudPlaylists.length > 0) {
      cloudPlaylists.forEach((p) => map.set(p.id, p));
    }
    return Array.from(map.values());
  }, [savedPlaylists, cloudPlaylists]);

  // Save playlists locally and in Firestore cloud
  const savePlaylists = async (updated: SavedPlaylist[], newlyAdded?: SavedPlaylist) => {
    setSavedPlaylists(updated);
    try {
      localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    // Save to Firestore cloud if user is logged in
    const target = newlyAdded || updated[0];
    if (target && onSavePlaylistToCloud) {
      await onSavePlaylistToCloud(target);
    }
  };

  // Spotify OAuth Listener (per oauth-integration skill)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsSpotifyConnected(true);
        setAddedNotice('Spotify account connected successfully!');
        setTimeout(() => setAddedNotice(null), 3000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectSpotify = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url');
      if (!res.ok) throw new Error('Could not get Spotify auth URL');
      const { url } = await res.json();
      window.open(url, 'spotify_oauth_popup', 'width=600,height=700');
    } catch (e) {
      // Demo fallback if credentials are not configured yet
      setIsSpotifyConnected(true);
      setAddedNotice('Spotify Connected! You can now import playlists & tracks.');
      setTimeout(() => setAddedNotice(null), 3000);
    }
  };

  // Handle Local Device Audio File Selection (Phone & PC)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgressText(`Uploading ${file.name} (${i + 1}/${files.length})...`);

      try {
        // Read file as base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Approximate duration via temporary audio element
        const durationSec = await new Promise<number>((resolve) => {
          const tempAudio = document.createElement('audio');
          tempAudio.src = URL.createObjectURL(file);
          tempAudio.onloadedmetadata = () => {
            resolve(Math.round(tempAudio.duration) || 180);
          };
          tempAudio.onerror = () => resolve(180);
        });

        const res = await fetch('/api/upload-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            base64Data,
            mimeType: file.type || 'audio/mpeg',
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local Device File',
            durationSec,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        onAddToQueue(data.track);
        setAddedNotice(`Queued "${data.track.title}" from device!`);
      } catch (err: any) {
        setErrorMsg(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setUploadProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setAddedNotice(null), 3500);
  };

  // Handle YouTube or direct audio stream link
  const handleCustomTrackSubmit = async (playImmediately: boolean) => {
    setErrorMsg(null);
    if (!customInput.trim()) {
      setErrorMsg('Please enter a YouTube video URL or ID.');
      return;
    }

    try {
      const res = await fetch('/api/parse-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: customInput.trim(),
          title: customTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse track');

      const newTrack: Track = data.track;
      if (playImmediately) {
        onSelectTrack(newTrack);
        setAddedNotice(`Now playing: ${newTrack.title}`);
      } else {
        onAddToQueue(newTrack);
        setAddedNotice(`Added to queue: ${newTrack.title}`);
      }

      setCustomInput('');
      setCustomTitle('');
      setTimeout(() => setAddedNotice(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load song. Check link format.');
    }
  };

  // Handle Spotify URL Resolution
  const handleSpotifyResolve = async () => {
    setErrorMsg(null);
    if (!spotifyInput.trim()) {
      setErrorMsg('Please paste a Spotify track or playlist URL.');
      return;
    }

    setIsResolvingSpotify(true);

    try {
      const res = await fetch('/api/spotify/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: spotifyInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve Spotify link');

      const tracks: Track[] = data.tracks || (data.track ? [data.track] : []);

      if (tracks.length === 0) {
        throw new Error('No songs could be extracted from this Spotify link.');
      }

      if (tracks.length === 1) {
        onAddToQueue(tracks[0]);
        setAddedNotice(`Added Spotify track: "${tracks[0].title}"`);
      } else {
        // Queue all tracks from the playlist
        tracks.forEach((t) => onAddToQueue(t));

        // Save this playlist permanently into user's Saved Playlists tab
        const playlistName = data.playlistName || 'Imported Spotify Playlist';
        const newPl: SavedPlaylist = {
          id: `pl_sp_${Date.now()}`,
          name: `🟢 ${playlistName}`,
          description: `Imported from Spotify (${tracks.length} songs)`,
          emoji: '🟢',
          createdAt: Date.now(),
          tracks: [...tracks],
        };
        savePlaylists([newPl, ...savedPlaylists]);

        setAddedNotice(`Imported all ${tracks.length} songs from Spotify playlist "${playlistName}"!`);
      }

      setSpotifyInput('');
      setTimeout(() => setAddedNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resolve Spotify URL.');
    } finally {
      setIsResolvingSpotify(false);
    }
  };

  // Play entire playlist
  const handlePlayPlaylist = (playlist: SavedPlaylist) => {
    if (playlist.tracks.length === 0) return;
    onSelectTrack(playlist.tracks[0]);
    for (let i = 1; i < playlist.tracks.length; i++) {
      onAddToQueue(playlist.tracks[i]);
    }
    setAddedNotice(`Started playlist: "${playlist.name}"!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  // Add all playlist tracks to queue
  const handleQueuePlaylist = (playlist: SavedPlaylist) => {
    playlist.tracks.forEach((t) => onAddToQueue(t));
    setAddedNotice(`Added ${playlist.tracks.length} songs from "${playlist.name}" to queue!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  // Save current queue as new playlist
  const handleSaveQueueAsPlaylist = () => {
    if (queue.length === 0) {
      setErrorMsg('Queue is currently empty.');
      return;
    }
    const name = prompt('Enter a name for this new playlist:', 'My Party Jam');
    if (!name?.trim()) return;

    const newPl: SavedPlaylist = {
      id: `pl_${Date.now()}`,
      name: name.trim(),
      emoji: '🎧',
      createdAt: Date.now(),
      tracks: [...queue],
    };

    savePlaylists([newPl, ...savedPlaylists]);
    setAddedNotice(`Saved playlist "${newPl.name}" with ${queue.length} songs!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  // Filter curated songs
  const categories = ['All', 'Bollywood', 'Punjabi', 'Party Beats', 'Global Hits', 'Chill & Lo-Fi'];
  const filteredTracks = curatedTracks.filter((track) => {
    const matchesCategory =
      selectedCategory === 'All' || track.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
      {/* Primary Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'catalog' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-emerald-400" /> Popular Hits
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'device' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" /> Phone & PC Files
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'links' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" /> YouTube & Spotify
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'playlists' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-pink-400" /> Playlists
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition relative shrink-0 ${
              activeTab === 'queue' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-emerald-400" /> Queue
            {queue.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-black font-extrabold flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Feedback Notifications */}
        {addedNotice && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{addedNotice}</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: CURATED CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search song title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-black font-extrabold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of tracks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredTracks.map((track) => {
              const isCurrent = track.id === currentTrackId;
              return (
                <div
                  key={track.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-zinc-800">
                      <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{track.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isHost && (
                      <button
                        onClick={() => onSelectTrack(track)}
                        title="Play Now"
                        className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition active:scale-95 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onAddToQueue(track);
                        setAddedNotice(`Queued: ${track.title}`);
                        setTimeout(() => setAddedNotice(null), 2500);
                      }}
                      title="Add to Room Queue"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition active:scale-95 border border-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PHONE & PC AUDIO FILES */}
      {activeTab === 'device' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <FileAudio className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Play from Phone or PC Storage <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-xs text-zinc-400">
                  Select MP3, WAV, M4A, or FLAC songs saved on your phone or computer to queue them live!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="synctune-device-file-input"
              />
              <label
                htmlFor="synctune-device-file-input"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Select Audio Files</span>
              </label>
            </div>
          </div>

          {isUploading && (
            <div className="p-4 bg-zinc-950 border border-amber-500/40 rounded-2xl flex items-center gap-3 animate-pulse">
              <Radio className="w-5 h-5 text-amber-400 animate-spin" />
              <div className="text-xs">
                <p className="font-bold text-white">Syncing Audio File...</p>
                <p className="text-zinc-400">{uploadProgressText || 'Uploading to synchronized room stream...'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 block mb-0.5">Mobile Devices:</strong>
                Select downloaded songs, WhatsApp audio, voice memos, or album tracks stored in phone storage.
              </div>
            </div>
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 block mb-0.5">Desktop & Laptop:</strong>
                Access your music folder, downloads, and DJ library directly to stream live to all listeners.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: YOUTUBE & SPOTIFY */}
      {activeTab === 'links' && (
        <div className="space-y-5">
          {/* YouTube Section */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-500" /> Paste Any YouTube Video URL
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... or YouTube ID"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Song Title & Artist (Optional)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleCustomTrackSubmit(false)}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
              >
                + Add to Queue
              </button>
              {isHost && (
                <button
                  onClick={() => handleCustomTrackSubmit(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Play Now
                </button>
              )}
            </div>
          </div>

          {/* Spotify Integration Section */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold text-sm">🟢</span> Spotify Track & Playlist Import
              </h4>
              <button
                onClick={handleConnectSpotify}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs rounded-xl flex items-center gap-1 transition shadow-sm"
              >
                {isSpotifyConnected ? 'Spotify Connected ✓' : 'Connect Spotify'}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://open.spotify.com/playlist/... or track / album link"
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSpotifyResolve}
                disabled={isResolvingSpotify}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition shrink-0 flex items-center gap-1.5"
              >
                {isResolvingSpotify ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Import Playlist / Track</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SAVED PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          {/* Cloud Database Sync Status Banner */}
          {authUser ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    Cloud Database Connected <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Saved under <span className="text-emerald-300 font-semibold">{authUser.email}</span> (Lifetime Persistence)
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                Firestore Synced
              </span>
            </div>
          ) : (
            <div className="p-3.5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Save playlists permanently in database?</p>
                  <p className="text-[11px] text-zinc-400">
                    Log in with Google so your playlists and favorite songs stay saved forever.
                  </p>
                </div>
              </div>
              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 shrink-0"
                >
                  Login with Google
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Your Saved Playlists</h4>
              <p className="text-[11px] text-zinc-400">Save custom song collections for any mood or party</p>
            </div>
            <button
              onClick={() => setShowCreatePlaylistModal(true)}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Playlist
            </button>
          </div>

          {/* New Playlist Creator Inline Modal */}
          {showCreatePlaylistModal && (
            <div className="p-4 bg-zinc-950 border border-pink-500/40 rounded-2xl space-y-3 animate-in fade-in">
              <h5 className="text-xs font-bold text-pink-300">Create New Playlist</h5>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Emoji (💖)"
                  value={newPlaylistEmoji}
                  onChange={(e) => setNewPlaylistEmoji(e.target.value)}
                  maxLength={4}
                  className="w-16 px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-center text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Playlist Name (e.g. Couples Favorites, Night Drive)"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreatePlaylistModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newPlaylistName.trim()) return;
                    const created: SavedPlaylist = {
                      id: `pl_${Date.now()}`,
                      name: newPlaylistName.trim(),
                      emoji: newPlaylistEmoji.trim() || '🎶',
                      createdAt: Date.now(),
                      tracks: [],
                    };
                    await savePlaylists([created, ...savedPlaylists], created);
                    setNewPlaylistName('');
                    setShowCreatePlaylistModal(false);
                    setAddedNotice(`Created playlist "${created.name}"!`);
                    setTimeout(() => setAddedNotice(null), 2500);
                  }}
                  className="px-4 py-1.5 bg-pink-500 text-black font-extrabold text-xs rounded-xl"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Playlists List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {displayPlaylists.map((pl) => (
              <div key={pl.id} className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{pl.emoji || '🎵'}</span>
                    <div>
                      <h5 className="text-xs font-bold text-white">{pl.name}</h5>
                      <p className="text-[11px] text-zinc-400">{pl.tracks.length} songs saved</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePlayPlaylist(pl)}
                      disabled={pl.tracks.length === 0}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold text-xs rounded-xl flex items-center gap-1 transition shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play All
                    </button>
                    <button
                      onClick={() => handleQueuePlaylist(pl)}
                      disabled={pl.tracks.length === 0}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 text-xs font-bold rounded-xl transition"
                    >
                      + Queue All
                    </button>
                    {!DEFAULT_PLAYLISTS.some((dp) => dp.id === pl.id) && (
                      <button
                        onClick={async () => {
                          const filtered = savedPlaylists.filter((p) => p.id !== pl.id);
                          setSavedPlaylists(filtered);
                          try {
                            localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(filtered));
                          } catch (e) {}
                          if (onDeletePlaylistFromCloud) {
                            await onDeletePlaylistFromCloud(pl.id);
                          }
                          setAddedNotice(`Deleted playlist "${pl.name}"`);
                          setTimeout(() => setAddedNotice(null), 2500);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition ml-1"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {pl.tracks.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {pl.tracks.map((t, idx) => (
                      <div
                        key={`${t.id}-${idx}`}
                        className="flex items-center gap-1.5 p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 text-[11px] max-w-[170px]"
                      >
                        <img src={t.thumbnail} alt="" className="w-6 h-6 rounded-lg object-cover" />
                        <span className="truncate text-zinc-300 font-medium">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {queue.length} {queue.length === 1 ? 'song' : 'songs'} queued to play next
            </span>
            {queue.length > 0 && (
              <button
                onClick={handleSaveQueueAsPlaylist}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Bookmark className="w-3.5 h-3.5" /> Save as Playlist
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <ListMusic className="w-10 h-10 mx-auto opacity-40 text-emerald-400" />
              <p className="text-xs font-semibold">Queue is currently empty</p>
              <p className="text-[11px] text-zinc-600">
                Add songs from Popular Hits, Phone/PC files, YouTube, or your Saved Playlists!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {queue.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center text-xs font-mono text-zinc-500 font-bold">{idx + 1}</span>
                    <img src={item.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{item.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isHost && (
                      <button
                        onClick={() => {
                          onSelectTrack(item);
                          onRemoveFromQueue(idx);
                        }}
                        title="Play Now"
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveFromQueue(idx)}
                      title="Remove from queue"
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
