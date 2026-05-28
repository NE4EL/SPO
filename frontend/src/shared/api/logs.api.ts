import { http } from './client';

export interface AuditLogUser {
  id: number;
  username: string;
  role: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user: AuditLogUser | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  created_at: string;
}

export const logsApi = {
  getAll: (limit = 200, offset = 0) =>
    http.get<AuditLog[]>(`/api/logs/?limit=${limit}&offset=${offset}`),
};
