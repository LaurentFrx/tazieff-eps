---
name: mode-enseignant
description: >
  Mode enseignant et architecture freemium de Tazieff EPS : useTeacherMode,
  usePlan, ProGate, ProTeaser, authentification Supabase, gestion des
  licences établissement, accès enseignant par email académique.
  Utiliser cette skill dès qu'on mentionne mode enseignant, teacher mode,
  PIN, Pro, freemium, licence, ProGate, ProTeaser, usePlan, établissement,
  organisation, auth Supabase, magic link, email académique, ou toute
  modification touchant au gating de fonctionnalités. Aussi quand on
  ajoute une fonctionnalité qui doit être Pro ou enseignant-only.
---

# Mode enseignant et freemium — Tazieff EPS

## Principe directeur

Tout ce qui aide l'élève à **comprendre et apprendre** est GRATUIT.
Tout ce qui aide à **tracer, suivre et optimiser** est Pro.
L'enseignant ne paie JAMAIS.

Modèle B2B : le lycée achète la licence, les élèves utilisent.
Pas de paiement individuel — jamais de carte bancaire pour mineurs.

## Hook useTeacherMode

```typescript
// src/hooks/useTeacherMode.ts (~60 lignes)
function useTeacherMode(): {
  unlocked: boolean;
  pin: string;
  unlock: (pin: string) => void;
  lock: () => void;
}
```

### Fonctionnement
- State dans `window.__teacherMode` (global mutable, legacy)
- Sync cross-composants via `CustomEvent('teacher-mode-change')`
- SSR-safe : retourne `{ unlocked: false, pin: '' }` si `window` undefined
- 10 tests passants

### Pattern d'émission
```typescript
function updateSnapshot(next: TeacherModeSnapshot) {
  if (typeof window === 'undefined') return;
  window.__teacherMode = next;
  window.dispatchEvent(
    new CustomEvent('teacher-mode-change', { detail: next })
  );
}
```

## Hook usePlan

Détermine si l'utilisateur a accès aux fonctionnalités Pro.

```typescript
function usePlan(): {
  isPro: boolean;
  orgName?: string;
}
```

Sources de vérité (cascade) :
1. Email académique (`@ac-*.fr`) → Pro automatiquement
2. Code organisation valide (ex: `TAZIEFF2026`) → vérifie `is_pro`
   sur la table `organizations` Supabase
3. Sinon → gratuit

## Composants de gating

### ProGate
Wrapper qui bloque l'accès si pas Pro. Affiche un message et
redirige vers l'explication de la licence.

```tsx
<ProGate fallback={<UpgradeMessage />}>
  <CarnetComplet />
</ProGate>
```

### ProTeaser
Montre un aperçu dégradé (blur, limite 3 items) avec un CTA
"Demande le code à ton prof" ou "Contacte ton établissement".

## Découpage gratuit / Pro

### GRATUIT — Accès libre, sans compte
- Catalogue exercices complet (80+ fiches, filtres, vidéos)
- Fiches méthodes (19 méthodes)
- Section Apprendre (anatomie 3D, RM/RIR/RPE, sécurité)
- Section BAC (grilles, attendus, démarche spiralaire)
- Mannequin anatomique 3D interactif
- Calculateur RM (calcul ponctuel)
- Timer basique (chrono EMOM/AMRAP/repos)
- Favoris (localStorage, pas de sync cross-device)

### PRO — Licence établissement
- Carnet d'entraînement persistant (Supabase cross-device)
- Graphiques de progression
- Export PDF du carnet
- Générateur de séance avancé
- Limite carnet gratuit : 3 séances max

### ENSEIGNANT — Toujours gratuit
- Accès à tout le contenu Pro automatiquement
- Créer des séances pour la classe
- Partage par QR code ou lien
- Tableau de bord classe (optionnel)

## Authentification Supabase

### Auth anonyme (par défaut)
Chaque visiteur obtient un UUID Supabase en arrière-plan.
Zéro friction — l'utilisateur ne voit rien.
Le carnet se synchro automatiquement si dans une org Pro.

### Liaison email (optionnelle)
Pour cross-device, l'utilisateur lie son compte anonyme à un
email via magic link Supabase. Pas de mot de passe.

### Détection enseignant par email académique
Les profs français ont tous une adresse en `@ac-{academie}.fr`.
C'est infalsifiable par les élèves.

Domaines reconnus :
```
@ac-bordeaux.fr, @ac-paris.fr, @ac-lyon.fr, @ac-toulouse.fr,
@ac-montpellier.fr, @ac-aix-marseille.fr, @ac-nice.fr,
@ac-grenoble.fr, @ac-strasbourg.fr, @ac-nancy-metz.fr,
@ac-lille.fr, @ac-rennes.fr, @ac-nantes.fr, @ac-orleans-tours.fr,
@ac-poitiers.fr, @ac-limoges.fr, @ac-clermont.fr,
@ac-besancon.fr, @ac-dijon.fr, @ac-reims.fr, @ac-amiens.fr,
@ac-rouen.fr, @ac-caen.fr, @ac-corse.fr, @ac-creteil.fr,
@ac-versailles.fr, @ac-guadeloupe.fr, @ac-martinique.fr,
@ac-guyane.fr, @ac-reunion.fr, @ac-mayotte.fr,
@ac-noumea.nc, @ac-polynesie.pf, @ac-wf.wf,
@ac-spm.fr
```

Pattern de détection :
```typescript
const isAcademicEmail = (email: string) =>
  /^.+@ac-[a-z-]+\.(fr|nc|pf|wf)$/.test(email.toLowerCase());
```

## Supabase — Tables et RLS

### organizations
- `id`, `name`, `code` (ex: TAZIEFF2026), `is_pro`
- RLS : lecture publique, écriture admin

### training_entries
- `id`, `user_id`, `org_id`, `data_json`, `created_at`
- RLS : un user ne voit que ses propres entrées

Lycée Tazieff seedé : code `TAZIEFF2026`, `is_pro = true`

## Intégration Lemon Squeezy (PENDING)

Paiement B2B via Lemon Squeezy — pas encore implémenté.
Quand un établissement paie, on set `is_pro = true` sur son org.
Les pages légales (CGV, mentions) sont aussi en attente.

## Ce qui reste en attente

- Lemon Squeezy intégration
- Pages légales (CGV, mentions légales, politique confidentialité)
- Accord IP avec Fred (utilisation du contenu du diapo)
- `TYPE_DEFAULTS` i18n (reporté au mode enseignant enrichi)
- Séances partageables par QR code/lien
