import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { config } from '../config';

WebBrowser.maybeCompleteAuthSession();

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean }) => void;
          prompt: () => void;
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
      window.google?.accounts.id.prompt();
    });
  } catch {
    return { type: 'error', message: 'Unable to sign in with Google. Please try again.' };
  }
}

export type GoogleAuthResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

export function useGoogleAuth() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'gramledger', path: 'oauth' });
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: Platform.OS === 'android'
      ? config.googleAndroidClientId
      : Platform.OS === 'ios'
        ? config.googleIosClientId
        : config.googleWebClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    usePKCE: true,
  }, {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  });

  const signIn = async (): Promise<GoogleAuthResult> => {
    if (Platform.OS === 'web') {
      return getWebGoogleIdToken();
    }
    if (!request) return { type: 'error', message: 'Google sign-in is still loading.' };
    try {
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return { type: 'cancelled' };
      if (result.type !== 'success') return { type: 'error', message: 'Unable to sign in with Google. Please try again.' };
      const idToken = result.params?.id_token;
      return idToken
        ? { type: 'success', idToken }
        : { type: 'error', message: 'Google did not return an ID token.' };
    } catch {
      return { type: 'error', message: 'Unable to sign in with Google. Please try again.' };
    }
  };

  return { ready: Boolean(request), signIn, response };
}
