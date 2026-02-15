import { useCallback, useSyncExternalStore } from "react";
import {
  EMPTY_FAVORITES_SERVER_SNAPSHOT,
  getFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite as storeToggle,
  setFavorites,
} from "@/lib/favoritesStore";

export type UseFavoritesReturn = {
  favorites: string[];
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
  set: (slugs: string[]) => void;
};

export function useFavorites(): UseFavoritesReturn {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES_SERVER_SNAPSHOT,
  );

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggle = useCallback((slug: string) => {
    storeToggle(slug);
  }, []);

  const set = useCallback((slugs: string[]) => {
    setFavorites(slugs);
  }, []);

  return { favorites, isFavorite, toggle, set };
}
