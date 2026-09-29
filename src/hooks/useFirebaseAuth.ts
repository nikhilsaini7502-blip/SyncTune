import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { SavedPlaylist } from '../types';

export interface AuthErrorInfo {
  code: string;
  message: string;
  domain?: string;
  isUnauthorizedDomain?: boolean;
  isPopupBlocked?: boolean;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [cloudPlaylists, setCloudPlaylists] = useState<SavedPlaylist[]>([]);

  // Check for redirect sign-in result on page load (mobile friendly)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
        }
      })
      .catch((err: any) => {
        console.warn('Redirect sign-in check:', err);
        handleAuthException(err);
      });
  }, []);

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

  // Helper to parse Firebase Auth errors
  const handleAuthException = (err: any): AuthErrorInfo => {
    const code = err?.code || 'auth/unknown';
    const rawMsg = err?.message || 'Authentication failed';
    const domain = typeof window !== 'undefined' ? window.location.hostname : '';
    const isUnauthorizedDomain = code === 'auth/unauthorized-domain' || rawMsg.includes('authorized-domain');
    const isPopupBlocked = code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked');

    let friendlyMessage = rawMsg;
    if (isUnauthorizedDomain) {
      friendlyMessage = `Your domain "${domain}" is not authorized in Firebase Console. Add it in Firebase -> Authentication -> Settings -> Authorized domains.`;
    } else if (isPopupBlocked) {
      friendlyMessage = 'Popup was blocked by your mobile browser. Use "Sign In with Redirect" below.';
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Sign-in popup was closed before completing. Please try again.';
    }

    const errorObj: AuthErrorInfo = {
      code,
      message: friendlyMessage,
      domain,
      isUnauthorizedDomain,
      isPopupBlocked,
    };

    setAuthError(errorObj);
    return errorObj;
  };

  // Sign in with Google Popup
  const loginWithGoogle = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      const parsed = handleAuthException(err);
      throw new Error(parsed.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Sign in with Google Redirect (best for mobile devices)
  const loginWithGoogleRedirect = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Redirect Sign-in error:', err);
      const parsed = handleAuthException(err);
      setIsAuthenticating(false);
      throw new Error(parsed.message);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAuthError(null);
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

  const clearAuthError = () => setAuthError(null);

  return {
    user,
    loading,
    isAuthenticating,
    authError,
    cloudPlaylists,
    loginWithGoogle,
    loginWithGoogleRedirect,
    logout,
    clearAuthError,
    savePlaylistToCloud,
    deletePlaylistFromCloud,
  };
}
