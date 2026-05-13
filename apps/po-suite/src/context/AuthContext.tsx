import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { API_KEY_SESSION_KEY, SESSION_USER_KEY, ENTERPRISE_JWT_KEY } from '../shared/services/storageKeys';
import { setJwt, clearJwt, setOn401Handler } from '../shared/services/httpClient';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const ALLOWED_EMAIL = import.meta.env.VITE_AUTH_EMAIL;
const ALLOWED_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD;

interface AuthContextType {
  user: User | null;
  apiKey: string | null;
  setApiKey: (key: string) => void;
  login: (email: string, password: string, apiKey?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_USER_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const [apiKey, setApiKeyState] = useState<string | null>(
    () => sessionStorage.getItem(API_KEY_SESSION_KEY),
  );

  // Register global 401 handler once — redirects to /auth on token expiry
  useEffect(() => {
    if (!IS_ENTERPRISE) return;
    setOn401Handler(() => {
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(ENTERPRISE_JWT_KEY);
      setUser(null);
      window.location.href = '/auth';
    });
  }, []);

  const setApiKey = (key: string) => {
    sessionStorage.setItem(API_KEY_SESSION_KEY, key);
    setApiKeyState(key);
  };

  const login = async (email: string, password: string, apiKeyParam?: string) => {
    if (IS_ENTERPRISE) {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? 'Login fehlgeschlagen');
      }

      const data = await res.json() as { token: string; user: User };
      setJwt(data.token);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return;
    }

    // GitHub-Pages / local build
    if (!ALLOWED_EMAIL || !ALLOWED_PASSWORD) {
      throw new Error(
        'Auth ist nicht konfiguriert. Lege eine .env-Datei mit VITE_AUTH_EMAIL und VITE_AUTH_PASSWORD an (siehe .env.example).',
      );
    }
    if (email !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
      throw new Error('Ungültige E-Mail-Adresse oder Passwort');
    }
    const u: User = { id: '1', email };
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
    setUser(u);
    if (apiKeyParam) setApiKey(apiKeyParam);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(API_KEY_SESSION_KEY);
    clearJwt();
    setApiKeyState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, apiKey, setApiKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
