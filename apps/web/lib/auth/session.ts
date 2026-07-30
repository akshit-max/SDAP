import { setToken, clearToken, getToken } from './token';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
}

export interface OrganizationSession {
  id: string;
  name: string;
  slug?: string;
}

export class AuthSession {
  static getAccessToken(): string | null {
    return getToken();
  }

  static getCurrentUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static getCurrentOrganization(): OrganizationSession | null {
    if (typeof window === 'undefined') return null;
    const orgStr = localStorage.getItem('auth_org');
    return orgStr ? JSON.parse(orgStr) : null;
  }

  static setSession(accessToken: string, user: UserSession, organization: OrganizationSession | null) {
    setToken(accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
      if (organization) {
        localStorage.setItem('auth_org', JSON.stringify(organization));
      } else {
        localStorage.removeItem('auth_org');
      }
    }
  }

  static clear() {
    clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_org');
    }
  }
}
