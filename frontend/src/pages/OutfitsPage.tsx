import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../api/client';
import OutfitTile, { ItemImage, type Outfit } from '../components/OutfitTile';
import '../styles/outfits.css';

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Outfit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadOutfits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Outfit[]>('/api/outfits');
      setOutfits(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Outfits konnten nicht geladen werden.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutfits();
  }, [loadOutfits]);

  const handleDelete = async () => {
    if (!selected) {
      return;
    }
    setDeleting(true);
    try {
      await apiFetch<void>(`/api/outfits/${selected.id}`, { method: 'DELETE' });
      setSelected(null);
      await loadOutfits();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Löschen fehlgeschlagen.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="outfits-page">
      <header className="page-header">
        <div>
          <h1>Outfits</h1>
          <p className="page-subtitle">Deine gespeicherten Looks</p>
        </div>
        <Link to="/outfits/neu" className="btn btn-primary">
          Neues Outfit
        </Link>
      </header>

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Lädt …</p>
      ) : outfits.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 6a2 2 0 1 0-2-2" />
              <path d="M12 7.5 3 12.5V14l9 4.5L21 14v-1.5L12 7.5z" />
            </svg>
          </span>
          <h2 className="empty-state-title">Noch keine Outfits</h2>
          <p className="empty-state-desc">
            Kombiniere Kleidungsstücke im Outfit-Creator zu deinem ersten Look.
          </p>
          <Link to="/outfits/neu" className="btn btn-primary">
            Outfit erstellen
          </Link>
        </div>
      ) : (
        <div className="outfits-grid">
          {outfits.map((outfit) => (
            <OutfitTile key={outfit.id} outfit={outfit} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="outfit-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Schließen"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <h2 id="outfit-detail-title" className="modal-title">
              {selected.name}
            </h2>
            <ul className="outfit-detail-list">
              {selected.items.map((item) => (
                <li key={item.id} className="outfit-detail-item">
                  <div className="outfit-detail-img">
                    <ItemImage item={item} />
                  </div>
                  <div>
                    <span className="outfit-detail-name">{item.name}</span>
                    <span className="badge">{item.category}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Lösche …' : 'Outfit löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
