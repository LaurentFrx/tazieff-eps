# Schéma Zod — Exercices MDX (extrait de src/lib/content/schema.ts)

Ce fichier documente la structure attendue du frontmatter MDX.
Toujours vérifier le fichier source réel avant modification.

## Champs validés par Zod

```typescript
// Source de vérité : src/lib/content/schema.ts
const exerciseSchema = z.object({
  title: z.string(),                    // Requis
  slug: z.string(),                     // Requis, unique
  level: z.enum([
    "debutant",
    "intermediaire",
    "avance"
  ]).optional(),                         // Optionnel
  tags: z.array(z.string()).min(1),     // Requis, min 1
  themeCompatibility: z.array(
    z.union([z.literal(1), z.literal(2), z.literal(3)])
  ).min(1),                             // Requis, min 1
  muscles: z.array(z.string()).min(1),  // Requis, min 1
  equipment: z.array(z.string())
    .optional(),                         // Optionnel
  media: z.string().optional(),          // Optionnel
});
```

## Thèmes (themeCompatibility)

- 1 = Endurance musculaire
- 2 = Volume / Hypertrophie
- 3 = Puissance / Force maximale

## Fichier source (loader)

Le loader MDX est dans `src/lib/content/fs.ts` (server-only, React cache).
Architecture 3 sources en cascade :
1. MDX natifs (`/content/exercices/*.mdx`) — priorité maximale
2. Supabase live (exercices créés par enseignant)
3. Import v2 (legacy)

## Notes importantes

- Le schéma peut évoluer — TOUJOURS auditer le fichier réel avant
  d'ajouter un champ qui n'est pas dans cette référence
- Les champs `description`, `consignes_securite`, `methodes_compatibles`
  ne sont PAS dans le schéma actuel
- Les filtres frontend sont dans `src/lib/exercices/filters.ts`
