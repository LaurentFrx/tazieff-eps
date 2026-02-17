"use client";

import { useSyncExternalStore } from "react";
import {
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favoritesStore";
import { useI18n } from "@/lib/i18n/I18nProvider";

type FavoriteToggleProps = {
  slug: string;
};

export function FavoriteToggle({ slug }: FavoriteToggleProps) {
  const { t } = useI18n();
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
      {active ? t("favorites.remove") : t("favorites.add")}
    </button>
  );
}
