import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ItemCard, { type Item } from '../components/ItemCard';
import ItemForm from '../components/ItemForm';
import { AuthProvider } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import WardrobePage from './WardrobePage';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

const mockApiFetch = vi.mocked(apiFetch);

const sampleItem: Item = {
  id: 1,
  name: 'Bluse',
  category: 'Oberteile',
  color: 'Weiß',
  image_url: '',
  owner_id: 1,
};

function signedInToken(): string {
  const payload = btoa(JSON.stringify({ sub: '1', exp: 9999999999 }));
  return `header.${payload}.signature`;
}

function renderWardrobe() {
  return render(
    <AuthProvider>
      <WardrobePage />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('auth_token', signedInToken());
});

describe('ItemForm', () => {
  it('renders name, category, color and image-url fields', () => {
    render(<ItemForm onSave={vi.fn()} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Kategorie')).toBeInTheDocument();
    expect(screen.getByLabelText('Farbe')).toBeInTheDocument();
    expect(screen.getByLabelText('Bild-URL')).toBeInTheDocument();
  });

  it('shows a live image preview for the entered URL', () => {
    render(<ItemForm onSave={vi.fn()} />);
    expect(screen.queryByRole('img', { name: 'Vorschau' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Bild-URL'), {
      target: { value: 'https://example.com/dress.jpg' },
    });
    expect(screen.getByRole('img', { name: 'Vorschau' })).toHaveAttribute(
      'src',
      'https://example.com/dress.jpg',
    );
  });

  it('submits the entered values to onSave', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ItemForm onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Schwarzes Kleid' },
    });
    fireEvent.change(screen.getByLabelText('Farbe'), {
      target: { value: 'Schwarz' },
    });
    fireEvent.change(screen.getByLabelText('Bild-URL'), {
      target: { value: 'https://example.com/dress.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Schwarzes Kleid',
      category: 'Oberteile',
      color: 'Schwarz',
      image_url: 'https://example.com/dress.jpg',
    });
  });

  it('shows a validation error when the name is empty', async () => {
    const onSave = vi.fn();
    render(<ItemForm onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
    expect(await screen.findByText('Bitte gib einen Namen ein.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('ItemCard', () => {
  it('renders name, category, color and action buttons', () => {
    render(<ItemCard item={sampleItem} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Bluse')).toBeInTheDocument();
    expect(screen.getByText('Oberteile')).toBeInTheDocument();
    expect(screen.getByText('Weiß')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('calls onEdit and onDelete with the item', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ItemCard item={sampleItem} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(onEdit).toHaveBeenCalledWith(sampleItem);
    expect(onDelete).toHaveBeenCalledWith(sampleItem);
  });
});

describe('WardrobePage', () => {
  it('renders the heading and lists the wardrobe items', async () => {
    mockApiFetch.mockResolvedValue([sampleItem]);
    renderWardrobe();
    expect(screen.getByRole('heading', { name: 'Garderobe' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Bluse')).toBeInTheDocument());
  });

  it('filters the items by category', async () => {
    mockApiFetch.mockResolvedValue([
      sampleItem,
      { ...sampleItem, id: 2, name: 'Hose', category: 'Unterteile' },
    ]);
    renderWardrobe();
    await waitFor(() => expect(screen.getByText('Hose')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Oberteile' }));
    expect(screen.getByText('Bluse')).toBeInTheDocument();
    expect(screen.queryByText('Hose')).not.toBeInTheDocument();
  });

  it('creates a new item via the form', async () => {
    mockApiFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(sampleItem);
    renderWardrobe();
    await waitFor(() =>
      expect(screen.getByText(/Noch keine Kleidungsstücke/)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Neues Kleidungsstück' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Bluse' },
    });
    fireEvent.change(screen.getByLabelText('Bild-URL'), {
      target: { value: 'https://example.com/b.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/api/wardrobe/items', {
        method: 'POST',
        body: expect.objectContaining({ name: 'Bluse' }),
      }),
    );
  });

  it('edits an item via the form and updates the card', async () => {
    const updated = { ...sampleItem, name: 'Bluse (geändert)' };
    mockApiFetch
      .mockResolvedValueOnce([sampleItem])
      .mockResolvedValueOnce(updated);
    renderWardrobe();
    await waitFor(() => expect(screen.getByText('Bluse')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Bluse');
    expect((screen.getByLabelText('Farbe') as HTMLInputElement).value).toBe(
      'Weiß',
    );
    expect((screen.getByLabelText('Kategorie') as HTMLSelectElement).value).toBe(
      'Oberteile',
    );

    fireEvent.change(nameInput, { target: { value: 'Bluse (geändert)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/api/wardrobe/items/1', {
        method: 'PUT',
        body: expect.objectContaining({ name: 'Bluse (geändert)' }),
      }),
    );
    await waitFor(() =>
      expect(screen.getByText('Bluse (geändert)')).toBeInTheDocument(),
    );
  });

  it('deletes an item after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApiFetch.mockResolvedValue([sampleItem]);
    renderWardrobe();
    await waitFor(() => expect(screen.getByText('Bluse')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/api/wardrobe/items/1', {
        method: 'DELETE',
      }),
    );
    confirmSpy.mockRestore();
  });
});
