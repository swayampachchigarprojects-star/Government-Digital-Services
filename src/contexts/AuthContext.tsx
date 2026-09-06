import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { configureApiClient } from '../services/apiClient';
import { authService, AuthenticatedUser, AuthenticationResponse } from '../services/authService';
import { clearStoredToken, clearStoredUser, getStoredToken, getStoredUser, storeToken, storeUser } from '../services/tokenStorage';

interface AuthContextValue {
  token: string | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (session: AuthenticationResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const tokenRef = useRef<string | null>(null);
  const logoutInFlightRef = useRef<Promise<void> | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const clearLocalSession = async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    await Promise.all([clearStoredToken(), clearStoredUser()]);
  };

  const logout = async () => {
    if (logoutInFlightRef.current) return logoutInFlightRef.current;

    const logoutRequest = (async () => {
      try {
        if (tokenRef.current) await authService.logout();
      } catch {
        // Local cleanup must still complete when the backend is unavailable.
      } finally {
        await clearLocalSession();
      }
    })();

    logoutInFlightRef.current = logoutRequest;
    try {
      await logoutRequest;
    } finally {
      logoutInFlightRef.current = null;
    }
  };

  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      onUnauthorized: () => { void clearLocalSession(); },
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    void getStoredToken().then(async (storedToken) => {
      if (mounted) {
        const storedUser = await getStoredUser();
        tokenRef.current = storedToken;
        setToken(storedToken);
        setUser(storedUser);
        setIsHydrating(false);
      }
    }).catch(() => {
      if (mounted) setIsHydrating(false);
    });
    return () => { mounted = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    isHydrating,
    setSession: async (session: AuthenticationResponse) => {
      const { accessToken, tokenType: _tokenType, expiresInSeconds: _expiresInSeconds, ...profile } = session;
      await Promise.all([storeToken(accessToken), storeUser(profile)]);
      tokenRef.current = session.accessToken;
      setToken(session.accessToken);
      setUser(profile);
    },
    logout,
  }), [isHydrating, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
