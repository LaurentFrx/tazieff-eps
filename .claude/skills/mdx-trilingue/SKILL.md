---
name: mdx-trilingue
description: >
  Crée et modifie des fichiers MDX d'exercices, méthodes ou contenu
  pédagogique pour Tazieff EPS en 3 langues (FR/EN/ES). Utiliser cette
  skill dès qu'on mentionne MDX, exercice, méthode, fiche, contenu
  trilingue, i18n fitness, catalogue, slug, frontmatter, ou ajout de
  contenu pédagogique. Aussi pour corriger des fiches existantes,
  enrichir le frontmatter, ou créer du contenu pour les sessions S1-S7.
  Même si la demande ne mentionne pas explicitement "MDX", utiliser
  cette skill pour toute création de contenu structuré dans l'app.
---

# Création de contenu MDX trilingue — Tazieff EPS

## Principe fondamental

Le contenu pédagogique de Fred (diaporama Keynote 65 pages) est la
source de vérité. Ne JAMAIS inventer de contenu depuis la mémoire
générale. Si le contenu source n'est pas fourni dans le prompt,
DEMANDER avant de créer.

## Phase 0 obligatoire — Audit avant création

Avant de créer un nouveau fichier MDX :
1. Lire le schéma Zod dans `references/schema-zod-extract.md`
2. Lire un fichier MDX existant du même type comme modèle
3. Vérifier qu'un slug identique ou similaire n'existe pas déjà
4. Confirmer la structure attendue avant d'écrire

## Structure des fichiers

### Exercices
```
content/exercices/{slug}.fr.mdx
content/exercices/{slug}.en.mdx
content/exercices/{slug}.es.mdx
```

### Méthodes
```
content/methodes/{slug}.fr.mdx
content/methodes/{slug}.en.mdx
content/methodes/{slug}.es.mdx
```

### Pages Apprendre
```
content/learn/{slug}.fr.mdx
content/learn/{slug}.en.mdx
content/learn/{slug}.es.mdx
```

## Convention de slugs

- Sessions : `s1-01`, `s2-15`, `s7-03` (session-numéro)
- Méthodes : `drop-set`, `super-set`, `pyramide`
- Exercice spécial : suffixe descriptif `s5-02-burpees`
- Toujours kebab-case, jamais de majuscules

## Frontmatter exercice — Champs requis

```yaml
---
title: "Titre en français"        # string, requis
slug: "s1-01"                     # string, requis, unique
level: "intermediaire"            # "debutant" | "intermediaire" | "avance", optionnel
tags:                             # string[], min 1 item
  - "gainage"
themeCompatibility:               # (1|2|3)[], min 1 item
  - 1
  - 2
muscles:                          # string[], min 1 item
  - "Deltoides"
  - "Grand droit"
equipment:                        # string[], optionnel
  - "Tapis de sol"
media: "s1-01"                    # string, optionnel (sans extension)
---
```

Champs ABSENTS du schéma actuel (ne pas ajouter sans demande) :
description, consignes_securite, methodes_compatibles

## Groupes musculaires normalisés (8 groupes du filtre)

Pectoraux, Dorsaux (dos), Épaules (deltoïdes), Bras (biceps/triceps),
Abdominaux, Quadriceps, Ischio-jambiers, Mollets/Fessiers

Dans le frontmatter, utiliser les noms anatomiques précis :
"Deltoides", "Grand droit", "Transverse", "Pectoraux", "Grand dorsal",
"Biceps brachial", "Triceps brachial", "Quadriceps", "Ischio-jambiers",
"Triceps sural", "Grand fessier"

## Équipement normalisé (14 catégories)

Tapis de sol, Haltères, Barre, Banc, Poulie, Machine guidée,
Swiss ball, Élastique, Kettlebell, Barre de traction, TRX,
Poids de corps, Step, Médecine ball

## Traductions — Règles critiques

### Anglais (EN)
- Vocabulaire fitness standard international
- "dumbbell" pas "hand weight"
- "bench press" pas "chest press on bench"

### Espagnol (ES) — Dictionnaire fitness obligatoire
Voir `references/dictionnaire-fitness-es.md` pour la liste complète.

Règles absolues :
- "entrenamiento" JAMAIS "formación" pour training
- "press de banca" JAMAIS "banco de prensa" pour bench press
- "sentadilla" JAMAIS "cuclillas" pour squat
- "dominadas" JAMAIS "pull-ups" (garder le terme ES)
- "mancuernas" pour dumbbells
- "barra" pour barbell
- "polea" pour cable/pulley
- "esterilla" pour tapis de sol

## Médias — Conventions de nommage

Tous dans `/public/images/exos/` :
- Image principale : `{slug}.webp`
- Vidéo : `{slug}.webm` (fallback `{slug}.mp4`)
- Thumbnail grille : `thumb-{slug}.webp`
- Thumbnail liste 16:9 : `thumb169-{slug}.webp`
- Thumbnail portrait 9:16 : `thumb916-{slug}.webp`

Ne JAMAIS créer ou choisir les médias — seulement référencer le slug
dans le champ `media` du frontmatter.

## Body MDX

Le body des fichiers MDX est actuellement vide pour tous les exercices
(0/73 fiches ont du contenu body). Si on demande d'ajouter du body :
- Consignes d'exécution (placement, mouvement, respiration)
- Erreurs courantes à éviter
- Variantes et progressions
- Composants React utilisables : à vérifier dans le code existant

## Validation post-création

Après création des fichiers :
1. `npm run build` — doit compiler sans erreur
2. `npm test` — pas de régression
3. Vérifier que les 3 fichiers (fr/en/es) existent et sont cohérents
4. Vérifier que le slug est unique dans le répertoire
