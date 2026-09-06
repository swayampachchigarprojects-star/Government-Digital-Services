import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { configureApiClient } from '../services/apiClient';
import { clearStoredToken, getStoredToken, storeToken } from '../services/tokenStorage';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const logout = async () => {
    tokenRef.current = null;
    setToken(null);
    await clearStoredToken();
  };

  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      onUnauthorized: () => { void logout(); },
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    void getStoredToken().then((storedToken) => {
      if (mounted) {
        tokenRef.current = storedToken;
        setToken(storedToken);
        setIsHydrating(false);
      }
    }).catch(() => {
      if (mounted) setIsHydrating(false);
    });
    return () => { mounted = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isAuthenticated: Boolean(token),
    isHydrating,
    setSession: async (nextToken: string) => {
      await storeToken(nextToken);
      tokenRef.current = nextToken;
      setToken(nextToken);
    },
    logout,
  }), [isHydrating, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
