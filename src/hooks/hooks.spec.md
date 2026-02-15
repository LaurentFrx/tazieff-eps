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

## useTeacherMode

Hook React gérant `window.__teacherMode` avec synchronisation via custom events.

### API

```ts
function useTeacherMode(): {
  unlocked: boolean;
  pin: string;
  unlock: (pin: string) => void;
  lock: () => void;
};
```

### Comportement

- Lit `window.__teacherMode` via `useSyncExternalStore`.
- `unlock(pin)` écrit `{ unlocked: true, pin }` sur `window.__teacherMode` et dispatch `"teacherModeChange"`.
- `lock()` écrit `{ unlocked: false, pin: "" }` et dispatch l'événement.
- SSR-safe : retourne `{ unlocked: false, pin: "" }` côté serveur.
- Coerce `unlocked` en `boolean` pour tolérer les valeurs truthy.

### Tests (10)

Couvrent : état par défaut, lecture initiale, unlock/lock, dispatch d'événements custom, coercion, réaction à `_emit` externe, round-trip.
