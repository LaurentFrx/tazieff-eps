# Audit des fiches exercices MDX — tazieff-eps

**Date** : 2026-03-10
**Branch** : main
**Commit** : 9976a15

---

## ÉTAPE 1 — Inventaire complet des MDX

**Total fichiers** : 73 slugs uniques × 3 langues (FR/EN/ES) = 219 fichiers MDX
**Répertoire** : `content/exercices/`
**Schéma Zod** : `src/lib/content/schema.ts`
**Loader** : `src/lib/content/fs.ts` (server-only, React cache)

### Champs du schéma Zod

| Champ | Type | Requis |
|-------|------|--------|
| title | string | ✅ |
| slug | string | ✅ |
| level | "debutant" \| "intermediaire" \| "avance" | ❌ |
| tags | string[] (min 1) | ✅ |
| themeCompatibility | (1\|2\|3)[] (min 1) | ✅ |
| muscles | string[] (min 1) | ✅ |
| equipment | string[] | ❌ |
| media | string | ❌ |

**Champs ABSENTS du schéma** : description, consignes_securite, methodes_compatibles (non définis dans schema.ts)

### Liste complète des exercices

| # | Slug | Titre FR | Level | Muscles | Equipment | Tags | Image | Thumb | Body |
|---|------|----------|-------|---------|-----------|------|-------|-------|------|
| 1 | s1-001 | Planche frontale sur coudes | debutant | abdos, transverse, épaules | tapis | gainage, stabilité, fondamentaux | ✅ | ❌ | ❌ |
| 2 | s1-01 | Planche frontale sur coudes | intermediaire | Deltoides, grand droit, transverse, grand fessier | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 3 | s1-02 | Planche frontale sur mains | intermediaire | Deltoides, pectoraux, grand droit, denteles | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 4 | s1-03 | Planche laterale coude droit | intermediaire | Obliques droits, carre des lombes, deltoides | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 5 | s1-04 | Planche laterale coude gauche | intermediaire | Obliques gauches, carre des lombes, deltoides | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 6 | s1-05 | Planche haute pieds sur swiss ball | intermediaire | Grand droit, transverse, obliques, deltoides | Tapis, Swiss ball 65cm | gainage | ✅ | ✅ | ❌ |
| 7 | s1-06 | Hollow body hold | intermediaire | Grand droit, transverse, psoas-iliaque, denteles | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 8 | s1-07 | Superman / extension dorsale | intermediaire | Erecteurs du rachis, grand fessier, ischio-jambiers | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 9 | s1-08 | L-sit au sol | intermediaire | Grand droit, psoas-iliaque, triceps, deltoides | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 10 | s1-09 | L-sit aux barres paralleles | intermediaire | Grand droit, transverse, psoas, triceps, deltoides | Barres paralleles | gainage | ✅ | ✅ | ❌ |
| 11 | s1-10 | Dead bug | intermediaire | Transverse, grand droit, obliques, stabilisateurs | Tapis de sol | gainage | ✅ | ✅ | ❌ |
| 12 | s2-01 | Mountain climbers | intermediaire | Grand droit, obliques, psoas, deltoides, cardio | Tapis de sol | dynamique, cardio | ✅ | ✅ | ❌ |
| 13 | s2-02 | Mountain climbers avec medecine-ball | intermediaire | Grand droit, obliques, deltoides, stabilisateurs | Medecine-ball 4-6kg, tapis | dynamique, cardio | ✅ | ✅ | ❌ |
| 14 | s2-03 | Planche avec shoulder taps | intermediaire | Obliques, transverse, grand droit, deltoides | Tapis de sol | dynamique, gainage | ✅ | ✅ | ❌ |
| 15 | s2-04 | Bird dog | intermediaire | Erecteurs du rachis, fessiers, dorsaux, deltoides | Tapis de sol | dynamique | ✅ | ✅ | ❌ |
| 16 | s2-05 | Bear crawl | intermediaire | Grand droit, transverse, deltoides, quadriceps | Sol libre | dynamique | ✅ | ✅ | ❌ |
| 17 | s2-06 | Crunch classique | intermediaire | Grand droit (portion superieure) | Tapis de sol | dynamique, abdominaux | ✅ | ✅ | ❌ |
| 18 | s2-07 | Crunch croise | intermediaire | Obliques, grand droit | Tapis de sol | dynamique, abdominaux | ✅ | ✅ | ❌ |
| 19 | s2-08 | Bicycle crunch | intermediaire | Obliques, grand droit, psoas-iliaque | Tapis de sol | dynamique, abdominaux | ✅ | ✅ | ❌ |
| 20 | s2-09 | Releve de jambes au sol | intermediaire | Grand droit, psoas-iliaque, TFL | Tapis de sol | dynamique | ✅ | ✅ | ❌ |
| 21 | s2-10 | Releve de jambes suspendu barre fixe | intermediaire | Grand droit, psoas, grand dorsal, avant-bras | Barre de traction | dynamique | ✅ | ✅ | ❌ |
| 22 | s2-11 | V-ups / v-sit | intermediaire | Grand droit complet, psoas-iliaque | Tapis de sol | dynamique | ✅ | ✅ | ❌ |
| 23 | s2-12 | Russian twists avec medecine-ball | intermediaire | Obliques, grand droit, rotation | Medecine-ball 3-5kg | dynamique | ✅ | ✅ | ❌ |
| 24 | s2-13 | Pallof press avec elastique | intermediaire | Obliques, transverse, grand droit, anti-rotation | Elastique de resistance | dynamique | ✅ | ✅ | ❌ |
| 25 | s2-14 | Ab wheel rollout | intermediaire | Grand droit, transverse, grand dorsal, denteles | Roulette abdominale | dynamique | ✅ | ✅ | ❌ |
| 26 | s2-15 | Planche laterale avec rotation | intermediaire | Obliques, denteles, deltoides | Tapis de sol | dynamique, gainage | ✅ | ✅ | ❌ |
| 27 | s3-01 | Pompes classiques | intermediaire | Pectoraux, triceps, deltoides anterieurs | Tapis de sol | renforcement, haut du corps | ✅ | ✅ | ❌ |
| 28 | s3-02 | Pompes diamant | intermediaire | Triceps, pectoraux internes, deltoides | Tapis de sol | renforcement, haut du corps | ✅ | ✅ | ❌ |
| 29 | s3-03 | Pompes declinees (pieds sureleves) | intermediaire | Deltoides anterieurs, pectoraux superieurs, triceps | Tapis, banc 40-60cm | renforcement, haut du corps | ✅ | ✅ | ❌ |
| 30 | s3-04 | Pompes inclinees (mains surelevees) | intermediaire | Pectoraux inferieurs, triceps, deltoides | Banc 40-60cm | renforcement, haut du corps | ✅ | ✅ | ❌ |
| 31 | s3-05 | Pompes avec rotation | intermediaire | Pectoraux, deltoides, obliques, denteles | Tapis de sol | renforcement, haut du corps | ✅ | ✅ | ❌ |
| 32 | s3-06 | Dips aux barres paralleles | intermediaire | Triceps, pectoraux inferieurs, deltoides | Barres paralleles | renforcement, haut du corps | ✅ | ✅ | ❌ |
| 33 | s3-07 | Tractions pronation | intermediaire | Grand dorsal, biceps, grand rond, trapezes | Barre de traction | renforcement | ✅ | ✅ | ❌ |
| 34 | s3-08 | Tractions supination | intermediaire | Biceps, grand dorsal, grand rond, brachial | Barre de traction | renforcement | ✅ | ✅ | ❌ |
| 35 | s3-09 | Tractions prise neutre | intermediaire | Biceps, brachial, grand dorsal, grand rond | Aucun | renforcement | ✅ | ✅ | ❌ |
| 36 | s3-10 | Developpe halteres couche sur banc | intermediaire | Pectoraux, deltoides anterieurs, triceps | Banc plat, halteres 6-12kg | renforcement | ✅ | ✅ | ❌ |
| 37 | s3-11 | Developpe halteres incline | intermediaire | Pectoraux superieurs, deltoides | Banc inclinable, halteres 6-10kg | renforcement | ✅ | ✅ | ❌ |
| 38 | s3-12 | Rowing haltere un bras | intermediaire | Grand dorsal, trapezes, rhomboides, biceps | Banc, haltere 8-15kg | renforcement, dos | ✅ | ✅ | ❌ |
| 39 | s3-13 | Rowing halteres penche | intermediaire | Grand dorsal, trapezes, rhomboides, erecteurs | Halteres 8-12kg | renforcement, dos | ✅ | ✅ | ❌ |
| 40 | s3-14 | Elevations laterales halteres | intermediaire | Deltoides moyens | Halteres 4-8kg | renforcement, epaules | ✅ | ✅ | ❌ |
| 41 | s3-15 | Elevations frontales halteres | intermediaire | Deltoides anterieurs, pectoraux claviculaires | Halteres 4-8kg | renforcement, epaules | ✅ | ✅ | ❌ |
| 42 | s3-16 | Curl biceps halteres debout | intermediaire | Biceps brachial, brachial | Halteres 6-12kg | renforcement, bras | ✅ | ✅ | ❌ |
| 43 | s3-17 | Curl biceps marteau | intermediaire | Biceps, brachial, brachio-radial | Halteres 8-12kg | renforcement, bras | ✅ | ✅ | ❌ |
| 44 | s3-18 | Extension triceps overhead haltere | intermediaire | Triceps brachial (chef long) | Haltere 6-10kg | renforcement | ✅ | ✅ | ❌ |
| 45 | s3-19 | Kickback triceps haltere | intermediaire | Triceps brachial | Haltere 4-8kg, banc | renforcement | ✅ | ✅ | ❌ |
| 46 | s3-20 | Face pulls elastique | intermediaire | Trapezes, deltoides posterieurs, rhomboides | Elastique de resistance | renforcement | ✅ | ✅ | ❌ |
| 47 | s4-01 | Squat classique au poids du corps | intermediaire | Quadriceps, grand fessier, erecteurs, adducteurs | Aucun | mobilite, jambes | ✅ | ✅ | ❌ |
| 48 | s4-02 | Goblet squat avec kettlebell | intermediaire | Quadriceps, grand fessier, adducteurs, abdos | Kettlebell 8-16kg | mobilite, jambes | ✅ | ✅ | ❌ |
| 49 | s4-03 | Squat bulgare (split squat arriere) | intermediaire | Quadriceps, grand fessier, equilibre | Banc 40-60cm, option halteres | mobilite, jambes | ✅ | ✅ | ❌ |
| 50 | s4-04 | Fentes avant marchees | intermediaire | Quadriceps, grand fessier, ischio-jambiers | Aucun ou halteres legers | mobilite, jambes | ✅ | ✅ | ❌ |
| 51 | s4-05 | Fentes arriere | intermediaire | Quadriceps, grand fessier, ischio-jambiers | Aucun ou halteres | mobilite, jambes | ✅ | ✅ | ❌ |
| 52 | s4-06 | Fentes laterales | intermediaire | Adducteurs, quadriceps, grand fessier, abducteurs | Aucun ou halteres legers | mobilite, jambes | ✅ | ✅ | ❌ |
| 53 | s4-07 | Souleve de terre roumain halteres | intermediaire | Ischio-jambiers, grand fessier, erecteurs | Halteres 10-15kg | mobilite | ✅ | ✅ | ❌ |
| 54 | s4-08 | Hip thrust au sol | intermediaire | Grand fessier, ischio-jambiers, erecteurs | Tapis de sol | mobilite, fessiers | ✅ | ✅ | ❌ |
| 55 | s4-09 | Hip thrust sur banc avec charge | intermediaire | Grand fessier, ischio-jambiers | Banc, medecine-ball/haltere 8-15kg | mobilite, fessiers | ✅ | ✅ | ❌ |
| 56 | s4-10 | Glute bridge | intermediaire | Grand fessier, erecteurs du rachis | Tapis de sol | mobilite | ✅ | ✅ | ❌ |
| 57 | s4-11 | Step-ups sur caisson | intermediaire | Quadriceps, grand fessier, equilibre | Plinth 40-60cm | mobilite | ✅ | ✅ | ❌ |
| 58 | s4-12 | Pistol squat | intermediaire | Quadriceps, grand fessier, equilibre, mobilite cheville | Aucun (option TRX) | mobilite, jambes | ✅ | ✅ | ❌ |
| 59 | s4-13 | Nordic curls a l'espalier | intermediaire | Ischio-jambiers, grand fessier, erecteurs | Espalier, tapis | mobilite, bras | ✅ | ✅ | ❌ |
| 60 | s4-14 | Mollets debout | intermediaire | Gastrocnemiens, soleaires | Step ou rebord, option halteres | mobilite, jambes | ✅ | ✅ | ❌ |
| 61 | s4-15 | Jump squats | intermediaire | ⚠️ CORROMPU (données concaténées) | ⚠️ CORROMPU | mobilite, jambes | ✅ | ✅ | ❌ |
| 62 | s5-01 | ⚠️ "Burpees complets (full burpees) 76 burpees sans pompe (debutant)" | intermediaire | "Contenu a completer" | Aucun | etirement, haut du corps, cardio | ✅ | ✅ | ❌ |
| 63 | s5-02 | ⚠️ "Burpees complets (full burpees) 76 burpees sans pompe (debutant)" | intermediaire | "Contenu a completer" | Aucun | etirement, haut du corps, cardio | ✅ | ✅ | ❌ |
| 64 | s5-02-burpees | Burpees | intermediaire | jambes, gainage, épaules | (absent) | cardio, plyo, full-body | ❌ | ❌ | ❌ |
| 65 | s5-03 | ⚠️ "Burpees sur step (box jump" | intermediaire | "Contenu a completer" | Aucun | etirement, cardio | ✅ | ✅ | ❌ |
| 66 | s5-04 | ⚠️ "Burpees) thrusters halteres (dumbbell" | intermediaire | "Contenu a completer" | Aucun | etirement, cardio | ✅ | ✅ | ❌ |
| 67 | s5-05 | ⚠️ "Kettlebell swing (balancement" | intermediaire | "Contenu a completer" | Aucun | etirement | ✅ | ✅ | ❌ |
| 68 | s5-06 | ⚠️ "Kettlebell) turkish get-up (releve turc)" | intermediaire | "Contenu a completer" | Aucun | etirement | ✅ | ✅ | ❌ |
| 69 | s5-07 | Souleve de terre roumain halteres | intermediaire | "Contenu a completer" | Aucun | etirement | ✅ | ✅ | ❌ |
| 70 | s5-08 | ⚠️ "(romanian deadlift) wall balls (lancers muraux)" | intermediaire | "Contenu a completer" | Aucun | etirement, dos | ✅ | ✅ | ❌ |
| 71 | s5-09 | ⚠️ "Farmers walk (marche du" | intermediaire | "Contenu a completer" | Aucun | etirement | ✅ | ✅ | ❌ |
| 72 | s5-10 | ⚠️ "Fermier) box jumps (sauts sur caisson)" | intermediaire | "Contenu a completer" | Aucun | etirement | ✅ | ✅ | ❌ |
| 73 | squat-goblet | Squat goblet | intermediaire | quadriceps, fessiers, gainage | haltère | force, bas-du-corps, fondamentaux | ❌ | ❌ | ❌ |

---

## ÉTAPE 2 — Supabase

**Fichiers Supabase** :
- `src/lib/supabase/client.ts` — Client Supabase browser
- `src/lib/supabase/server.ts` — Client Supabase server
- `src/lib/live/queries.ts` — Requêtes live (données complémentaires)

Supabase fournit des données live complémentaires mais les exercices eux-mêmes viennent exclusivement des MDX. Pas d'exercice Supabase-only.

---

## ÉTAPE 3 — Croisement avec la V2

### S1 — Gainage statique (10 exercices v2)

| V2 | Titre V2 | MDX | Critère | Notes |
|----|----------|-----|---------|-------|
| S1-01 | Planche frontale sur coudes (Débutant) | ✅ s1-01 | slug exact | Niveau: intermediaire (v2: Débutant). Doublon avec s1-001 (debutant) |
| S1-02 | Planche frontale sur mains (Débutant) | ✅ s1-02 | slug exact | Niveau: intermediaire (v2: Débutant) |
| S1-03 | Planche latérale sur coude droit (Intermédiaire) | ✅ s1-03 | slug exact | Titre simplifié "coude droit" vs "sur coude droit" |
| S1-04 | Planche latérale sur coude gauche (Intermédiaire) | ✅ s1-04 | slug exact | OK |
| S1-05 | Planche haute pieds sur Swiss Ball (Intermédiaire) | ✅ s1-05 | slug exact | OK |
| S1-06 | Hollow Body Hold (Intermédiaire) | ✅ s1-06 | slug exact | OK |
| S1-07 | Superman / Extension dorsale (Intermédiaire) | ✅ s1-07 | slug exact | OK |
| S1-08 | L-Sit au sol (Avancé) | ✅ s1-08 | slug exact | Niveau: intermediaire (v2: Avancé) |
| S1-09 | L-Sit aux barres parallèles (Avancé) | ✅ s1-09 | slug exact | Niveau: intermediaire (v2: Avancé) |
| S1-10 | Dead Bug (Débutant) | ✅ s1-10 | slug exact | Niveau: intermediaire (v2: Débutant) |

**Bilan S1** : 10/10 trouvés ✅

### S2 — Gainage dynamique & abdominaux (15 exercices v2)

| V2 | Titre V2 | MDX | Critère | Notes |
|----|----------|-----|---------|-------|
| S2-01 | Mountain Climbers (Débutant) | ✅ s2-01 | slug exact | Niveau: intermediaire (v2: Débutant) |
| S2-02 | Mountain Climbers avec médecine-ball (Intermédiaire) | ✅ s2-02 | slug exact | OK |
| S2-03 | Planche avec shoulder taps (Intermédiaire) | ✅ s2-03 | slug exact | OK |
| S2-04 | Bird-Dog / gainage quadrupédie (Débutant) | ✅ s2-04 | slug exact | Titre simplifié "Bird dog" |
| S2-05 | Bear Crawl (Intermédiaire) | ✅ s2-05 | slug exact | OK |
| S2-06 | Crunch classique (Intermédiaire) | ✅ s2-06 | slug exact | OK |
| S2-07 | Crunch croisé (Intermédiaire) | ✅ s2-07 | slug exact | OK |
| S2-08 | Bicycle Crunch (Intermédiaire) | ✅ s2-08 | slug exact | OK |
| S2-09 | Relevé de jambes au sol (Intermédiaire) | ✅ s2-09 | slug exact | OK |
| S2-10 | Relevé de jambes suspendu barre fixe (Intermédiaire) | ✅ s2-10 | slug exact | OK |
| S2-11 | V-Ups / V-Sit (Intermédiaire) | ✅ s2-11 | slug exact | OK |
| S2-12 | Russian Twists avec médecine-ball (Intermédiaire) | ✅ s2-12 | slug exact | OK |
| S2-13 | Pallof Press avec élastique (Intermédiaire) | ✅ s2-13 | slug exact | OK |
| S2-14 | Ab Wheel Rollout (Intermédiaire) | ✅ s2-14 | slug exact | OK |
| S2-15 | Planche latérale avec rotation (Intermédiaire) | ✅ s2-15 | slug exact | OK |

**Bilan S2** : 15/15 trouvés ✅

### S3 — Haut du corps (20 exercices v2)

| V2 | Titre V2 | MDX | Critère | Notes |
|----|----------|-----|---------|-------|
| S3-01 | Pompes classiques (Intermédiaire) | ✅ s3-01 | slug exact | OK |
| S3-02 | Pompes diamant (Intermédiaire) | ✅ s3-02 | slug exact | OK |
| S3-03 | Pompes déclinées / pieds surélevés (Intermédiaire) | ✅ s3-03 | slug exact | OK |
| S3-04 | Pompes inclinées / mains surélevées (Intermédiaire) | ✅ s3-04 | slug exact | OK |
| S3-05 | Pompes avec rotation (Intermédiaire) | ✅ s3-05 | slug exact | OK |
| S3-06 | Dips aux barres parallèles (Intermédiaire) | ✅ s3-06 | slug exact | OK |
| S3-07 | Tractions pronation (Intermédiaire) | ✅ s3-07 | slug exact | OK |
| S3-08 | Tractions supination (Intermédiaire) | ✅ s3-08 | slug exact | OK |
| S3-09 | Tractions prise neutre (Intermédiaire) | ✅ s3-09 | slug exact | OK |
| S3-10 | Développé haltères couché sur banc (Intermédiaire) | ✅ s3-10 | slug exact | OK |
| S3-11 | Développé haltères incliné (Intermédiaire) | ✅ s3-11 | slug exact | OK |
| S3-12 | Rowing haltère un bras (Intermédiaire) | ✅ s3-12 | slug exact | OK |
| S3-13 | Rowing haltères penché (Intermédiaire) | ✅ s3-13 | slug exact | OK |
| S3-14 | Élévations latérales haltères (Intermédiaire) | ✅ s3-14 | slug exact | OK |
| S3-15 | Élévations frontales haltères (Intermédiaire) | ✅ s3-15 | slug exact | OK |
| S3-16 | Curl biceps haltères debout (Intermédiaire) | ✅ s3-16 | slug exact | OK |
| S3-17 | Curl biceps marteau (Intermédiaire) | ✅ s3-17 | slug exact | OK |
| S3-18 | Extension triceps overhead haltère (Intermédiaire) | ✅ s3-18 | slug exact | OK |
| S3-19 | Kickback triceps haltère (Intermédiaire) | ✅ s3-19 | slug exact | OK |
| S3-20 | Face pulls à l'élastique (Intermédiaire) | ✅ s3-20 | slug exact | OK |

**Bilan S3** : 20/20 trouvés ✅

### S4 — Bas du corps (15 exercices v2)

| V2 | Titre V2 | MDX | Critère | Notes |
|----|----------|-----|---------|-------|
| S4-01 | Squat classique au poids du corps (Intermédiaire) | ✅ s4-01 | slug exact | OK |
| S4-02 | Goblet Squat avec kettlebell (Intermédiaire) | ✅ s4-02 | slug exact | OK |
| S4-03 | Squat bulgare / split squat arrière (Intermédiaire) | ✅ s4-03 | slug exact | OK |
| S4-04 | Fentes avant marchées (Intermédiaire) | ✅ s4-04 | slug exact | OK |
| S4-05 | Fentes arrière (Intermédiaire) | ✅ s4-05 | slug exact | OK |
| S4-06 | Fentes latérales (Intermédiaire) | ✅ s4-06 | slug exact | OK |
| S4-07 | Soulevé de terre roumain aux haltères / RDL (Intermédiaire) | ✅ s4-07 | slug exact | OK |
| S4-08 | Hip Thrust au sol (Intermédiaire) | ✅ s4-08 | slug exact | OK |
| S4-09 | Hip Thrust sur banc avec charge (Intermédiaire) | ✅ s4-09 | slug exact | OK |
| S4-10 | Glute Bridge (Intermédiaire) | ✅ s4-10 | slug exact | OK |
| S4-11 | Step-Ups sur caisson (Intermédiaire) | ✅ s4-11 | slug exact | OK |
| S4-12 | Pistol Squat (Intermédiaire) | ✅ s4-12 | slug exact | OK |
| S4-13 | Nordic Curls à l'espalier (Intermédiaire) | ✅ s4-13 | slug exact | OK |
| S4-14 | Mollets debout (Intermédiaire) | ✅ s4-14 | slug exact | OK |
| S4-15 | Jump Squats (Intermédiaire) | ⚠️ s4-15 | slug exact | **CORROMPU** — frontmatter contient les données concaténées de S5-01 à S5-10 |

**Bilan S4** : 15/15 trouvés (1 corrompu) ⚠️

### S5 — Exercices fonctionnels & composés (10 exercices v2)

| V2 | Titre V2 | MDX | Critère | Notes |
|----|----------|-----|---------|-------|
| S5-01 | Burpees complets (Avancé) | ⚠️ s5-01 | slug exact | **TITRE CORROMPU** : "Burpees complets (full burpees) 76 burpees sans pompe (debutant)". Muscles: "Contenu a completer" |
| S5-02 | Burpees sans pompe (Intermédiaire) | ⚠️ s5-02 | slug exact | **TITRE CORROMPU** : identique à s5-01. Doublon avec s5-02-burpees |
| S5-03 | Demi-burpees (Intermédiaire) | ⚠️ s5-03 | slug exact | **TITRE CORROMPU** : "Burpees sur step (box jump". PAS le bon exercice |
| S5-04 | Thrusters / squat + développé (Intermédiaire) | ⚠️ s5-04 | slug exact | **TITRE CORROMPU** : "Burpees) thrusters halteres (dumbbell" |
| S5-05 | Kettlebell swing (Intermédiaire) | ⚠️ s5-05 | slug exact | **TITRE TRONQUÉ** : "Kettlebell swing (balancement" |
| S5-06 | Turkish get-up / relevé turc (Avancé) | ⚠️ s5-06 | slug exact | **TITRE CORROMPU** : "Kettlebell) turkish get-up (releve turc)" |
| S5-07 | Soulevé de terre roumain / RDL (Intermédiaire) | ✅ s5-07 | slug exact | Titre OK. Muscles: "Contenu a completer" |
| S5-08 | Wall balls (Intermédiaire) | ⚠️ s5-08 | slug exact | **TITRE CORROMPU** : "(romanian deadlift) wall balls (lancers muraux)" |
| S5-09 | Farmer's walk (Intermédiaire) | ⚠️ s5-09 | slug exact | **TITRE TRONQUÉ** : "Farmers walk (marche du" |
| S5-10 | Box jumps (Intermédiaire) | ⚠️ s5-10 | slug exact | **TITRE CORROMPU** : "Fermier) box jumps (sauts sur caisson)" |

**Bilan S5** : 10/10 trouvés par slug, mais **9/10 CORROMPUS** (titres mélangés, données incomplètes)

---

## ÉTAPE 4 — Champs manquants par fiche

### Légende
- ✅ = renseigné avec des données valides
- ⚠️ = renseigné mais données corrompues/placeholder
- ❌ = absent ou vide

| Slug | title | muscles | equipment | level | tags | media | thumb | body | description | consignes | methodes |
|------|-------|---------|-----------|-------|------|-------|-------|------|-------------|-----------|----------|
| **S1 (s1-01 à s1-10)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| s1-001 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **S2 (s2-01 à s2-15)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S3 (s3-01 à s3-20)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S4 (s4-01 à s4-14)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| s4-15 | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S5 (s5-01 à s5-10)** | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| s5-02-burpees | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| squat-goblet | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Note** : `description`, `consignes_securite`, `methodes_compatibles` ne sont PAS dans le schéma Zod actuel. Aucune fiche ne les contient.

---

## ÉTAPE 5 — Synthèse

### Totaux

| Métrique | Valeur |
|----------|--------|
| Total MDX (slugs uniques) | **73** |
| Total fichiers (×3 langues) | **219** |
| Exercices V2 retrouvés | **70/70** (tous par slug exact) |
| V2 avec titre correct | **59/70** |
| V2 avec titre corrompu | **11/70** (s4-15 + toute la S5) |
| MDX hors V2 (ajouts) | **3** (s1-001, s5-02-burpees, squat-goblet) |

### État des fiches

| État | Nombre | Détails |
|------|--------|---------|
| Frontmatter complet (titre + muscles + equipment + level + tags + media + thumb) | **60** | S1(10) + S2(15) + S3(20) + S4(14) + s1-001(sans thumb) |
| Frontmatter OK mais incomplet (pas de thumb ou media) | **2** | s5-02-burpees, squat-goblet |
| Frontmatter corrompu | **11** | s4-15 (données concaténées) + s5-01→s5-10 (titres mélangés, muscles="Contenu a completer") |
| Fiches avec body MDX | **0/73** | AUCUNE fiche n'a de contenu dans le body |
| Fiches avec description | **0/73** | Champ absent du schéma |
| Fiches avec consignes_securite | **0/73** | Champ absent du schéma |
| Fiches avec methodes_compatibles | **0/73** | Champ absent du schéma |

### Problèmes critiques

1. **S5 entièrement corrompue** — Les 10 fiches S5 ont des titres corrompus (fragments de titres adjacents concaténés). Les muscles sont tous "Contenu a completer". Les tags sont incorrects ("etirement" au lieu de "fonctionnel"). Cause probable : un script d'import qui a découpé un texte continu sans respecter les limites d'exercice.

2. **s4-15 corrompue** — Le frontmatter contient les données concaténées de plusieurs exercices S5 dans les champs `equipment` et `muscles`.

3. **0 body MDX** — Aucune fiche ne contient de contenu descriptif (consignes d'exécution, variations, erreurs courantes). Toutes les fiches sont uniquement du frontmatter.

4. **Doublon s1-001 / s1-01** — Même exercice "Planche frontale sur coudes", deux slugs différents. s1-001 a level "debutant" et des noms de muscles simplifiés.

5. **Doublon s5-02 / s5-02-burpees** — Deux fiches pour les burpees, une corrompue (s5-02) et une propre mais sans media (s5-02-burpees).

6. **Niveaux de difficulté** — 5 exercices marqués "debutant" ou "avancé" dans la V2 sont tous "intermediaire" dans les MDX (sauf s1-001 qui est "debutant"). Le mapping de difficulté V2→MDX n'a pas été respecté.

### Étirements

**Aucun exercice d'étirement** n'existe dans le repo. Certaines fiches S5 ont le tag "etirement" par erreur (bug du script d'import), mais ce sont des exercices fonctionnels, pas des étirements.

### Médias

| Type | Présent | Absent |
|------|---------|--------|
| Images principales (.webp) | 71 (s1-001 à s5-10) | 2 (s5-02-burpees, squat-goblet) |
| Thumbnails (thumb-*.webp) | 70 (s1-01 à s5-10) | 3 (s1-001, s5-02-burpees, squat-goblet) |
| Vidéos (.mp4/.webm) | 1 (s1-02) | 72 |
| V2 legacy (public/import/v2) | S1(10) + S2(7) = 17 | — |

### Recommandations (pour action future)

1. **Priorité haute** : Réécrire les 10 fiches S5 + s4-15 avec les bons titres, muscles et equipment
2. **Priorité haute** : Ajouter le body MDX (consignes d'exécution) aux 73 fiches
3. **Priorité moyenne** : Corriger les niveaux de difficulté (Débutant/Avancé v2 → MDX)
4. **Priorité moyenne** : Ajouter `description`, `consignes_securite`, `methodes_compatibles` au schéma Zod
5. **Priorité basse** : Supprimer les doublons (s1-001, s5-02-burpees) ou les fusionner
6. **Priorité basse** : Créer les fiches d'étirements (absentes du repo)
