import { setStoredToken, clearStoredToken } from '../../shared/api/client';

export type AuthUser = {
  username: string;
  fullName: string;
  role?: string;
};

const USER_KEY = 'sto.auth.user';

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  setStoredToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthUser(): void {
  clearStoredToken();
  localStorage.removeItem(USER_KEY);
}
