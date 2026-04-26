# Hooks — Spécification

## useFavorites

Hook React encapsulant `favoritesStore` via `useSyncExternalStore`.

### API

```ts
function useFavorites(): {
  favorites: string[];          // liste des slugs favoris
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;  // ajoute ou retire
  set: (slugs: string[]) => void;  // remplace toute la liste
};
```

### Comportement

- SSR-safe : retourne `[]` côté serveur.
- Persiste dans `localStorage` sous la clé `"eps_favorites"`.
- Réagit aux changements cross-tab via `StorageEvent`.
- `toggle` et `set` sont des callbacks stables (via `useCallback`).

### Tests (12)

Couvrent : état initial, isFavorite, toggle add/remove, set/clear, persistance localStorage, callbacks stables, toggles rapides, round-trip.

---

## useAppAdmin (P0.1 — remplace useTeacherMode)

Hook React qui interroge `GET /api/me/role` au montage pour exposer le statut
admin de l'utilisateur courant. Conforme à `GOUVERNANCE_EDITORIALE.md` §3.1, §7.

### API

```ts
function useAppAdmin(): {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
};
```

### Comportement

- Initialise les booléens à `false` (deny by default — moindre privilège).
- Appelle `/api/me/role` au mount (cache `no-store`).
- En cas d'erreur réseau / réponse non-OK : retombe sur deny.
- `refetch()` permet de recharger après login/logout.

### Tests (6)

Couvrent : anonymous, authentifié non-admin, super_admin, admin simple, refetch après changement, fallback deny sur erreur HTTP.

> Le hook précédent `useTeacherMode` (PIN local) a été supprimé en P0.1 le 26 avril 2026.
