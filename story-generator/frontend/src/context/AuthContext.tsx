import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';

const API_KEY_SESSION_KEY = 'anthropic_api_key';
const SESSION_USER_KEY = 'session_user';

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

  const setApiKey = (key: string) => {
    sessionStorage.setItem(API_KEY_SESSION_KEY, key);
    setApiKeyState(key);
  };

  const login = async (email: string, password: string, apiKeyParam?: string) => {
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
    setApiKeyState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, apiKey, setApiKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
