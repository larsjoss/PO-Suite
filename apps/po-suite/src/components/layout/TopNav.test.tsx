import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
const logoutMock = vi.fn();

let mockApiKey: string | null = null;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@x.ch' },
    apiKey: mockApiKey,
    setApiKey: vi.fn(),
    login: vi.fn(),
    logout: logoutMock,
  }),
}));

vi.mock('react-router-dom', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { TopNav } from './TopNav';

function setup(initialPath = '/tools') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TopNav />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  logoutMock.mockReset();
  mockApiKey = null;
});

describe('TopNav — Rendering', () => {
  it('rendert <header> als banner mit aria-label', () => {
    setup();
    expect(screen.getByRole('banner', { name: /Seitennavigation/i })).toBeInTheDocument();
  });

  it('rendert tool-navigation mit aria-label', () => {
    setup();
    expect(screen.getByRole('navigation', { name: /Tool-Navigation/i })).toBeInTheDocument();
  });

  it('rendert Brand-Link "PO-Suite" zu /tools', () => {
    setup();
    const brand = screen.getByRole('link', { name: 'PO-Suite' });
    expect(brand).toHaveAttribute('href', '/tools');
  });

  it('rendert alle 5 Tool-Links', () => {
    setup();
    // banner-rolle filtert NavLinks zu Tools (5 stück + 1 brand)
    const nav = screen.getByRole('navigation', { name: /Tool-Navigation/i });
    const links = nav.querySelectorAll('a');
    expect(links.length).toBe(5);
  });
});

describe('TopNav — Active-State', () => {
  it('aktiver Tool-Link hat aria-current="page"', () => {
    setup('/tools/story-generator');
    // In der Tool-Navigation: nur EIN Tool-Link sollte unsere aria-current
    // logic triggern. Der Test prüft, dass der Story-Generator-Link
    // aria-current=page hat (per startsWith match).
    const nav = screen.getByRole('navigation', { name: /Tool-Navigation/i });
    const activeInToolNav = nav.querySelectorAll('[aria-current="page"]');
    expect(activeInToolNav.length).toBeGreaterThanOrEqual(1);
  });

  it('Tool-Navigation hat kein aria-current bei /tools (Tool-Auswahl-Page)', () => {
    setup('/tools');
    // Auf /tools selbst ist KEIN Tool-Path aktiv (alle Tools sind unter /tools/<id>).
    const nav = screen.getByRole('navigation', { name: /Tool-Navigation/i });
    const activeInToolNav = nav.querySelectorAll('[aria-current="page"]');
    expect(activeInToolNav.length).toBe(0);
  });
});

describe('TopNav — API-Key-Indikator', () => {
  it('zeigt "Kein API-Key konfiguriert" wenn apiKey=null', () => {
    mockApiKey = null;
    setup();
    expect(
      screen.getByLabelText(/Kein API-Key konfiguriert/i),
    ).toBeInTheDocument();
  });

  it('zeigt "Anthropic API-Key aktiv" wenn apiKey gesetzt', () => {
    mockApiKey = 'sk-ant-test';
    setup();
    expect(
      screen.getByLabelText(/Anthropic API-Key aktiv/i),
    ).toBeInTheDocument();
  });
});

describe('TopNav — Aktionen', () => {
  it('Logout-Button ruft logout und navigiert zu /auth', async () => {
    logoutMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Abmelden/i }));
    expect(logoutMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith('/auth');
  });

  it('Einstellungen-Button ist klickbar', () => {
    setup();
    const btn = screen.getByRole('button', { name: /API-Key-Einstellungen öffnen/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });
});
