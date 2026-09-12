import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { configureApiClient } from '../services/apiClient';
import { authService, AuthenticatedUser, AuthenticationResponse } from '../services/authService';
import {
  clearStoredEntityId,
  clearStoredToken,
  clearStoredUser,
  getStoredEntityId,
  getStoredToken,
  getStoredUser,
  storeEntityId,
  storeToken,
  storeUser,
} from '../services/tokenStorage';
import { setCachedEntityId } from '../services/entityService';

interface AuthContextValue {
  token: string | null;
  user: AuthenticatedUser | null;
  accountEntityId: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (session: AuthenticationResponse) => Promise<void>;
  setEntityId: (id: string | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accountEntityId, setAccountEntityId] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const logoutInFlightRef = useRef<Promise<void> | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const clearLocalSession = async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setAccountEntityId(null);
    setCachedEntityId(null);
    await Promise.all([clearStoredToken(), clearStoredUser(), clearStoredEntityId()]);
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
    void Promise.all([getStoredToken(), getStoredUser(), getStoredEntityId()]).then(
      async ([storedToken, storedUser, storedEntityId]) => {
        if (mounted) {
          tokenRef.current = storedToken;
          setToken(storedToken);
          setUser(storedUser);
          const entityId =
            storedEntityId ||
            storedUser?.accountingEntityId ||
            (storedUser as Record<string, unknown> | null)?.accountEntityId ||
            null;
          const resolvedEntityId = typeof entityId === 'string' ? entityId : null;
          setAccountEntityId(resolvedEntityId);
          setCachedEntityId(resolvedEntityId);
          setIsHydrating(false);
        }
      }
    ).catch(() => {
      if (mounted) setIsHydrating(false);
    });
    return () => { mounted = false; };
  }, []);

  const setEntityId = async (id: string | null) => {
    if (id) {
      await storeEntityId(id);
      setAccountEntityId(id);
      setCachedEntityId(id);
      if (user) {
        const updatedUser: AuthenticatedUser = {
          ...user,
          accountingEntityId: id,
          accountEntityId: id,
        };
        await storeUser(updatedUser);
        setUser(updatedUser);
      }
    } else {
      await clearStoredEntityId();
      setAccountEntityId(null);
      setCachedEntityId(null);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    accountEntityId,
    isAuthenticated: Boolean(token),
    isHydrating,
    setSession: async (session: AuthenticationResponse) => {
      const { accessToken, tokenType: _tokenType, expiresInSeconds: _expiresInSeconds, ...profile } = session;
      const rawEntityId = session.accountEntityId || session.accountingEntityId || null;
      await Promise.all([
        storeToken(accessToken),
        storeUser(profile),
        rawEntityId ? storeEntityId(rawEntityId) : Promise.resolve(),
      ]);
      tokenRef.current = session.accessToken;
      setToken(session.accessToken);
      setUser(profile);
      if (rawEntityId) {
        setAccountEntityId(rawEntityId);
        setCachedEntityId(rawEntityId);
      }
    },
    setEntityId,
    logout,
  }), [accountEntityId, isHydrating, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
