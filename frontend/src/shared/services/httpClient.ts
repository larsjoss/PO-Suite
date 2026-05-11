import { ENTERPRISE_JWT_KEY } from './storageKeys';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getJwt(): string | null {
  return sessionStorage.getItem(ENTERPRISE_JWT_KEY);
}

export function setJwt(token: string): void {
  sessionStorage.setItem(ENTERPRISE_JWT_KEY, token);
}

export function clearJwt(): void {
  sessionStorage.removeItem(ENTERPRISE_JWT_KEY);
}

// Global 401 handler — wired up once by AuthContext
let on401: (() => void) | null = null;
export function setOn401Handler(fn: () => void): void {
  on401 = fn;
}

export async function fetchApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const token = getJwt();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    clearJwt();
    on401?.();
    throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Serverfehler (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function fetchApiGet<T>(endpoint: string): Promise<T> {
  const token = getJwt();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    clearJwt();
    on401?.();
    throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Serverfehler (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function fetchApiDelete(endpoint: string): Promise<void> {
  const token = getJwt();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    clearJwt();
    on401?.();
    throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Serverfehler (${res.status})`);
  }
}
