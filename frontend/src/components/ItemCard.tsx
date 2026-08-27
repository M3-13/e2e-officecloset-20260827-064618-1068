import { useState } from 'react';
import './ItemCard.css';

export interface Item {
  id: number;
  name: string;
  category: string;
  color: string;
  image_url: string;
  owner_id: number;
}

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
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

export default function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage =
    item.image_url && item.image_url.trim().length > 0 && !imageFailed;

  return (
    <article className="item-card">
      <div className="item-card-image">
        {hasImage ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="item-card-placeholder">
            <HangerIcon />
          </div>
        )}
      </div>

      <div className="item-card-body">
        <h3 className="item-card-name">{item.name}</h3>
        <div className="item-card-meta">
          <span className="item-card-badge">{item.category}</span>
          {item.color && (
            <span className="item-card-color">
              <span
                className="item-card-swatch"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {item.color}
            </span>
          )}
        </div>
        <div className="item-card-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onEdit(item)}
          >
            Bearbeiten
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete(item)}
          >
            Löschen
          </button>
        </div>
      </div>
    </article>
  );
}
