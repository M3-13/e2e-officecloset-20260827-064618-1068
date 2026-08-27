import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/wardrobe" element={<div>Wardrobe erreicht</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function okAuthResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ access_token: 'test-token', token_type: 'bearer' }),
  };
}

function errorAuthResponse(status: number, code: string, message: string) {
  return {
    ok: false,
    status,
    json: async () => ({ error: { code, message } }),
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('logs in and stores the token, then redirects to /wardrobe', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okAuthResponse());
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/login');

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'du@beispiel.de',
    );
    await userEvent.type(screen.getByLabelText('Passwort'), 'geheim');
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(screen.getByText('Wardrobe erreicht')).toBeInTheDocument();
    });
    expect(localStorage.getItem('auth_token')).toBe('test-token');
  });

  it('shows the API error message when login fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        errorAuthResponse(401, 'invalid_credentials', 'Falsche Zugangsdaten'),
      );
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/login');

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'du@beispiel.de',
    );
    await userEvent.type(screen.getByLabelText('Passwort'), 'falsch');
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Falsche Zugangsdaten',
      );
    });
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('registers, stores the token and redirects to /wardrobe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ access_token: 'test-token', token_type: 'bearer' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/register');

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'neu@beispiel.de',
    );
    await userEvent.type(screen.getByLabelText('Passwort'), 'geheim');
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrieren' }),
    );

    await waitFor(() => {
      expect(screen.getByText('Wardrobe erreicht')).toBeInTheDocument();
    });
    expect(localStorage.getItem('auth_token')).toBe('test-token');
  });

  it('shows the API error message when registration fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        errorAuthResponse(409, 'email_exists', 'E-Mail bereits registriert'),
      );
    vi.stubGlobal('fetch', fetchMock);

    renderAt('/register');

    await userEvent.type(
      screen.getByLabelText('E-Mail'),
      'neu@beispiel.de',
    );
    await userEvent.type(screen.getByLabelText('Passwort'), 'geheim');
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrieren' }),
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'E-Mail bereits registriert',
      );
    });
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
