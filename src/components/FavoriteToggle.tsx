"use client";

import { useSyncExternalStore } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/storage";

type FavoriteToggleProps = {
  slug: string;
};

export function FavoriteToggle({ slug }: FavoriteToggleProps) {
  const active = useSyncExternalStore(
    (callback) => onFavoritesChange(() => callback()),
    () => isFavorite(slug),
    () => false,
  );

  return (
    <button
      type="button"
      className={`favorite-toggle${active ? " is-active" : ""}`}
      onClick={() => {
        toggleFavorite(slug);
      }}
    >
      {active ? "★ Favori" : "☆ Ajouter aux favoris"}
    </button>
  );
}
