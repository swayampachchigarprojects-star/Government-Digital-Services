import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthenticatedUser } from './authService';

const TOKEN_KEY = 'gramledger.accessToken';
const USER_KEY = 'gramledger.user';
const ENTITY_ID_KEY = 'gramledger.accountEntityId';

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthenticatedUser | null> {
  const serialized = Platform.OS === 'web'
    ? typeof localStorage === 'undefined' ? null : localStorage.getItem(USER_KEY)
    : await SecureStore.getItemAsync(USER_KEY);
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as AuthenticatedUser;
  } catch {
    return null;
  }
}

export async function storeUser(user: AuthenticatedUser): Promise<void> {
  const serialized = JSON.stringify(user);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(USER_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, serialized);
}

export async function clearStoredUser(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(USER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getStoredEntityId(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(ENTITY_ID_KEY);
  }
  return SecureStore.getItemAsync(ENTITY_ID_KEY);
}

export async function storeEntityId(entityId: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(ENTITY_ID_KEY, entityId);
    return;
  }
  await SecureStore.setItemAsync(ENTITY_ID_KEY, entityId);
}

export async function clearStoredEntityId(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(ENTITY_ID_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ENTITY_ID_KEY);
}

