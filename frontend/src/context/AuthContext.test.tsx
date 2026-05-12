import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { createElement } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// Credentials sind via vitest.config.ts env gesetzt:
// VITE_AUTH_EMAIL=test@example.com / VITE_AUTH_PASSWORD=testpass123
const VALID_EMAIL = 'test@example.com';
const VALID_PASSWORD = 'testpass123';

beforeEach(() => {
  sessionStorage.clear();
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function TestConsumer({ onMount }: { onMount: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();
  onMount(ctx);
  return <div data-testid="consumer" />;
}

function renderWithProvider(onMount: (ctx: ReturnType<typeof useAuth>) => void) {
  return render(
    createElement(AuthProvider, null,
      createElement(TestConsumer, { onMount }),
    ),
  );
}

// ─── Initial State ────────────────────────────────────────────────────────────

describe('AuthContext — Initial State', () => {
  it('user ist null ohne sessionStorage-Eintrag', () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.user).toBeNull();
  });

  it('apiKey ist null ohne sessionStorage-Eintrag', () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.apiKey).toBeNull();
  });

  it('liest user aus sessionStorage beim Mount', () => {
    sessionStorage.setItem('session_user', JSON.stringify({ id: '1', email: 'a@b.de' }));
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.user).toEqual({ id: '1', email: 'a@b.de' });
  });

  it('liest apiKey aus sessionStorage beim Mount', () => {
    sessionStorage.setItem('anthropic_api_key', 'sk-ant-test');
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.apiKey).toBe('sk-ant-test');
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('AuthContext — login()', () => {
  it('setzt user und speichert in sessionStorage bei korrekten Credentials', async () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      await ctx.login(VALID_EMAIL, VALID_PASSWORD);
    });

    expect(ctx.user).toEqual({ id: '1', email: VALID_EMAIL });
    expect(sessionStorage.getItem('session_user')).toContain(VALID_EMAIL);
  });

  it('setzt apiKey wenn beim Login mitgegeben', async () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      await ctx.login(VALID_EMAIL, VALID_PASSWORD, 'sk-ant-abc');
    });

    expect(ctx.apiKey).toBe('sk-ant-abc');
    expect(sessionStorage.getItem('anthropic_api_key')).toBe('sk-ant-abc');
  });

  it('wirft Fehler bei falschen Credentials', async () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });

    await expect(
      act(async () => {
        await ctx.login('wrong@example.com', 'wrong-password');
      }),
    ).rejects.toThrow('Ungültige E-Mail-Adresse oder Passwort');
  });

  it('setzt keinen user bei fehlgeschlossenem Login', async () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });

    try {
      await act(async () => {
        await ctx.login('wrong@example.com', 'wrong');
      });
    } catch {
      // expected
    }

    expect(ctx.user).toBeNull();
  });
});

// ─── logout() ────────────────────────────────────────────────────────────────

describe('AuthContext — logout()', () => {
  it('löscht user, apiKey und sessionStorage-Einträge', async () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      await ctx.login(VALID_EMAIL, VALID_PASSWORD, 'sk-ant-xyz');
    });
    expect(ctx.user).not.toBeNull();

    act(() => {
      ctx.logout();
    });

    expect(ctx.user).toBeNull();
    expect(ctx.apiKey).toBeNull();
    expect(sessionStorage.getItem('session_user')).toBeNull();
    expect(sessionStorage.getItem('anthropic_api_key')).toBeNull();
  });
});

// ─── setApiKey() ──────────────────────────────────────────────────────────────

describe('AuthContext — setApiKey()', () => {
  it('setzt apiKey in State und sessionStorage', () => {
    let ctx!: ReturnType<typeof useAuth>;
    renderWithProvider((c) => { ctx = c; });

    act(() => {
      ctx.setApiKey('sk-ant-new-key');
    });

    expect(ctx.apiKey).toBe('sk-ant-new-key');
    expect(sessionStorage.getItem('anthropic_api_key')).toBe('sk-ant-new-key');
  });
});
