import { useEffect, useState, type FormEvent } from 'react';
import type { Item } from './ItemCard';
import './ItemForm.css';

export const KATEGORIEN = [
  'Oberteile',
  'Unterteile',
  'Kleider',
  'Schuhe',
  'Accessoires',
];

export interface ItemInput {
  name: string;
  category: string;
  color: string;
  image_url: string;
}

interface ItemFormProps {
  initial?: Item | null;
  isSaving?: boolean;
  onSave: (input: ItemInput) => Promise<void> | void;
  onCancel?: () => void;
}

function HangerIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5a2 2 0 1 1 2 2" />
      <path d="M12 7 3.4 13.6A2 2 0 0 0 4.8 17h14.4a2 2 0 0 0 1.4-3.4L12 7Z" />
    </svg>
  );
}

export default function ItemForm({
  initial,
  isSaving = false,
  onSave,
  onCancel,
}: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? KATEGORIEN[0]);
  const [color, setColor] = useState(initial?.color ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name ?? '');
    setCategory(initial?.category ?? KATEGORIEN[0]);
    setColor(initial?.color ?? '');
    setImageUrl(initial?.image_url ?? '');
    setImageFailed(false);
    setError(null);
  }, [initial]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.');
      return;
    }
    if (!category) {
      setError('Bitte wähle eine Kategorie.');
      return;
    }
    setError(null);
    void onSave({
      name: name.trim(),
      category,
      color: color.trim(),
      image_url: imageUrl.trim(),
    });
  }

  const showPreview = imageUrl.trim().length > 0;

  return (
    <form className="item-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="item-name">
          Name
        </label>
        <input
          id="item-name"
          className="field-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Schwarzes Abendkleid"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="item-category">
          Kategorie
        </label>
        <select
          id="item-category"
          className="field-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {KATEGORIEN.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="item-color">
          Farbe
        </label>
        <input
          id="item-color"
          className="field-input"
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="z. B. Schwarz"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="item-image-url">
          Bild-URL
        </label>
        <input
          id="item-image-url"
          className="field-input"
          type="url"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setImageFailed(false);
          }}
          placeholder="https://example.com/bild.jpg"
        />
        <p className="field-hint">
          Unterstützt http/https. Das Bild wird live als Vorschau angezeigt.
        </p>
      </div>

      {showPreview && (
        <div className="item-form-preview">
          {imageFailed ? (
            <div className="item-form-preview-placeholder">
              <HangerIcon />
              <span>Bild konnte nicht geladen werden</span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Vorschau"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="item-form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Speichert…' : initial ? 'Speichern' : 'Anlegen'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
