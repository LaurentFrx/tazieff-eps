---
name: gouvernance-editoriale
description: Use this skill before any code change touching authentication, content editing, content reading, role checks, RLS policies, or differentiated display of pedagogical content in Tazieff EPS. Trigger this skill whenever the work involves teacher_annotations, exercise_overrides, the InlineParagraphEditor, the prof magic-link flow, the student class enrollment, the super_admin role, or any audit log feature. If the task touches who can write what to whom, this skill is mandatory.
---

# Gouvernance éditoriale Tazieff EPS — règles non négociables

Avant toute modification de code touchant l'édition, l'authentification, ou l'affichage de contenu pédagogique, lis intégralement le fichier `GOUVERNANCE_EDITORIALE.md` à la racine du repo. Ce skill est un rappel opérationnel des points qui se traduisent directement en code.

> Aligné sur `GOUVERNANCE_EDITORIALE.md` v1.1, mis à jour le 2026-04-28.

## Règle 1 — Trois couches éditoriales strictement séparées

Le code ne doit jamais mélanger ces trois couches :

1. **Override (catalogue officiel)** : table `exercise_overrides`. Écriture réservée aux rôles `super_admin` et `admin` uniquement. Visible par tous les utilisateurs sans distinction.
2. **Annotations (prof académique)** : table `teacher_annotations`. Écriture réservée aux comptes `teacher` authentifiés magic-link académique. Visibilité limitée à la portée déclarée.
3. **Carnet personnel (élève)** : tables élève (favoris, séances enregistrées, annotations privées). Écriture par l'élève propriétaire uniquement. Lecture par lui-même seul.

Si un code écrit dans une couche au nom d'un rôle d'une autre couche, c'est un bug de gouvernance. Refuser d'implémenter et signaler à Laurent.

## Règle 2 — Le PIN d'édition est obsolète

Le PIN actuel qui débloque le `InlineParagraphEditor` doit être considéré comme déprécié. **Aucun nouveau code ne doit utiliser le PIN comme déclencheur d'édition de contenu officiel.** L'édition du catalogue passe par compte super_admin ou admin authentifié par mot de passe fort.

Si un prompt demande de réutiliser le PIN pour étendre l'édition, refuser et demander confirmation à Laurent.

## Règle 3 — Affichage des annotations prof côté élève (pattern post-it)

Quand un élève consulte une fiche d'exercice, les annotations de ses profs visibles selon son scope (`class`, `school`, ou `student` si l'annotation le cible) sont affichées en post-it stylisé après le paragraphe officiel concerné.

Caractéristiques du post-it :

- Encadré visuellement distinct (bordure latérale colorée, fond légèrement teinté)
- Attribution explicite : nom du prof affiché en en-tête
- Position : après le paragraphe officiel, jamais en remplacement
- Le contenu officiel reste intégralement visible et inchangé

Implications pour Claude (CC ou Chat) :

- Toujours afficher l'annotation comme un ajout, jamais comme une substitution
- Toujours inclure l'attribution du prof
- Ne jamais mélanger le rendu de l'annotation avec le contenu officiel sans séparation visuelle

Seule exception : les annotations personnelles de l'élève lui-même (carnet personnel), qui sont privées par construction et restent visuellement distinctes du post-it prof (police + couleur dédiées).

Référence : `GOUVERNANCE_EDITORIALE.md` v1.1 §3.2.

## Règle 4 — Quatre portées d'annotation, ni plus ni moins

Les annotations prof acceptent quatre `visibility_scope` :

- `private` : le prof seul
- `student` : un élève précis (nécessite `target_user_id`)
- `class` : tous les élèves d'une classe (nécessite `scope_id` = `class_id`)
- `school` : tous les élèves de l'établissement

Les portées suivantes sont **explicitement abandonnées** en v1 :

- Annotation par niveau (Seconde/1ère/Term)
- Annotation entre profs d'un même établissement (« peers »)

Si un prompt demande d'implémenter ces portées, refuser et renvoyer à `GOUVERNANCE_EDITORIALE.md` §8.

## Règle 5 — Modération a posteriori, audit obligatoire

Toute écriture par un admin ou un teacher doit :

1. Être immédiatement visible par ses destinataires (pas de file d'attente, pas de modération a priori).
2. Produire une entrée dans `audit_log` (table à créer si absente) avec auteur, type d'action, cible, diff.
3. Déclencher une notification temps réel vers tous les comptes super_admin.

Si un code écrit dans `exercise_overrides` ou `teacher_annotations` sans produire d'entrée audit, c'est incomplet. Demander à Laurent comment ajouter l'audit avant de finaliser.

## Règle 6 — Verrouillage strict des écritures

Aucun rôle autre que `super_admin`, `admin`, `teacher`, `student` ne peut écrire en base. En particulier :

- Coach, préparateur physique, professionnel du sport : pas d'écriture, même avec compte payant.
- Parent ou tuteur : pas d'écriture.
- Visiteur anonyme : pas d'écriture.

Les abonnements B2C donnent un accès en lecture + carnet élève, jamais en annotation publique.

## Règle 7 — Distinction visuelle pour le super_admin

Quand Laurent (ou un autre super_admin) consulte une fiche, il doit pouvoir distinguer :

- Le contenu officiel d'un override : couleur/police dédiée override
- Une annotation prof : couleur/police dédiée annotation, avec auteur et portée affichés
- Le carnet d'un élève (s'il y a accès — par défaut non, à débattre cas par cas)

Le super_admin voit une différenciation plus poussée que l'élève : là où l'élève distingue contenu officiel ↔ post-it prof (cf. Règle 3), le super_admin distingue en plus les overrides admin (police/couleur dédiées) et, le cas échéant, le carnet personnel élève. Toute couche éditoriale doit rester identifiable au premier coup d'œil pour Laurent.

## Workflow attendu pour toute tâche d'édition

1. Lire `GOUVERNANCE_EDITORIALE.md` à la racine du repo en premier.
2. Identifier dans quelle couche (override / annotation / carnet) la modification s'inscrit.
3. Vérifier le rôle requis et l'authentification associée.
4. Vérifier les règles d'affichage différencié pour cette couche.
5. Prévoir l'entrée `audit_log` et la notification super_admin.
6. Implémenter, tester, commiter.

Si un point de la directive n'est pas clair ou semble en contradiction avec un prompt utilisateur, **ne pas trancher seul** : demander à Laurent.

## Référence

Document canonique : `GOUVERNANCE_EDITORIALE.md` à la racine du repo. Toute évolution de ces règles passe par modification de ce fichier, validée par le super_admin.
