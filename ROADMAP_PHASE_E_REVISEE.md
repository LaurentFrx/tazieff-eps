# Roadmap Phase E — version révisée 26 avril 2026

## Pourquoi cette révision

Le 26 avril, suite à la directive de gouvernance éditoriale formalisée dans `GOUVERNANCE_EDITORIALE.md`, le séquencement initial de Phase E (« propagation des 3 champs déjà éditables vers l'élève ») est obsolète.

L'audit du 26 avril a révélé que l'édition au clic mergée le 24 avril écrit dans `exercise_overrides` (couche catalogue global) et non dans `teacher_annotations` (couche pédagogique par classe). Comme la directive interdit aux profs d'écrire dans le catalogue officiel, cette édition est en l'état un **non-respect de gouvernance** et doit être verrouillée avant tout nouveau développement.

## Phase 0 — Correctifs prioritaires (avant nouveaux sprints)

### P0.1 — Verrouiller le PIN d'édition au clic

Statut : **bloquant**. Sans ce correctif, n'importe quel détenteur du PIN peut réécrire le catalogue pour tous les utilisateurs.

**Action :** modifier le composant `InlineParagraphEditor` et le hook `useTeacherMode` pour que l'édition au clic ne s'active qu'avec un compte `super_admin` ou `admin` authentifié. Le PIN reste utilisable pour les fonctionnalités prof légères (favoris classe, etc.) mais ne déclenche plus l'édition de contenu officiel.

**Estimation CC :** 1-2 jours (lecture du code, ajout d'un check de rôle, tests).

### P0.2 — Créer les rôles super_admin et admin

Statut : **bloquant** pour P0.1.

**Action :** ajouter une colonne `role` dans `memberships` ou créer une table dédiée `app_admins`, avec valeurs possibles `super_admin`, `admin`. Migration BD + helper SECURITY DEFINER `is_super_admin()` / `is_admin()`. Policies RLS sur `exercise_overrides` mises à jour pour exiger ce rôle en INSERT/UPDATE/DELETE.

**Estimation CC :** 2 jours.

### P0.3 — Audit log et notifications

Statut : **important mais non bloquant** pour Sprint 1. Peut être traité en parallèle.

**Action :** table `audit_log` (auteur, type d'action, cible, diff JSON, timestamp), trigger PostgreSQL sur `exercise_overrides` et `teacher_annotations` pour peupler `audit_log` automatiquement, mécanisme de notification super_admin (email + page web).

**Estimation CC :** 3-4 jours.

## Sprints Phase E (après correctifs)

### Sprint 1 — Inscription élève à une classe

**Préalable absolu** au reste : sans élèves dans `class_enrollments`, aucune annotation `class` ne peut être lue.

**Livrables :**
- Page `/ma-classe` (URL canonique tranchée le 26 avril)
- Formulaire de saisie code de classe → appel `join_class_with_code`
- Hook `useMyClasses` côté élève
- Vue « ma classe » affichant l'enseignant et la classe rejointe

**Décision en suspens :** mode d'authentification élève (compte dédié magic-link email perso vs autre). À trancher avant écriture du prompt CC.

**Estimation CC :** 2-3 jours.

### Sprint 2 — Annotation prof scope class et student

**Livrables :**
- Composant `TeacherAnnotationEditor` distinct du `InlineParagraphEditor` (qui reste réservé super_admin)
- Activation uniquement si compte teacher authentifié magic-link académique (pas via PIN)
- UI permettant de choisir la portée : private, student (sélecteur d'élève), class (sélecteur de classe), school
- Migration BD ajoutant `scope = student` dans la check constraint et un champ `target_user_id`
- Route POST `/api/teacher/annotations` étendue pour les nouveaux scopes
- Audit log déclenché à chaque écriture

**Estimation CC :** 4-5 jours.

### Sprint 3 — Lecture côté élève sans badge

**Livrables :**
- Route GET `/api/exercises/[slug]/annotations` (sans préfixe /teacher/, pour l'élève authentifié)
- Modification de `ExerciseLiveDetail.tsx` pour fusionner contenu officiel + annotations applicables
- **Affichage strictement indistinct** côté élève (exigence pédagogique §3.2 de GOUVERNANCE_EDITORIALE.md)
- Tests : un élève voit les annotations de sa classe, ne voit pas celles d'une autre classe, ne voit pas celles d'un autre établissement

**Estimation CC :** 2-3 jours.

### Sprint 4 (différé) — Création de fiche par un enseignant

Mentionné dans la directive du 26 avril mais hors scope Phase E v1. Devient Phase F.

## Estimations globales

- Correctifs P0 : 6-8 jours CC
- Sprints E1+E2+E3 : 8-11 jours CC
- **Total Phase E révisée : 14-19 jours CC**, soit environ 4 à 6 semaines en cadence raisonnable.

Tenable d'ici fin juin 2026 pour un test en classe sur la rentrée de septembre. Plus tendu pour fin mai (test en classe avant les vacances d'été).

## Décisions encore à trancher

1. Mode d'authentification élève (compte perso vs autre)
2. Couleur/police dédiées pour la signalétique super_admin sur fiche
3. Format de notification super_admin (email + page in-app, ou autre)
4. 2FA admin : à ajouter à quel moment ?
