# Gouvernance éditoriale Tazieff EPS

**Version 1.0 — 26 avril 2026**
**Source de vérité pour toute décision d'architecture, de permissions et d'affichage de contenu pédagogique.**

Ce document est la référence canonique. Toute évolution du code touchant à l'authentification, à l'édition de contenu, à la lecture côté élève, ou à l'affichage différencié doit être conforme à ce qui est écrit ici. En cas de doute, ce document prime sur l'existant.

---

## 1. Principe directeur

Tazieff EPS distingue trois couches éditoriales superposées, qui ne doivent jamais être confondues dans le code, dans l'UI, ni dans la base de données :

1. **Le contenu officiel de l'application** — fait foi, partagé par tous les utilisateurs sans distinction. Il est éditable uniquement par les administrateurs nommément désignés.
2. **Les annotations pédagogiques** — modifications contextuelles produites par les enseignants académiques pour leurs élèves ou collègues d'établissement. Elles ne sortent jamais de leur portée.
3. **Le carnet personnel de l'élève** — espace privé, en lecture/écriture pour son propriétaire, invisible à tous les autres y compris à son propre enseignant.

Cette séparation est non négociable. Elle protège la cohérence du catalogue, l'autonomie pédagogique du prof, et la vie privée de l'élève.

---

## 2. Rôles

### 2.1 super_admin

C'est toi (Laurent) et toi seul à la création de l'app. Tu peux désigner d'autres administrateurs en leur attribuant ce rôle.

**Authentification :** email + mot de passe fort. Une 2FA est à prévoir avant l'ouverture commerciale large.
**Pouvoirs :** réécriture de tous les contenus pédagogiques de l'app sans exception (exercices, méthodes, pages BAC, pages anatomie, contenus statiques). Validation et suppression de toute annotation ou fiche créée par un enseignant. Désignation et révocation d'autres admins.
**Notifications reçues :** toutes les modifications produites par les admins et les enseignants, en temps réel.

### 2.2 admin (administrateur désigné)

Un compte explicitement promu par un super_admin. Mêmes pouvoirs d'édition que le super_admin sur le catalogue, mais ne peut pas désigner d'autres admins ni révoquer un super_admin.

**Authentification :** identique super_admin (mot de passe fort, 2FA à terme).

### 2.3 teacher (enseignant académique)

Compte authentifié par magic-link sur une adresse académique reconnue (35 académies françaises listées dans le code).

**Pouvoirs sur les fiches existantes :** annotation dans 4 portées (cf. §3.2). Aucun pouvoir de réécriture du contenu officiel.
**Pouvoirs de création :** peut créer une nouvelle fiche d'exercice publiée vers ses élèves et collègues d'établissement, en attente de validation par un super_admin pour promotion éventuelle au catalogue officiel.

### 2.4 student (élève)

Compte attaché à un établissement (via licence B2B) ou compte individuel (B2C). Aucune écriture sur le contenu officiel ni sur les annotations des enseignants.

**Pouvoirs :** annotations personnelles privées, carnet d'entraînement, favoris, historique. Inscription à une classe via code fourni par son enseignant.

### 2.5 anonymous (visiteur non authentifié)

Lecture seule du contenu officiel. Pas d'accès aux annotations, pas de carnet, pas de favoris persistants.

---

## 3. Couches éditoriales

### 3.1 Couche override (catalogue officiel)

**Qui écrit :** super_admin et admin uniquement.
**Qui lit :** tout le monde, sans distinction visuelle. Une fois un override appliqué, il *est* le contenu officiel pour tous.
**Stockage :** table `exercise_overrides` (existant) et tables équivalentes à créer pour les autres types de contenu (méthodes, BAC, anatomie, pages statiques).
**Authentification requise :** mot de passe fort. Le PIN actuel doit être supprimé comme déclencheur d'édition (cf. §7).
**Audit :** chaque override produit une entrée dans `audit_log` (table à créer) avec auteur, horodatage, diff, et déclenche une notification à tous les super_admin.

### 3.2 Couche annotations (par les enseignants)

**Qui écrit :** teacher uniquement, identifié par magic-link académique.
**Qui lit :** dépend de la portée. Aucune annotation n'est jamais visible en dehors de sa portée.

Quatre portées disponibles :

| Portée            | Stockage `visibility_scope` | Destinataire                                    |
| ----------------- | ---------------------------- | ----------------------------------------------- |
| `private`         | `private`                    | L'enseignant lui-même uniquement                |
| `student`         | `student` *(nouveau)*        | Un élève précis, identifié par `target_user_id` |
| `class`           | `class`                      | Tous les élèves d'une classe                    |
| `school`          | `school`                     | Tous les élèves de l'établissement              |

**Affichage côté élève :** indistinguable du contenu officiel. Pas de badge, pas d'encadré, pas de signalétique « annotation prof ». L'annotation se substitue ou s'ajoute au texte officiel dans le flux normal de la fiche, comme si elle en faisait partie. C'est une exigence pédagogique forte : l'élève suit la consigne sans distraction sur sa source.
**Affichage côté super_admin :** distinct (police + couleur dédiée), avec mention de l'auteur et de la portée. Tu dois pouvoir, depuis n'importe quelle fiche, voir qui a annoté quoi pour qui.
**Modération :** a posteriori. L'annotation est immédiatement visible par ses destinataires dès qu'elle est sauvegardée. Le super_admin reçoit une notification et peut valider, supprimer, ou alerter l'auteur.

### 3.3 Couche carnet personnel (élève)

**Qui écrit :** l'élève lui-même.
**Qui lit :** l'élève lui-même uniquement. Ni l'enseignant, ni le super_admin n'y a accès.
**Affichage :** police et couleur dédiées, distinctes du contenu officiel et des annotations prof. C'est la seule couche que l'élève voit comme « la sienne ».

### 3.4 Création de fiches par un enseignant

Un enseignant peut créer une fiche d'exercice qui n'existe pas dans le catalogue officiel.

**Visibilité par défaut :** ses élèves d'établissement et ses collègues d'établissement (équivalent fonctionnel d'un scope `school`).
**Validation a posteriori :** la fiche est immédiatement visible par ses destinataires. Le super_admin reçoit une notification et peut :
- Valider et promouvoir la fiche au catalogue officiel (elle devient visible par tous).
- Supprimer la fiche si elle ne convient pas.
- Alerter l'auteur pour demander correction.

**Statut technique :** la fiche est stockée dans une table `teacher_exercises` à créer, distincte du catalogue officiel. La promotion au catalogue est une opération explicite de copie + activation.

---

## 4. Verrouillage des écritures

Aucun rôle autre que super_admin, admin, teacher, ou student ne peut écrire dans la base. En particulier :

- Un coach sportif, un professionnel du sport, un préparateur physique : aucune écriture, même avec compte payant.
- Un parent : aucune écriture, même comme tuteur d'un élève mineur.
- Un visiteur anonyme : aucune écriture.

Les comptes payants B2C donnent accès au contenu en lecture, à un carnet personnel, et aux fonctionnalités élève. Ils ne donnent jamais accès à la couche annotations ni à la couche override.

---

## 5. Affichage différencié

Trois polices/couleurs canoniques à définir dans le design system Sport Vibrant :

| Couche                    | Visible pour     | Police + couleur                                            |
| ------------------------- | ---------------- | ----------------------------------------------------------- |
| Contenu officiel + override | Tous             | Police corps standard (DM Sans), couleur texte standard     |
| Annotations prof           | Élèves destinataires | **Indistinct du contenu officiel** (exigence pédagogique) |
| Annotations prof           | Super_admin      | Police + couleur dédiées (à définir, distinctes du carnet)  |
| Carnet personnel élève     | Élève propriétaire | Police + couleur dédiées (à définir)                       |
| Override admin             | Super_admin      | Police + couleur dédiées (distinctes des annotations)       |

L'élève ne distingue jamais une annotation prof du contenu officiel. Le super_admin distingue toujours qui a écrit quoi.

---

## 6. Audit et notifications

Toute modification produite par un admin, un teacher, ou par toi-même est tracée :

- Table `audit_log` (à créer) avec : `id`, `actor_user_id`, `actor_role`, `action_type`, `target_table`, `target_id`, `diff_before`, `diff_after`, `created_at`.
- Notification immédiate à tous les super_admin pour chaque entrée d'audit.
- Le super_admin peut depuis l'audit log : voir le diff, valider, supprimer (rollback), ou notifier l'auteur.

---

## 7. État actuel du code et écart à corriger

L'état actuel du code (au 26 avril 2026) **n'est pas conforme** à cette gouvernance sur trois points :

1. **PIN d'édition au clic** : aujourd'hui n'importe quel détenteur du PIN peut réécrire le catalogue global via `exercise_overrides`. À supprimer comme déclencheur. L'édition au clic doit être conditionnée au rôle super_admin/admin authentifié par mot de passe fort.
2. **Rôle super_admin/admin absent** : pas de table ni de policy distinguant ces rôles aujourd'hui. À créer.
3. **Scope `student` absent** : la table `teacher_annotations` ne gère que `private`, `class`, `school`. Le scope `student` (annotation à l'élève précis) doit être ajouté avec un champ `target_user_id`.

Ces trois points sont des correctifs prioritaires à traiter avant ou en parallèle des nouveaux sprints Phase E.

---

## 8. Ce que ce document ne tranche pas

Volontairement laissé ouvert pour itération future :

- **Annotations par niveau** (Seconde / Première / Terminale) : abandonné en v1, jugé trop hétérogène entre établissements.
- **Annotations entre profs d'un même établissement** : abandonné en v1, la communication verbale en salle des profs est jugée suffisante.
- **2FA admin** : à mettre en place avant ouverture commerciale large, pas bloquant en v1 fermée.
- **Promotion fiche prof → catalogue officiel** : interface de validation à concevoir au moment où la première fiche prof sera créée.

---

**Toute évolution de ce document doit être discutée avec le super_admin avant implémentation.**
