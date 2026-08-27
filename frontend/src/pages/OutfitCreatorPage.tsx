import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '../api/client';
import { ItemImage, type Item } from '../components/OutfitTile';
import '../styles/outfits.css';

const CATEGORY_FILTERS = [
  'Alle',
  'Oberteile',
  'Unterteile',
  'Kleider',
  'Schuhe',
  'Accessoires',
];

export default function OutfitCreatorPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [category, setCategory] = useState<string>('Alle');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Item[]>('/api/wardrobe/items');
        if (active) {
          setItems(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Garderobe konnte nicht geladen werden.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (category === 'Alle') {
      return items;
    }
    return items.filter((item) => item.category === category);
  }, [items, category]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const toggleItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canSave = name.trim().length > 0 && selectedIds.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch<Item>('/api/outfits', {
        method: 'POST',
        body: { name: name.trim(), item_ids: selectedIds },
      });
      navigate('/outfits');
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : 'Speichern fehlgeschlagen.',
      );
      setSaving(false);
    }
  };

  return (
    <div className="outfit-creator">
      <header className="page-header">
        <div>
          <h1>Neues Outfit</h1>
          <p className="page-subtitle">
            Wähle Einzelteile und gib deinem Look einen Namen.
          </p>
        </div>
      </header>

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      <div className="outfit-creator-toolbar">
        <div className="form-field">
          <label className="form-label" htmlFor="outfit-name">
            Name des Outfits
          </label>
          <input
            id="outfit-name"
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Abendlook"
            maxLength={80}
          />
        </div>
        <div className="form-field">
          <span className="form-label">Ausgewählt</span>
          <span className="selection-count">{selectedIds.length} Teile</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSave}
          onClick={handleSave}
        >
          {saving ? 'Speichere …' : 'Outfit speichern'}
        </button>
      </div>

      {saveError && (
        <p className="error-banner" role="alert">
          {saveError}
        </p>
      )}

      <div className="outfit-creator-layout">
        <section className="outfit-select" aria-label="Kleidungsstücke auswählen">
          <div className="filter-bar" role="group" aria-label="Nach Kategorie filtern">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`badge${category === cat ? ' badge--active' : ''}`}
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="muted">Lädt …</p>
          ) : filteredItems.length === 0 ? (
            <p className="muted">Keine Kleidungsstücke in dieser Kategorie.</p>
          ) : (
            <div className="outfit-select-grid">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`outfit-select-item${
                      isSelected ? ' outfit-select-item--selected' : ''
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="outfit-select-item-img">
                      <ItemImage item={item} alt="" />
                    </div>
                    <span className="outfit-select-item-name">{item.name}</span>
                    <span className="badge">{item.category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="outfit-preview" aria-label="Vorschau">
          <h2 className="section-title">Vorschau</h2>
          {selectedItems.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-state-title">Noch nichts ausgewählt</h3>
              <p className="empty-state-desc">
                Klicke links auf Kleidungsstücke, um deinen Look
                zusammenzustellen.
              </p>
            </div>
          ) : (
            <div className="outfit-preview-grid">
              {selectedItems.map((item) => (
                <div key={item.id} className="preview-item">
                  <div className="preview-item-img">
                    <ItemImage item={item} />
                  </div>
                  <span className="preview-item-name">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
