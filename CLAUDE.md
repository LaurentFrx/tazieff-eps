# CLAUDE.md — Tazieff EPS

> Ce fichier est lu automatiquement par Claude Code CLI à chaque session.
> Il constitue la référence unique pour tout développement sur ce projet.
> Dernière mise à jour : Mars 2026

---

## 1. Identité du projet

**Tazieff EPS** est la seule PWA pédagogique moderne dédiée à la musculation en EPS au lycée en France.

- **App prod** : https://guide-musculation.vercel.app
- **Repo** : github.com/LaurentFrx/tazieff-eps (branche `main` uniquement)
- **Public cible** : lycéens de 15-18 ans (2nde → Terminale) en option musculation BAC EPS
- **Usage réel** : consulté sur smartphone EN SALLE DE SPORT, entre deux séries d'exercices (5-15 secondes d'attention)
- **Source pédagogique** : diaporama Muscu'EPS de Frédérique Proisy (65 pages), enseignante au Lycée Haroun Tazieff, Saint-Paul-lès-Dax

L'app est l'incarnation numérique native du contenu de Fred — plus accessible, plus interactive, et plus utile qu'un diaporama de 200 Mo.

---

## 2. Stack technique

- **Framework** : Next.js 16.1.4, React 19.2.3, TypeScript
- **Styling** : Tailwind CSS
- **Contenu** : MDX (exercices, méthodes, apprendre)
- **Base de données** : Supabase (exercices live enseignant)
- **Tests** : Vitest 4.0.18 + jsdom — 267+ tests
- **PWA** : Serwist (service worker)
- **Déploiement** : Vercel (auto-deploy depuis `main`)
- **i18n** : Tri-lingue (FR/EN/ES) avec dictionnaire fitness dédié
- **Node** : 20.9+

---

## 3. Architecture des données

### Sources d'exercices (priorité de merge)

1. **MDX natifs** (`/content/exercises/{locale}/*.mdx`) — source de vérité
2. **Supabase live** — exercices créés par l'enseignant en temps réel
3. **Import v2** — legacy, migration progressive

### Autres contenus MDX

- Méthodes : `/content/methods/{locale}/*.mdx`
- Apprendre : `/content/learn/{locale}/*.mdx`

### Médias

- Images/vidéos : `/public/images/exos/{slug}.webp` / `.webm`
- Thumbnails : `thumb-{slug}.webp`, `thumb169-{slug}.webp`, `thumb916-{slug}.webp`

### Hooks principaux

- `useFavorites` — favoris élève (localStorage)
- `useTeacherMode` — mode enseignant
- `useExercisesLiveSync` — sync Supabase temps réel

### Filtres

- Logique pure dans `src/lib/exercices/filters.ts`

---

## 4. Navigation et UI

### Design système "Sport Vibrant"

- **BottomTabBar** fixe sur mobile — 5 onglets avec icônes SVG
- **Palette par section** : orange (exercices), bleu (méthodes), vert (apprendre), violet (BAC), rose (outils)
- **SectionHero** : composant réutilisable sur les 5 pages index
- **Illustrations** : SVG partagés dans `illustrations.tsx`
- **Touch targets** : minimum 44px partout

### Composants clés

- `ExerciseFilters` — filtres chips scrollables
- `ExerciseGrid` — grille responsive (2 col mobile, 3-4 desktop)
- `MethodeCard` — carte méthode réutilisable (page méthodes + fiches exercices)
- `DetailHeader` / `BackButton` — navigation retour cohérente
- `HeroMedia` — wrapper Next.js Image/Video avec lazy loading

---

## 5. Règles de développement ABSOLUES

### 5.1 Workflow obligatoire

```
1. git pull origin main              # Toujours synchroniser avant de travailler
2. [modifications]
3. npm run build                     # OBLIGATOIRE — ne jamais skip
4. npm test                          # Vérifier la non-régression
5. git add + commit (message FR)     # Message descriptif en français
6. git push origin main              # Push systématique, jamais de travail local non poussé
```

### 5.2 Fichiers protégés

- **Ne JAMAIS modifier `app/page.tsx`** (homepage) sauf demande explicite de Laurent
- **Ne JAMAIS modifier `app/layout.tsx`** sans demande explicite
- **Ne JAMAIS supprimer un fichier MDX** sans demande explicite

### 5.3 Standards de code

- TypeScript strict — pas de `any` sauf cas documenté
- Composants fonctionnels React uniquement (pas de classes)
- Imports absolus avec `@/` (configuré dans tsconfig)
- Noms de fichiers : camelCase pour les utils, PascalCase pour les composants
- Messages de commit : en français, descriptifs (ex: "feat: ajouter page méthodes avec filtres par objectif")
- Préfixes commit : `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`

### 5.4 Tests

- Tout nouveau composant ou utilitaire → test Vitest associé
- Tout bug corrigé → test de non-régression
- Minimum : les tests existants ne doivent JAMAIS casser
- Lancer `npm test` avant chaque commit

### 5.5 Performance

- Utiliser `next/image` partout (jamais de `<img>` natif)
- Lazy-load les composants lourds (Three.js, vidéos) avec `dynamic import`
- Pages exercices et méthodes en SSG (static generation), pas SSR
- Images en WebP, vidéos en WebM

---

## 6. Contenu pédagogique — Principes critiques

### 6.1 Source de vérité

Le PDF de Fred (Diapo Muscu'EPS, 65 pages) est la SEULE source de vérité pour le contenu pédagogique. Tu n'as PAS accès à ce document. Laurent te fournira toujours le contenu exact à intégrer dans ses prompts.

**INTERDIT** : inventer, halluciner, ou compléter du contenu pédagogique depuis ta mémoire générale. Si Laurent ne te donne pas le contenu source, DEMANDE-LE.

### 6.2 Terminologie fitness

Le dictionnaire fitness i18n est validé et déployé. Respecter strictement :

- FR : "entraînement" (pas "formation")
- ES : "entrenamiento" (pas "formación" — erreur courante de DeepL)
- EN : "training" (pas "formation")

Ne jamais modifier le dictionnaire sans demande explicite.

### 6.3 Niveau de langage

Le contenu s'adresse à des lycéens de 15-18 ans :

- Vocabulaire précis mais accessible
- Phrases courtes et directes
- Pas de jargon scientifique non expliqué
- Les termes techniques (RM, RIR, RPE, séries, reps) sont utilisés car ce sont les termes du programme — mais toujours définis à la première occurrence

### 6.4 Progressive disclosure par niveau

- **2nde** : initiation, maîtrise technique, guidage fort
- **1ère** : consolidation, autonomie encadrée, construction de programme
- **Terminale** : projet autonome, optimisation, analyse fine

Un élève de Seconde ne doit JAMAIS être submergé par du contenu Terminale.

---

## 7. Ce qu'il ne faut PAS faire

Ces décisions sont issues de 3 audits croisés (Claude, Gemini, ChatGPT) et sont définitives :

- **PAS d'élargissement** aux autres APSA (badminton, course d'orientation, etc.) — l'app cible la musculation uniquement
- **PAS de gamification superficielle** (badges, points, récompenses) — les lycéens veulent du contenu utile, pas du décorum
- **PAS d'IA personnalisée** intégrée — prématuré et problématique RGPD pour des mineurs
- **PAS de forum de discussion** — hors besoin, les élèves ont leurs propres réseaux
- **PAS d'authentification EduConnect** — surcharge technique pour bénéfice marginal
- **PAS de gestion de notes certificatives** — c'est le rôle de Pronote/ScoNet
- **PAS de feature creep** — chaque fonctionnalité ajoutée doit servir un usage concret en salle de musculation

---

## 8. Commandes de référence

```bash
# Développement
npm run dev                    # Serveur local (port 3000)
npm run build                  # Build production (OBLIGATOIRE avant commit)
npm test                       # Lancer tous les tests
npm run test:watch             # Tests en mode watch

# Vérification
npx next lint                  # Lint ESLint
npx tsc --noEmit               # Type-check sans build
```

---

## 9. État actuel et roadmap

### Phases terminées ✅

- Phase 0 : Refonte navigation (BottomTabBar, SectionHero, design Sport Vibrant)
- Refonte UX complète : 5 onglets, homepage colorée, SVG partagés
- Dictionnaire fitness i18n validé (0 erreur DeepL)
- 267 tests passants, 28 routes, 325+ MDX

### Prochaines priorités (dans l'ordre)

1. **Phase 1 — Méthodes d'entraînement** : 17+ fiches MDX, page /methodes, liens croisés exercice ↔ méthode ↔ muscle. C'est le manque le plus critique.
2. **Phase 2 — Contenu théorique** : RM/RIR/RPE (calculateur), anatomie, principes sécuritaires
3. **Quick wins** : recherche interne, breadcrumbs, mode sombre, alt text enrichis
4. **Phase 4 — Parcours BAC** : grille BAC interactive, checklist compétences par niveau

### Couverture du PDF de Fred

| Section                        | Pages     | Statut     | Phase |
| ------------------------------ | --------- | ---------- | ----- |
| Exercices (catalogue)          | dispersés | ✅ Existe  | —     |
| Endurance / Volume / Puissance | 3-26      | ✅ Couvert via méthodes + exercices | P1    |
| Méthodes d'entraînement        | 33-54     | ✅ 19 fiches MDX (FR/EN/ES)  | P1    |
| Muscles & fonctionnement       | 31-32     | ⚠️ Partiel | P2    |
| RM / RIR / RPE                 | 55-56     | ❌ Absent  | P2    |
| Principes sécuritaires         | 57-59     | ⚠️ Partiel | P2    |
| Programmes hebdo               | 28-30     | ❌ Absent  | P3    |
| Évaluations (2nde/1ère/Term)   | 61-63     | ❌ Absent  | P4    |
| Épreuve du BAC                 | 64-65     | ❌ Absent  | P4    |

---

## 10. Structure des fichiers clés

```
src/
├── app/
│   ├── [locale]/
│   │   ├── exercices/          # Catalogue + fiches détail
│   │   ├── methodes/           # Catalogue méthodes + fiches
│   │   ├── apprendre/          # Contenu théorique
│   │   ├── bac/                # Parcours évaluation
│   │   └── outils/             # Timer, calculateur RM, etc.
│   └── page.tsx                # Homepage (NE PAS MODIFIER)
├── components/
│   ├── media/                  # HeroMedia, VideoPlayer
│   ├── ui/                     # Composants génériques
│   └── illustrations.tsx       # SVG partagés
├── lib/
│   ├── exercices/
│   │   ├── filters.ts          # Filtres purs
│   │   ├── fs.ts               # Loader multi-locale MDX
│   │   └── schema.ts           # Types TypeScript
│   └── i18n/                   # Dictionnaires, config locale
├── hooks/                      # useFavorites, useTeacherMode, etc.
content/
├── exercises/{locale}/*.mdx
├── methods/{locale}/*.mdx
└── learn/{locale}/*.mdx
```

---

## 11. Démarrage de session CC

À chaque nouvelle session Claude Code, exécuter dans cet ordre :

```bash
git pull origin main
git status
npm test
```

Si des tests échouent AVANT toute modification, signaler le problème à Laurent avant de continuer.
