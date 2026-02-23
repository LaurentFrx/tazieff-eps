# Index section "BAC" — Tazieff EPS

**Source :** Diapo Muscu'EPS de Frédérique Proisy (pages 60–63)
**Généré le :** 23 février 2026

## Emplacement

Dossier : `/content/bac/`
Convention : `{slug}.fr.mdx`

## Schéma frontmatter

```yaml
slug: string
titre: string
section: bac
ordre: number
niveau_minimum: seconde | premiere | terminale
description: string
mots_cles: string[]
```

## Fichiers livrés — Parcours BAC (lot 3)

| Fichier | Titre | Ordre | Niveau |
|---------|-------|-------|--------|
| demarche-spiralaire.fr.mdx | La Démarche Spiralaire | 1 | seconde |
| evaluation-seconde.fr.mdx | Évaluation en Seconde | 2 | seconde |
| evaluation-premiere.fr.mdx | Évaluation en Première | 3 | premiere |
| evaluation-terminale.fr.mdx | Évaluation en Terminale | 4 | terminale |

## Routes Next.js

- `app/bac/page.tsx` — Vue d'ensemble parcours
- `app/bac/[slug]/page.tsx` — Page dynamique individuelle

## Notes

- Liens internes `/methodes/*`, `/apprendre/*`, `/bac/*` — tous existants
- Page `/bac` : progression spiralaire + 4 compétences + liens niveaux
- Checkboxes MDX : rendu simple en listes
- TabNav onglet BAC déjà présent

## Lot 4 (si besoin)

- `epreuve-bac.fr.mdx` — grilles officielles, barèmes (pages 64–65 du PDF)
