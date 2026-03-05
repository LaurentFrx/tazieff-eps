# Index section "Apprendre" — Tazieff EPS

**Source :** Diapo Muscu'EPS de Frédérique Proisy (pages 31–32, 55–59)
**Mis à jour le :** 5 mars 2026

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

## Fichiers

| Fichier | Titre | Ordre | Niveau |
|---------|-------|-------|--------|
| muscles.fr.mdx | Les muscles et leur fonctionnement | 1 | seconde |
| rm-rir-rpe.fr.mdx | Comprendre le RM, le RIR et le RPE | 2 | seconde |
| securite.fr.mdx | Principes sécuritaires en musculation | 3 | seconde |
| contractions.fr.mdx | Les types de contractions musculaires | 4 | seconde |
| glossaire.fr.mdx | Glossaire de la musculation | 5 | seconde |
| programmes-hebdomadaires.fr.mdx | Exemples de Programmes Hebdomadaires | 6 | premiere |

## Routes Next.js

- `app/apprendre/page.tsx` — liste de tous les contenus groupés par thème
- `app/apprendre/[slug]/page.tsx` — page de contenu individuelle avec navigation prev/next
- `app/apprendre/anatomie/page.tsx` — carte anatomique 3D (route statique, ne passe pas par [slug])

## Notes

- Liens internes `/methodes/aps`, `/methodes/super-set`, etc. → pages existantes
- Tableaux MDX → style cohérent avec `ParametresTable`
- `muscles.fr.mdx` inclut un lien vers la carte anatomique 3D `/apprendre/anatomie`
- `glossaire.fr.mdx` utilise des ancres HTML (`id`) pour liens profonds (ex. `/apprendre/glossaire#rm`)
- Le slug `anatomie` est réservé par la route statique — le contenu anatomie reste sous le slug `muscles`
