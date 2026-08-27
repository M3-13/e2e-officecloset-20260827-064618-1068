import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import ItemCard, { type Item } from '../components/ItemCard';
import ItemForm, { KATEGORIEN, type ItemInput } from '../components/ItemForm';
import './WardrobePage.css';

type FormMode = 'closed' | 'create' | 'edit';

export default function WardrobePage() {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>('closed');
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await apiFetch<Item[]>('/api/wardrobe/items');
      setItems(data);
    } catch (err) {
      setPageError(
        err instanceof ApiError
          ? err.message
          : 'Die Garderobe konnte nicht geladen werden.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadItems();
    }
  }, [isAuthenticated, loadItems]);

  function startCreate() {
    setEditing(null);
    setFormError(null);
    setFormMode('create');
  }

  function startEdit(item: Item) {
    setEditing(item);
    setFormError(null);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode('closed');
    setEditing(null);
    setFormError(null);
  }

  async function handleSave(input: ItemInput) {
    setSaving(true);
    setFormError(null);
    try {
      if (formMode === 'edit' && editing) {
        const updated = await apiFetch<Item>(`/api/wardrobe/items/${editing.id}`, {
          method: 'PUT',
          body: input,
        });
        setItems((prev) =>
          prev.map((it) => (it.id === updated.id ? updated : it)),
        );
      } else {
        const created = await apiFetch<Item>('/api/wardrobe/items', {
          method: 'POST',
          body: input,
        });
        setItems((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item: Item) {
    const confirmed = window.confirm(
      `Möchtest du „${item.name}“ wirklich löschen?`,
    );
    if (!confirmed) {
      return;
    }
    void (async () => {
      try {
        await apiFetch<void>(`/api/wardrobe/items/${item.id}`, {
          method: 'DELETE',
        });
        setItems((prev) => prev.filter((it) => it.id !== item.id));
      } catch (err) {
        setPageError(
          err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen.',
        );
      }
    })();
  }

  const visibleItems = categoryFilter
    ? items.filter((it) => it.category === categoryFilter)
    : items;

  return (
    <div className="wardrobe">
      <div className="wardrobe-header">
        <h1>Garderobe</h1>
        {isAuthenticated && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startCreate}
          >
            Neues Kleidungsstück
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="wardrobe-state">
          <p>Bitte melde dich an, um deine Garderobe zu sehen.</p>
        </div>
      ) : (
        <>
          {pageError && (
            <div className="error-banner" role="alert">
              {pageError}
            </div>
          )}

          <div className="filter-bar">
            <button
              type="button"
              className={
                categoryFilter === null ? 'filter-badge active' : 'filter-badge'
              }
              onClick={() => setCategoryFilter(null)}
            >
              Alle
            </button>
            {KATEGORIEN.map((k) => (
              <button
                key={k}
                type="button"
                className={
                  categoryFilter === k ? 'filter-badge active' : 'filter-badge'
                }
                onClick={() => setCategoryFilter(k)}
              >
                {k}
              </button>
            ))}
          </div>

          {formMode !== 'closed' && (
            <div className="wardrobe-form">
              <h2 className="wardrobe-form-title">
                {formMode === 'edit'
                  ? 'Kleidungsstück bearbeiten'
                  : 'Neues Kleidungsstück'}
              </h2>
              <ItemForm
                initial={formMode === 'edit' ? editing : null}
                isSaving={saving}
                onSave={handleSave}
                onCancel={closeForm}
              />
              {formError && (
                <div className="error-banner" role="alert">
                  {formError}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="wardrobe-state">
              <p>Lade Garderobe…</p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="wardrobe-state">
              <p>
                {items.length === 0
                  ? 'Noch keine Kleidungsstücke. Lege dein erstes Stück an.'
                  : 'Keine Kleidungsstücke in dieser Kategorie.'}
              </p>
            </div>
          ) : (
            <div className="wardrobe-grid">
              {visibleItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
