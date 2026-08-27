import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountPage from './AccountPage';
import { AuthProvider } from '../auth/AuthContext';

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/konto']}>
        <Routes>
          <Route path="/konto" element={<AccountPage />} />
          <Route path="/login" element={<div>Login-Seite</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the account heading and delete button', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Konto' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Konto löschen' }),
    ).toBeInTheDocument();
  });

  it('opens a confirmation dialog before deleting', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Konto löschen' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Konto wirklich löschen?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Abbrechen' }),
    ).toBeInTheDocument();
  });

  it('deletes the account, logs out and redirects to login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Konto löschen' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/me',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    expect(
      screen.getByText('Dein Konto wurde gelöscht.'),
    ).toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBeNull();

    expect(
      await screen.findByText('Login-Seite', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('shows an error message and keeps the session when deletion fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { code: 'unauthorized', message: 'Nicht angemeldet.' },
      }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Konto löschen' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));

    expect(
      await screen.findByText('Nicht angemeldet.'),
    ).toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBe('test-token');
  });
});
