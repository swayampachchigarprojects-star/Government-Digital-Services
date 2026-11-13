import { useEffect } from 'react';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { config } from '../config';

export type GoogleAuthResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

let isConfigured = false;

function ensureGoogleConfigured(): void {
  if (isConfigured) return;
  GoogleSignin.configure({
    webClientId: config.googleWebClientId,
    iosClientId: config.googleIosClientId,
    scopes: ['openid', 'profile', 'email'],
  });
  isConfigured = true;
}

export function useGoogleAuth() {
  useEffect(() => {
    ensureGoogleConfigured();
  }, []);

  const signIn = async (): Promise<GoogleAuthResult> => {
    try {
      ensureGoogleConfigured();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        return { type: 'cancelled' };
      }

      if (isSuccessResponse(response)) {
        let idToken = response.data.idToken;
        if (!idToken) {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken;
        }

        if (idToken) {
          return { type: 'success', idToken };
        }
        return { type: 'error', message: 'Google did not return an ID token.' };
      }

      return { type: 'error', message: 'Unable to sign in with Google. Please try again.' };
    } catch (error: unknown) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            return { type: 'cancelled' };
          case statusCodes.IN_PROGRESS:
            return { type: 'error', message: 'Google sign-in is already in progress.' };
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            return { type: 'error', message: 'Google Play Services is not available or outdated.' };
          default:
            return {
              type: 'error',
              message: error.message || 'Unable to sign in with Google. Please try again.',
            };
        }
      }

      const message = error instanceof Error ? error.message : 'Unable to sign in with Google. Please try again.';
      return { type: 'error', message };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      ensureGoogleConfigured();
      await GoogleSignin.signOut();
    } catch {
      // Ignore sign-out errors
    }
  };

  return { ready: true, signIn, signOut, response: null };
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    ensureGoogleConfigured();
    await GoogleSignin.signOut();
  } catch {
    // Ignore sign-out errors
  }
}
