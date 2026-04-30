import { http } from './client';

// POST /api/auth/login
// Body: { username, password }
// Response: { access_token, refresh_token, token_type, role, username }
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: 'admin' | 'manager' | 'mechanic';
  username: string;
}

// GET /api/auth/me
// Response: { id, username, email, role, full_name, phone, position, created_at }
export interface MeResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  position: string | null;
  created_at: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    http.post<LoginResponse>('/api/auth/login', { username, password }),

  me: () =>
    http.get<MeResponse>('/api/auth/me'),

  refresh: (refresh_token: string) =>
    http.post<{ access_token: string; token_type: string }>('/api/auth/refresh', { refresh_token }),
};
