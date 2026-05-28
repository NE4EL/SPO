import { http } from './client';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  position: string | null;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'mechanic';
  full_name: string;
  phone?: string;
  position?: string;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'mechanic';
  full_name?: string;
  phone?: string;
  position?: string;
}

export const usersApi = {
  getAll: (): Promise<UserResponse[]> =>
    http.get<UserResponse[]>('/api/users/'),

  create: (data: UserCreate): Promise<UserResponse> =>
    http.post<UserResponse>('/api/users/', data),

  update: (id: number, data: UserUpdate): Promise<UserResponse> =>
    http.put<UserResponse>(`/api/users/${id}`, data),

  remove: (id: number): Promise<void> =>
    http.delete<void>(`/api/users/${id}`),
};
