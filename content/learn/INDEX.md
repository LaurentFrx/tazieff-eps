# Index section "Apprendre" — Tazieff EPS

**Source :** Diapo Muscu'EPS de Frédérique Proisy (pages 31–32)
**Généré le :** 23 février 2026

## Emplacement

Dossier : `/content/learn/`
Convention : `{slug}.fr.mdx`

## Schéma frontmatter

```yaml
slug: string
titre: string
section: apprendre
ordre: number   # ordre d'affichage dans la section
niveau_minimum: seconde | premiere | terminale
description: string
mots_cles: string[]
```

## Fichiers livrés — Anatomie (lot 1)

| Fichier | Titre | Ordre | Niveau |
|---------|-------|-------|--------|
| muscles.fr.mdx | Les Muscles et leur Fonctionnement | 1 | seconde |
| agonistes-antagonistes.fr.mdx | Agoniste et Antagoniste | 2 | seconde |
| types-contraction.fr.mdx | Les Types de Contraction Musculaire | 3 | seconde |

## Routes Next.js

- `app/apprendre/page.tsx` — liste de tous les contenus groupés par thème
- `app/apprendre/[slug]/page.tsx` — page de contenu individuelle

## Notes

- Liens internes `/methodes/aps`, `/methodes/super-set`, etc. → pages existantes
- Tableaux MDX → style cohérent avec `ParametresTable`
- `muscles.fr.mdx` : illustration anatomique interactive (face ant./post.) à terme
- Ajouter ces 3 pages dans la navigation de la section "Apprendre"

## Lot 2 (prochaine session)

- `rm-rir-rpe.fr.mdx`
- `principes-securitaires.fr.mdx`
- `programmes-hebdomadaires.fr.mdx`
