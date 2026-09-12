import { apiRequest } from './apiClient';

export interface UserProfile {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  roles?: string[] | null;
  [key: string]: unknown;
}

let cachedUserProfile: UserProfile | null = null;

export function getCachedUserProfile(): UserProfile | null {
  return cachedUserProfile;
}

export function setCachedUserProfile(profile: UserProfile | null): void {
  cachedUserProfile = profile;
}

export function clearUserCache(): void {
  cachedUserProfile = null;
}

/**
 * Fetches user details from GET /users.
 * Uses in-memory caching to avoid redundant/duplicate API calls.
 */
export async function fetchUserProfile(forceRefresh = false): Promise<UserProfile | null> {
  if (cachedUserProfile && !forceRefresh) {
    return cachedUserProfile;
  }

  try {
    const data = await apiRequest<unknown>('/users', {
      method: 'GET',
      authenticated: true,
    });

    let profile: UserProfile | null = null;
    if (Array.isArray(data) && data.length > 0) {
      profile = data[0] as UserProfile;
    } else if (typeof data === 'object' && data !== null) {
      profile = data as UserProfile;
    }

    if (profile) {
      cachedUserProfile = profile;
    }
    return profile;
  } catch (error) {
    if (__DEV__) {
      console.warn('[userService] Failed to fetch /users:', error);
    }
    return cachedUserProfile;
  }
}
