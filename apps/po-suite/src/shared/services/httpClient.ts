import { ENTERPRISE_JWT_KEY } from './storageKeys';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 60_000;

function getJwt(): string | null {
  return sessionStorage.getItem(ENTERPRISE_JWT_KEY);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Zeitüberschreitung nach ${Math.round(ms / 1000)} Sekunden. Bitte erneut versuchen.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearJwt();
    on401?.();
    throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Serverfehler (${res.status})`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
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
  const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return handleResponse<T>(res);
}

export async function fetchApiGet<T>(endpoint: string): Promise<T> {
  const token = getJwt();
  const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handleResponse<T>(res);
}

export async function fetchApiDelete(endpoint: string): Promise<void> {
  const token = getJwt();
  const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  await handleResponse<void>(res);
}
