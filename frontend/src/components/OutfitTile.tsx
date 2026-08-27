import { useState } from 'react';
import '../styles/outfits.css';

export interface Item {
  id: number;
  name: string;
  category: string;
  color: string;
  image_url: string;
  owner_id: number;
}

export interface Outfit {
  id: number;
  name: string;
  items: Item[];
  owner_id: number;
}

interface ItemImageProps {
  item: Item;
  alt?: string;
}

export function ItemImage({ item, alt }: ItemImageProps) {
  const [failed, setFailed] = useState(false);
  const label = alt ?? item.name;

  if (failed || !item.image_url) {
    return (
      <div
        className="item-image item-image--empty"
        role="img"
        aria-label={label}
      />
    );
  }

  return (
    <img
      className="item-image"
      src={item.image_url}
      alt={label}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

interface OutfitTileProps {
  outfit: Outfit;
  onSelect: (outfit: Outfit) => void;
}

export default function OutfitTile({ outfit, onSelect }: OutfitTileProps) {
  const previewItems = outfit.items.slice(0, 4);
  const cells = Array.from({ length: 4 }, (_, i) => previewItems[i]);

  return (
    <button
      type="button"
      className="outfit-tile"
      onClick={() => onSelect(outfit)}
      aria-label={`${outfit.name} ansehen`}
    >
      <div className="outfit-tile-grid">
        {cells.map((item, i) => (
          <div className="outfit-tile-cell" key={item ? item.id : `empty-${i}`}>
            {item ? (
              <ItemImage item={item} alt="" />
            ) : (
              <div className="outfit-tile-cell-empty" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <span className="outfit-tile-name" title={outfit.name}>
        {outfit.name}
      </span>
    </button>
  );
}
