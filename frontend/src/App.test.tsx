import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';

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

describe('App shell', () => {
  it('renders the brand, navigation and footer links', () => {
    renderApp(['/wardrobe']);

    expect(screen.getByRole('link', { name: 'Vestiaire' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Garderobe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Outfits' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Konto' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Impressum' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Datenschutz' })).toHaveLength(2);
  });

  it('redirects the root route to the wardrobe page', () => {
    renderApp(['/']);

    expect(
      screen.getByRole('heading', { name: 'Garderobe' }),
    ).toBeInTheDocument();
  });
});
