// IndexedDB Persistent Storage for Phone & PC Audio Files
// Avoids the strict 5MB quota limitation of localStorage and persists files permanently across sessions, page reloads, and jam rooms!

import { Track } from '../types';

export interface StoredDeviceAudio {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  blob: Blob;
  createdAt: number;
  thumbnail: string;
}

const DB_NAME = 'SyncTune_DeviceMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_tracks';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Cache of active Blob URLs so we don't leak memory or recreate them constantly
const blobUrlCache = new Map<string, string>();

export function getOrCreateBlobUrl(trackId: string, blob: Blob): string {
  if (blobUrlCache.has(trackId)) {
    return blobUrlCache.get(trackId)!;
  }
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(trackId, url);
  return url;
}

export function revokeBlobUrl(trackId: string) {
  const url = blobUrlCache.get(trackId);
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
    blobUrlCache.delete(trackId);
  }
}

/**
 * Save an audio file to IndexedDB
 */
export async function saveAudioFileToDeviceStorage(
  file: File | Blob,
  metadata: {
    id?: string;
    title: string;
    artist?: string;
    fileName?: string;
    mimeType?: string;
    durationSec?: number;
    thumbnail?: string;
  }
): Promise<Track> {
  const db = await openDatabase();
  const id = metadata.id || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = metadata.title || 'Device Audio';
  const artist = metadata.artist || 'Phone & PC File';
  const fileName = metadata.fileName || ('name' in file ? (file as File).name : `${title}.mp3`);
  const mimeType = metadata.mimeType || file.type || 'audio/mpeg';
  const durationSec = metadata.durationSec && metadata.durationSec > 0 ? metadata.durationSec : 180;
  const thumbnail =
    metadata.thumbnail ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';

  const record: StoredDeviceAudio = {
    id,
    title,
    artist,
    fileName,
    mimeType,
    durationSec,
    sizeBytes: file.size,
    blob: file,
    createdAt: Date.now(),
    thumbnail,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const blobUrl = getOrCreateBlobUrl(id, file);

  return {
    id,
    title,
    artist,
    source: 'audio',
    urlOrVideoId: blobUrl,
    durationSec,
    thumbnail,
    category: 'Device Audio',
  };
}

/**
 * Retrieve all stored audio tracks from IndexedDB
 */
export async function getAllDeviceStoredTracks(): Promise<Track[]> {
  try {
    const db = await openDatabase();
    const records = await new Promise<StoredDeviceAudio[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // Sort newest first
    records.sort((a, b) => b.createdAt - a.createdAt);

    return records.map((rec) => {
      const blobUrl = getOrCreateBlobUrl(rec.id, rec.blob);
      return {
        id: rec.id,
        title: rec.title,
        artist: rec.artist,
        source: 'audio',
        urlOrVideoId: blobUrl,
        durationSec: rec.durationSec,
        thumbnail: rec.thumbnail,
        category: 'Device Audio',
      };
    });
  } catch (err) {
    console.warn('Failed to read from IndexedDB, falling back to empty list:', err);
    return [];
  }
}

/**
 * Delete a specific track from IndexedDB
 */
export async function deleteDeviceStoredTrack(trackId: string): Promise<boolean> {
  try {
    revokeBlobUrl(trackId);
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch (err) {
    console.error('Error deleting from IndexedDB:', err);
    return false;
  }
}

/**
 * Clear all device tracks from IndexedDB
 */
export async function clearAllDeviceStoredTracks(): Promise<boolean> {
  try {
    for (const id of blobUrlCache.keys()) {
      revokeBlobUrl(id);
    }
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return true;
  } catch (err) {
    console.error('Error clearing IndexedDB:', err);
    return false;
  }
}
