import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OutfitsPage from './OutfitsPage';

const outfits = [
  {
    id: 1,
    name: 'Abendlook',
    owner_id: 1,
    items: [
      {
        id: 1,
        name: 'Rotes Kleid',
        category: 'Kleider',
        color: 'rot',
        image_url: 'http://example.com/dress.png',
        owner_id: 1,
      },
      {
        id: 2,
        name: 'Goldene Schuhe',
        category: 'Schuhe',
        color: 'gold',
        image_url: 'http://example.com/shoes.png',
        owner_id: 1,
      },
    ],
  },
  {
    id: 2,
    name: 'Business',
    owner_id: 1,
    items: [
      {
        id: 3,
        name: 'Blazer',
        category: 'Oberteile',
        color: 'schwarz',
        image_url: 'http://example.com/blazer.png',
        owner_id: 1,
      },
    ],
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch() {
  let current = [...outfits];
  const fn = vi.fn().mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'GET' && url.endsWith('/api/outfits')) {
        return jsonResponse(current);
      }
      if (method === 'DELETE') {
        const id = Number(url.split('/').pop());
        current = current.filter((o) => o.id !== id);
        return new Response(null, { status: 204 });
      }
      return jsonResponse([], 404);
    },
  );
  return fn;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <OutfitsPage />
    </MemoryRouter>,
  );
}

describe('OutfitsPage', () => {
  it('renders saved outfits as tiles', async () => {
    vi.stubGlobal('fetch', mockFetch());
    renderPage();

    expect(await screen.findByText('Abendlook')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('opens the detail view when a tile is clicked', async () => {
    vi.stubGlobal('fetch', mockFetch());
    renderPage();

    const tile = await screen.findByRole('button', {
      name: 'Abendlook ansehen',
    });
    await userEvent.click(tile);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Rotes Kleid')).toBeInTheDocument();
    expect(screen.getByText('Goldene Schuhe')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('deletes an outfit from the detail view', async () => {
    vi.stubGlobal('fetch', mockFetch());
    renderPage();

    const tile = await screen.findByRole('button', {
      name: 'Abendlook ansehen',
    });
    await userEvent.click(tile);
    await userEvent.click(screen.getByRole('button', { name: 'Outfit löschen' }));

    await waitFor(() => {
      expect(screen.queryByText('Abendlook')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Business')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
