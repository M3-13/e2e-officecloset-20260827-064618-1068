import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../auth/AuthContext';

function renderApp(initialEntries: string[]) {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={initialEntries}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ImpressumPage', () => {
  it('is reachable at /impressum and renders the legal notice', () => {
    renderApp(['/impressum']);

    expect(
      screen.getByRole('heading', { name: 'Impressum' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Angaben gemäß § 5 DDG/)).toBeInTheDocument();
    expect(screen.getByText(/Vestiaire GmbH/)).toBeInTheDocument();
  });
});

describe('PrivacyPage', () => {
  it('is reachable at /datenschutz and renders the privacy policy', () => {
    renderApp(['/datenschutz']);

    expect(
      screen.getByRole('heading', { name: 'Datenschutzerklärung' }),
    ).toBeInTheDocument();
    expect(screen.getByText('E-Mail-Adresse:')).toBeInTheDocument();
    expect(screen.getByText(/Hash-Wert \(BCrypt\)/)).toBeInTheDocument();
    expect(screen.getByText('Garderobendaten:')).toBeInTheDocument();
  });
});
