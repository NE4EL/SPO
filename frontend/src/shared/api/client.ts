// Базовый URL бэкенда. Создай файл .env в корне проекта:
// VITE_API_URL=http://localhost:8000
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

const TOKEN_KEY = 'sto.auth.token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearStoredToken();
    localStorage.removeItem('sto.auth.user');
    window.location.href = '/login';
    throw new Error('Сессия истекла');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Ошибка сервера: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, body: unknown)  => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)  => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
};
