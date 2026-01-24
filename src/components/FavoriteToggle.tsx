"use client";

import { useSyncExternalStore } from "react";
import {
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favoritesStore";

type FavoriteToggleProps = {
  slug: string;
};

export function FavoriteToggle({ slug }: FavoriteToggleProps) {
  const active = useSyncExternalStore(
    subscribeFavorites,
    () => getFavoritesSnapshot().includes(slug),
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
