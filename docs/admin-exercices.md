# Admin — Exercices (MDX)

## Emplacements
- FR : `content/exercices/fr/`
- EN : `content/exercices/en/`

## Ajouter un exercice
1) Dupliquer les templates :
   - `content/exercices/TEMPLATE.fr.mdx`
   - `content/exercices/TEMPLATE.en.mdx`
2) Choisir un **slug** (kebab-case, ex: `s2-07` ou `gainage-planche`).
3) Créer les deux fichiers :
   - `content/exercices/fr/<slug>.mdx`
   - `content/exercices/en/<slug>.mdx`
4) Remplir le frontmatter + contenu (FR et EN).

## Supprimer un exercice
- Supprimer **les deux fichiers** (FR + EN) avec le même slug.

## Règles de slug
- Kebab-case (minuscules, chiffres, tirets)
- Identique en FR et EN
- Le nom de fichier doit correspondre au champ `slug`

## Frontmatter requis
Champs minimums attendus :
- `title`
- `slug`
- `sessionId` (`s1` → `s5`)
- `sessionTitle`
- `musclesPrimary`
- `themes` (`t1`, `t2`, `t3`)
- `media.hero`
- `media.thumb`
- `source.legacy`
- `source.legacyRef`

Champs recommandés :
- `musclesSecondary`
- `equipment`
- `level`

## Images
- Placeholders actuels :
  - `/public/media/exercices/_placeholders/hero.svg`
  - `/public/media/exercices/_placeholders/thumb.svg`
- Pour remplacer : déposer les fichiers dans `/public/media/exercices/...` et mettre à jour `media.hero` / `media.thumb`.
- Vérifier qu’aucun lien ne provoque de 404.