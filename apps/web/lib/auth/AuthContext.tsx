'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthSession, UserSession, OrganizationSession } from './session';

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
    setUser(AuthSession.getCurrentUser());
    setOrganization(AuthSession.getCurrentOrganization());
    setIsLoading(false);
  };

  useEffect(() => {
    loadSession();
    
    // Listen for storage changes in case of cross-tab login/logout
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user' || e.key === 'auth_org') {
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
