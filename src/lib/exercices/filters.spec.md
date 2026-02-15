# filters.ts — Spécification

## Objectif

Fonctions pures extraites de `ExerciseListClient.tsx` pour permettre le test unitaire et la réutilisation.

## Fonctions exportées

### `mergeExercises(exercises, liveExercises) → ExerciseListItem[]`

Fusionne les exercices MDX (statiques) avec les lignes Supabase (live).

- Les items MDX (`isLive: false`) sont prioritaires sur les live de même slug.
- Les items `isLive: true` présents dans la liste MDX sont ignorés (remplacés par le live).
- Le tri place les exercices `ready` avant les `draft`, puis alphabétique (locale `fr`).
- Retourne la référence d'origine si `liveExercises` est vide (optimisation).

### `filterVisibleExercises(exercises, teacherUnlocked) → ExerciseListItem[]`

Filtre de visibilité lié au mode enseignant.

- Si `teacherUnlocked === true` : retourne tous les exercices.
- Sinon : exclut les exercices dont `status === "draft"`.

### `filterExercises(exercises, criteria) → ExerciseListItem[]`

Applique les filtres utilisateur (barre de recherche, niveaux, matériel, tags, thèmes, favoris).

| Critère | Type | Logique |
|---|---|---|
| `query` | `string` | Recherche insensible à la casse dans `title`, `tags`, `muscles` |
| `levels` | `Difficulty[]` | Inclusion (OR) ; ignore si vide |
| `equipment` | `string[]` | OR entre items ; `"sans-materiel"` matche les exercices sans équipement |
| `tags` | `string[]` | OR |
| `themes` | `(1\|2\|3)[]` | OR sur `themeCompatibility` |
| `onlyFavorites` | `boolean` | Si `true`, ne garde que les slugs dans `favorites` |

## Types exportés

- `ExerciseListItem` — `LiveExerciseListItem & { status?: ExerciseStatus }`
- `ExerciseStatus` — `"draft" | "ready"`
- `FilterCriteria` — objet des critères de filtre
- `NO_EQUIPMENT_ID` — constante `"sans-materiel"`

## Couverture de tests

42 tests répartis en 3 blocs : `mergeExercises` (10), `filterVisibleExercises` (5), `filterExercises` (27).
