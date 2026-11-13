import { useEffect, useState } from 'react';
import { config } from '../config';

export type GoogleAuthResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean }) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential?: string;
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google Sign-In is unavailable.'));
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google Sign-In failed to load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Sign-In failed to load.'));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

async function getWebGoogleIdToken(): Promise<GoogleAuthResult> {
  if (!config.googleWebClientId) {
    return { type: 'error', message: 'Google sign-in is not configured.' };
  }
  try {
    await loadGoogleScript();
    return await new Promise<GoogleAuthResult>((resolve) => {
      window.google?.accounts.id.initialize({
        client_id: config.googleWebClientId,
        auto_select: false,
        callback: (response) => resolve(response.credential
          ? { type: 'success', idToken: response.credential }
          : { type: 'error', message: 'Google did not return an ID token.' }),
      });
      window.google?.accounts.id.prompt((notification) => {
        if (notification?.isDismissedMoment?.() || notification?.isSkippedMoment?.()) {
          resolve({ type: 'cancelled' });
        }
      });
    });
  } catch {
    return { type: 'error', message: 'Unable to sign in with Google. Please try again.' };
  }
}

export function useGoogleAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleScript()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);

  const signIn = async (): Promise<GoogleAuthResult> => {
    return getWebGoogleIdToken();
  };

  const signOut = async (): Promise<void> => {
    // No-op for Google Identity Services Web One Tap
  };

  return { ready, signIn, signOut, response: null };
}

export async function signOutFromGoogle(): Promise<void> {
  // No-op on web
}
