---
name: favoris-state
description: >
  Système de favoris et patterns de gestion d'état de Tazieff EPS :
  useFavorites, favoritesStore, localStorage, useSyncExternalStore,
  cross-tab sync. Utiliser cette skill dès qu'on mentionne favoris,
  état, state management, localStorage, useSyncExternalStore, store,
  hook personnalisé, cross-tab, ou toute modification touchant à la
  persistance côté client. Aussi quand on crée un nouveau hook de
  state ou qu'on interagit avec favoritesStore.
---

# Favoris et gestion d'état — Tazieff EPS

## Architecture de state actuelle

4 systèmes coexistent (dette technique connue) :

1. **localStorage direct** (`src/lib/storage.ts`)
   - Clé `eps_favorites` pour les favoris
   - Clé `eps_theme` pour le thème (1, 2, 3)
   - Clé `eps_anatomy_anim` pour le toggle scan 3D
   - Convention : préfixe `eps_` pour toutes les clés

2. **favoritesStore** (`src/lib/favoritesStore.ts`)
   - Store custom avec pattern pub/sub
   - Compatible `useSyncExternalStore` (React 18)
   - Cross-tab sync via `storage` event du navigateur

3. **window.__teacherMode** (global mutable)
   - Legacy, conservé pour compatibilité
   - Sync cross-composants via CustomEvent

4. **useState local** dans les composants

Migration future envisagée vers Zustand/Jotai (pas prioritaire).

## Hook useFavorites

```typescript
// src/hooks/useFavorites.ts (~54 lignes)
function useFavorites(): {
  favorites: string[];        // Liste des slugs
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;    // Add si absent, remove si présent
  add: (slug: string) => void;       // Idempotent
  remove: (slug: string) => void;    // Idempotent
}
```

### Points techniques
- Utilise `useSyncExternalStore` pour sync React ↔ store
- SSR-safe : retourne `[]` côté serveur (server snapshot)
- Cross-tab : un onglet qui toggle → tous les onglets se mettent à jour
- 12 tests passants (100% coverage branches/statements/functions)

### Pattern useSyncExternalStore
```typescript
const favorites = useSyncExternalStore(
  favoritesStore.subscribe,
  favoritesStore.getFavoritesSnapshot,  // client
  () => []                               // server (SSR)
);
```

Ce pattern est PRÉFÉRÉ à `useEffect + useState + addEventListener`
pour tout state partagé entre composants. Il évite les race conditions
et le tearing.

## Convention clés localStorage

| Clé | Type | Usage |
|---|---|---|
| `eps_favorites` | `string[]` (JSON) | Slugs des exercices favoris |
| `eps_theme` | `1 \| 2 \| 3` | Préférence thème |
| `eps_anatomy_anim` | `"true" \| "false"` | Toggle scan 3D |
| `eps_view_mode` | `"grid" \| "list"` | Mode d'affichage |

Toujours préfixer par `eps_`. Toujours lire avec fallback :
```typescript
const val = localStorage.getItem('eps_key') ?? defaultValue;
```

## Hydratation SSR — Piège critique

Ne JAMAIS lire localStorage pendant le rendu serveur. Pattern :
```typescript
// CORRECT
const [value, setValue] = useState(defaultValue);
useEffect(() => {
  setValue(localStorage.getItem('eps_key') ?? defaultValue);
}, []);

// INTERDIT — hydration mismatch
const value = localStorage.getItem('eps_key'); // crash SSR
```

Ou mieux, utiliser `useSyncExternalStore` avec server snapshot.

## Supabase sync (carnet Pro)

Pour les fonctionnalités Pro (carnet d'entraînement cross-device) :
- Auth anonyme Supabase → UUID navigateur
- Sync localStorage → Supabase en arrière-plan
- Liaison optionnelle email (magic link) pour cross-device
- Tables : `organizations`, `training_entries` avec RLS
- Code organisation Lycée Tazieff : `TAZIEFF2026`, `is_pro=true`

Le carnet gratuit reste en localStorage uniquement.
Le carnet Pro sync vers Supabase si le user est dans une org Pro.

## useExercisesLiveSync

```typescript
// src/hooks/useExercisesLiveSync.ts (~120 lignes)
function useExercisesLiveSync(
  locale: string,
  initialData: LiveExerciseRow[]
): {
  liveExercises: LiveExerciseRow[];
  isRealtimeReady: boolean;
}
```

Stratégie dual :
1. **Realtime** (prioritaire) : subscription Supabase channel
   - Channel : `live-exercises-${locale}`
   - Retry exponential backoff (2s, 4s, 8s... max 30s)
2. **Polling** (fallback) : toutes les 20s si realtime pas prêt
   - Pause si tab inactive (`visibilityState`)

## Tests

Les hooks ont une couverture complète :
- useFavorites : 12 tests
- useTeacherMode : 10 tests
- useExercisesLiveSync : ~12-15 tests
- Infrastructure : Vitest + jsdom + @testing-library/react
