import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OutfitCreatorPage from './OutfitCreatorPage';

const items = [
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
    name: 'Blazer',
    category: 'Oberteile',
    color: 'schwarz',
    image_url: 'http://example.com/blazer.png',
    owner_id: 1,
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/outfits/neu']}>
      <Routes>
        <Route path="/outfits/neu" element={<OutfitCreatorPage />} />
        <Route path="/outfits" element={<div>OUTFITS_PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OutfitCreatorPage', () => {
  it('selects items, names the outfit, and saves it', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fn = vi.fn().mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init });
        if (url.endsWith('/api/wardrobe/items')) {
          return jsonResponse(items);
        }
        if (url.endsWith('/api/outfits') && (init?.method ?? 'GET') === 'POST') {
          return jsonResponse(
            { id: 10, name: 'Mein Outfit', owner_id: 1, items },
            201,
          );
        }
        return jsonResponse([], 404);
      },
    );
    vi.stubGlobal('fetch', fn);

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /Rotes Kleid/ }));
    await userEvent.click(screen.getByRole('button', { name: /Blazer/ }));

    await userEvent.type(
      screen.getByLabelText('Name des Outfits'),
      'Mein Outfit',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Outfit speichern' }),
    );

    await waitFor(() => {
      const post = calls.find((c) => c.init?.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(post!.init!.body as string)).toEqual({
        name: 'Mein Outfit',
        item_ids: [1, 2],
      });
    });

    expect(await screen.findByText('OUTFITS_PAGE')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
