'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthSession, UserSession, OrganizationSession } from './session';
import { STORAGE_KEYS } from './auth-storage';

interface AuthContextType {
  user: UserSession | null;
  organization: OrganizationSession | null;
  isLoading: boolean;
  refreshContext: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  isLoading: true,
  refreshContext: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [organization, setOrganization] = useState<OrganizationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = () => {
    // B-3: Clear stale localStorage sessions on startup.
    // If the stored token is past its tracked expiry, clear everything
    // rather than hydrating the user with a session that will immediately
    // 401 on the first API call.
    if (AuthSession.isExpired()) {
      AuthSession.clear();
      setUser(null);
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    setUser(AuthSession.getCurrentUser());
    setOrganization(AuthSession.getCurrentOrganization());
    setIsLoading(false);
  };

  useEffect(() => {
    loadSession();

    // Listen for storage changes (cross-tab login/logout)
    // B-3: Use STORAGE_KEYS constants — no hard-coded strings
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER || e.key === STORAGE_KEYS.ORG) {
        loadSession();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, refreshContext: loadSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
