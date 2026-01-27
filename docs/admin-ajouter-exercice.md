# Ajouter un exercice (ex: s1-01)

Ce guide explique comment ajouter **un seul exercice** via l’interface GitHub (sans coder), en créant les deux fichiers MDX (FR + EN).

## 1) Ouvrir GitHub et créer les fichiers
1. Ouvrez le dépôt sur GitHub.
2. Cliquez sur **Add file → Create new file**.
3. Créez le fichier FR :
   - **Nom du fichier** : `content/exercices/fr/s1-01.mdx`
4. Collez le **template FR** ci-dessous (remplacez les champs).
5. Répétez pour le fichier EN :
   - **Nom du fichier** : `content/exercices/en/s1-01.mdx`
6. Collez le **template EN** ci-dessous.
7. **Commit** avec un message clair (ex: `add exercise s1-01 (fr+en)`), puis créez une PR.

## 2) Règles de nommage
- `slug` = nom de fichier sans extension (ex: `s1-01`).
- `sessionId` = `s1`, `s2`, `s3`, `s4`, `s5`.
- **Ne supprimez pas** les autres fichiers existants.

## 3) Champs importants (résumé rapide)
- `title` : titre de l’exercice.
- `tags` : 1 à 3 mots-clés (ex: `gainage`, `planche`).
- `themeCompatibility` : utilisez `[1, 2, 3]` si vous n’êtes pas sûr.
- `muscles` : liste courte (ex: `"abdos"`, `"deltoides"`).
- `equipment` : matériel nécessaire (ou laissez une liste simple).
- `media` : image existante (ex: `/images/exos/s1-001.webp`).
- `source` : référence vers la source v2 (voir `legacyRef`).

## 4) Images (plus tard)
- Les images se mettent dans `public/images/exos/`.
- Ensuite, renseignez `media` avec le chemin public (ex: `/images/exos/s1-001.webp`).

## 5) Prévisualiser localement (optionnel)
- Lancer `npm run dev` puis ouvrir `/exercices` et `/exercices/s1-01`.

---

# TEMPLATE FR (copier-coller)
```md
---
title: "Titre de l'exercice"
slug: "s1-01"
tags: ["tag-1"]
level: "intermediaire"
themeCompatibility: [1]
muscles: ["Muscle principal"]
equipment: ["Matériel"]
media: "/images/exos/s1-001.webp"
sessionId: "s1"
themes: []
musclesPrimary: ["Muscle principal"]
musclesSecondary: []
source:
  legacy: "eps-guide-app"
  legacyRef: "file:eps-guide-app/<chemin-source>#S1-01"
  legacyTitle: "TITRE V2"
---

## Objectif
À compléter

## Matériel
À compléter

## Mise en place
À compléter

## Exécution
À compléter

## Points clés
- À compléter

## Erreurs fréquentes
- À compléter

## Variantes
- À compléter

## Sécurité
- À compléter
```

# TEMPLATE EN (copy-paste)
```md
---
title: "Exercise title"
slug: "s1-01"
tags: ["tag-1"]
level: "intermediaire"
themeCompatibility: [1]
muscles: ["Primary muscle"]
equipment: ["Equipment"]
media: "/images/exos/s1-001.webp"
sessionId: "s1"
themes: []
musclesPrimary: ["Primary muscle"]
musclesSecondary: []
source:
  legacy: "eps-guide-app"
  legacyRef: "file:eps-guide-app/<source-path>#S1-01"
  legacyTitle: "V2 TITLE"
---

## Goal
To complete

## Equipment
To complete

## Setup
To complete

## Execution
To complete

## Key points
- To complete

## Common mistakes
- To complete

## Variations
- To complete

## Safety
- To complete
```