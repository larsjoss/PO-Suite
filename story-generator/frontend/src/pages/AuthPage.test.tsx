import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

let mockUser: { id: string; email: string } | null = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    apiKey: null,
    setApiKey: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { AuthPage } from './AuthPage';

beforeEach(() => {
  mockUser = null;
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/auth']}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/tools" element={<div>Tool-Auswahl</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  it('rendert Login-Form wenn kein User', () => {
    renderPage();
    expect(screen.getByRole('main', { name: /Anmeldung/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('redirected zu /tools wenn User gesetzt', () => {
    mockUser = { id: '1', email: 'x@y.ch' };
    renderPage();
    expect(screen.getByText('Tool-Auswahl')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'AI Tools' })).not.toBeInTheDocument();
  });
});
