import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { SavedPlaylist } from '../types';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cloudPlaylists, setCloudPlaylists] = useState<SavedPlaylist[]>([]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // If user logs in, store/update their user profile in Firestore
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Music Lover',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setCloudPlaylists([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to user's saved playlists in Firestore
  useEffect(() => {
    if (!user) {
      setCloudPlaylists([]);
      return;
    }

    const playlistsCol = collection(db, 'users', user.uid, 'playlists');
    const unsubscribe = onSnapshot(
      playlistsCol,
      (snapshot) => {
        const list: SavedPlaylist[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || 'Untitled Playlist',
            description: data.description || '',
            emoji: data.emoji || '🎵',
            createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
            tracks: data.tracks || [],
          });
        });
        setCloudPlaylists(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/playlists`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sign in with Google Popup
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Save playlist to Firestore cloud
  const savePlaylistToCloud = async (playlist: SavedPlaylist) => {
    if (!user) return false;
    const docRef = doc(db, 'users', user.uid, 'playlists', playlist.id);
    try {
      await setDoc(docRef, {
        id: playlist.id,
        userId: user.uid,
        name: playlist.name,
        description: playlist.description || '',
        emoji: playlist.emoji || '🎵',
        tracks: playlist.tracks,
        createdAt: new Date(playlist.createdAt || Date.now()).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/playlists/${playlist.id}`);
      return false;
    }
  };

  // Delete playlist from Firestore cloud
  const deletePlaylistFromCloud = async (playlistId: string) => {
    if (!user) return false;
    const docRef = doc(db, 'users', user.uid, 'playlists', playlistId);
    try {
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/playlists/${playlistId}`);
      return false;
    }
  };

  return {
    user,
    loading,
    cloudPlaylists,
    loginWithGoogle,
    logout,
    savePlaylistToCloud,
    deletePlaylistFromCloud,
  };
}
