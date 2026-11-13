import { Platform } from 'react-native';
import * as WebAuth from './googleAuth.web';

export type GoogleAuthResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

export function useGoogleAuth() {
  if (Platform.OS === 'web') {
    return WebAuth.useGoogleAuth();
  }
  // On native platforms, Metro resolves googleAuth.native.ts directly.
  // This fallback delegates to native logic.
  const NativeAuth = require('./googleAuth.native') as typeof import('./googleAuth.native');
  return NativeAuth.useGoogleAuth();
}

export async function signOutFromGoogle(): Promise<void> {
  if (Platform.OS === 'web') {
    return WebAuth.signOutFromGoogle();
  }
  const NativeAuth = require('./googleAuth.native') as typeof import('./googleAuth.native');
  return NativeAuth.signOutFromGoogle();
}
