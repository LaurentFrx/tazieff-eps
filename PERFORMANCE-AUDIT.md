# Audit Performance -- Tazieff EPS

- **Date** : 2026-03-29
- **Commit** : `ac475534e73fc10bf73d960dddb0126b8fd9cc76`
- **Branche** : `main`
- **Temps de build** : 45s
- **Tests** : 20 fichiers, 339 tests passants

---

## 1. Analyse du Bundle Client

### Taille totale

| Metrique | Valeur |
|----------|--------|
| Taille totale gzip | **750 KB** (0.73 MB) |
| Taille totale parsed | 2 619 KB (2.56 MB) |
| Nombre de chunks | 70 |
| Taille initiale gzip (chargee sur chaque page) | **468 KB** |

### Top 10 des plus gros chunks client

| # | Chunk | Gzip | Contenu principal |
|---|-------|------|-------------------|
| 1 | `bd904a5c.*.js` | **97.0 KB** | `three/build/three.core.js` |
| 2 | `b536a0f1.*.js` | **83.5 KB** | `three/build/three.module.js` |
| 3 | `4bd1b696-*.js` | **60.9 KB** | `react-dom-client.production.js` (initial) |
| 4 | `framework-*.js` | **58.3 KB** | Next.js framework (initial) |
| 5 | `3139-*.js` | **51.1 KB** | Next.js client runtime + Serwist (initial) |
| 6 | `1958-*.js` | **49.4 KB** | `@supabase/supabase-js` (initial) |
| 7 | `51749ec1.*.js` | **44.5 KB** | `@react-three/fiber` |
| 8 | `439-*.js` | **42.6 KB** | `react-markdown` + `remark-gfm` (initial) |
| 9 | `main-*.js` | **39.0 KB** | Next.js main entry (initial) |
| 10 | `7629.*.js` | **37.9 KB** | `@react-three/drei` + `three-stdlib` + `camera-controls` |

### Three.js dans le bundle

| Chunk | Gzip | Initial ? | Contenu |
|-------|------|-----------|---------|
| `bd904a5c.*.js` | 97.0 KB | Non | `three.core.js` |
| `b536a0f1.*.js` | 83.5 KB | Non | `three.module.js` |
| `51749ec1.*.js` | 44.5 KB | Non | `@react-three/fiber` |
| `7629.*.js` | 37.9 KB | Non | `@react-three/drei`, `GLTFLoader`, `DRACOLoader`, `camera-controls` |
| **Total Three.js** | **262.9 KB** | **Non** | Correctement isole dans des chunks non-initiaux |

**Verdict** : Three.js n'apparait PAS dans les chunks initiaux/partages. Il est correctement code-split et charge uniquement sur `/apprendre/anatomie` via `next/dynamic` avec `ssr: false`.

### react-markdown dans le bundle

| Chunk | Gzip | Initial ? | Contenu |
|-------|------|-----------|---------|
| `439-*.js` | 42.6 KB | **Oui** | `react-markdown` (30.9 KB) + `remark-gfm` (8.6 KB) + `unified` + `micromark` |

**Verdict** : `react-markdown` et son ecosysteme (unified, micromark, remark-gfm) sont charges sur TOUTES les pages (chunk initial), soit **42.6 KB gzip** pour le rendu MDX cote client.

### Supabase dans le bundle

| Chunk | Gzip | Initial ? | Contenu |
|-------|------|-----------|---------|
| `1958-*.js` | 49.4 KB | **Oui** | `@supabase/supabase-js` complet (postgrest, realtime, storage, auth, functions) |

**Verdict** : Le SDK Supabase entier est charge sur toutes les pages. Seuls `realtime` et `postgrest` sont utilises (pour le live sync enseignant).

---

## 2. Routes SSR vs SSG

### Tableau complet

| Route | Mode | Raison |
|-------|------|--------|
| `/` | SSR | `getServerLang()` + `getServerT()` (cookie i18n) |
| `/admin` | SSR | `redirect()` dynamique |
| `/apprendre` | SSR | `getServerLang()` + `getServerT()` |
| `/apprendre/[slug]` | SSR* | `generateStaticParams()` FR, mais `getServerLang()` force le SSR pour les autres locales |
| `/apprendre/anatomie` | SSR | `getServerLang()` pour fetch exercices |
| `/apprendre/calculateur-rm` | SSR | `redirect()` vers `/outils/calculateur-rm` |
| `/apprendre/connaissances` | SSR | `getServerLang()` pour fetch MDX |
| `/apprendre/parametres` | SSR | `getServerLang()` pour fetch MDX |
| `/apprendre/techniques` | SSR | `getServerLang()` pour fetch MDX |
| `/apprendre/timer` | SSR | `redirect()` vers `/outils/timer` |
| `/bac` | SSR | `getServerLang()` + `getServerT()` |
| `/bac/[slug]` | SSR* | `generateStaticParams()` FR, mais locale runtime |
| `/enseignant` | SSR | `getServerLang()` + `getServerT()` + fetch all |
| `/enseignant/partage` | SSR | `getServerLang()` + `getServerT()` |
| `/exercices` | SSR (force-dynamic) | **`export const dynamic = 'force-dynamic'`** + `revalidate = 0` + Supabase live |
| `/exercices/[slug]` | SSR* | `generateStaticParams()` FR + Supabase live overrides |
| `/exos` | SSR | `redirect()` vers `/exercices` |
| `/exos/[slug]` | SSR | `redirect()` vers `/exercices/[slug]` |
| `/ma-seance` | SSR | `redirect()` vers `/outils/ma-seance` |
| `/manifest.webmanifest` | **SSG** | Seule route statique |
| `/methodes` | SSR | `getServerLang()` + `searchParams` |
| `/methodes/[slug]` | SSR* | `generateStaticParams()` FR + locale runtime |
| `/offline` | SSR | `getServerLang()` + `getServerT()` |
| `/onboarding` | SSR | `getServerLang()` + `getServerT()` + fetch all |
| `/outils` | SSR | `getServerLang()` + `getServerT()` |
| `/outils/calculateur-rm` | Client | `'use client'` - composant client pur |
| `/outils/carnet` | SSR | `getServerLang()` + `getServerT()` + fetch all |
| `/outils/ma-seance` | SSR | `getServerLang()` + `getServerT()` + fetch all |
| `/outils/timer` | Client | `'use client'` - timer interactif pur |
| `/parcours-bac` | SSR | `getServerLang()` + `getServerT()` |
| `/parcours-bac/[niveau]` | SSR* | `generateStaticParams()` statique + locale runtime |
| `/parcours-bac/epreuve-bac` | SSR | `getServerLang()` + `getServerT()` |
| `/partager` | Client | `'use client'` - widget partage pur |
| `/programmes` | SSR | `getServerLang()` + `getServerT()` |
| `/progres` | Client | `'use client'` - tracker progres pur |
| `/reglages` | Client | `'use client'` - gestion preferences |
| `/seances` | SSR | `getServerLang()` + `getServerT()` |
| `/seances/[slug]` | SSR* | `generateStaticParams()` + locale runtime |
| `/seances/[slug]/terrain` | SSR | `cookies()` pour langue |

> \* SSR* = `generateStaticParams()` present pour la locale FR, mais le rendu final depend du cookie `eps_lang` lu a runtime, forcant le SSR sur toutes les requetes.

**Constat** : Sur 38 routes, **0 sont en SSG pur** (hors `manifest.webmanifest`). La cause principale est la gestion i18n par cookie (`getServerLang()` lit `cookies()`), qui rend TOUTES les pages dynamiques.

---

## 3. Three.js et Lazy Loading

### Fichiers importants Three.js

| Fichier | Imports |
|---------|---------|
| `src/app/apprendre/anatomie/AnatomyCanvas.tsx` | `Canvas`, `useFrame`, `useThree` (fiber) ; `CameraControls`, `useGLTF`, `useTexture` (drei) ; `THREE` namespace |
| `src/app/apprendre/anatomie/HologramMannequin.tsx` | `useFrame`, `useThree` (fiber) ; `useGLTF` (drei) ; `THREE` namespace ; `DRACOLoader` |

### Chaine de chargement

```
/apprendre/anatomie/page.tsx (Server Component)
  -> AnatomyMap.tsx ("use client")
    -> next/dynamic(() => import("./AnatomyCanvas"), { ssr: false }) <-- LAZY BOUNDARY
      -> AnatomyCanvas.tsx (Three.js, Canvas, etc.)
        -> HologramMannequin.tsx (GLB models, shaders)
```

**Verdict** : Correctement lazy-loade avec `ssr: false`. Isole a la route `/apprendre/anatomie`. Aucune fuite vers les composants partages.

**Note** : `@react-three/postprocessing` (^3.0.4) est dans `package.json` mais **n'est importe nulle part** dans le code. Dependance inutilisee.

---

## 4. Images

### Statistiques

| Metrique | Valeur |
|----------|--------|
| Fichiers utilisant `next/image` | **9** |
| Fichiers utilisant `<img>` natif | **2** (+ 1 mock test) |

### Utilisation de `next/image` -- Detail

| Fichier | priority | sizes | Evaluation |
|---------|----------|-------|------------|
| `ExerciseAnatomyThumb.tsx` | `false` | `"(min-width: 768px) 150px, 120px"` | Excellent |
| `HomeFlyer.tsx` | `true` | `"(max-width: 768px) 100vw, 1280px"` | Excellent (hero) |
| `TopBar.tsx` | - | - | OK (logo 24x24, `unoptimized=true`) |
| `ExerciseCard.tsx` | - | dynamique grid/list | Excellent |
| `HeroMedia.tsx` (x3 instances) | props-driven | partiel | Bon (manque `sizes` sur fallback et lightbox) |
| `HomepageClient.tsx` | - | `"160px"` | Bon |
| `partager/page.tsx` | `true` | - | Bon (QR code) |
| `Figure.tsx` (StaticImageData) | props | `"(max-width: 768px) 100vw..."` | Bon |

### Utilisation de `<img>` natif

| Fichier | Raison | Justifie ? |
|---------|--------|------------|
| `Figure.tsx` (string src) | URL dynamiques, dimensions inconnues | Oui |
| `ExerciseLiveDetail.tsx` (x3) | Uploads enseignant runtime, URLs dynamiques | Oui |
| **`Carnet.tsx` (x3)** | Thumbnails exercices statiques (`/images/exos/thumb169-*.webp`) | **Non -- devrait utiliser next/image** |

### Thumbnails

- `thumb-{slug}.webp` (carre) : utilise dans ExerciseCard via `next/image`
- `thumb169-{slug}.webp` (16:9) : utilise dans ExerciseCard et HomepageClient via `next/image`, **mais `<img>` natif dans Carnet.tsx**
- `thumb916-{slug}.webp` (9:16) : reference dans le code mais **pas rendu dans l'UI**

---

## 5. Fonts

### Configuration

Les fonts sont chargees via `next/font/google` dans `src/app/layout.tsx` :

| Font | Variable CSS | Weights | Usage |
|------|-------------|---------|-------|
| Space Grotesk | `--font-display` | 400, 500, 600, 700 | Titres (h1, h2, h3) |
| Sora | `--font-body` | 300, 400, 500, 600, 700 | Corps de texte |
| Space Mono | `--font-mono` | 400, 700 | Anatomie, elements techniques |
| Orbitron | `--font-orbitron` | 700, 900 | Labels BAC uniquement |

**Verdict** : Configuration correcte via `next/font`. Self-hosted apres build (pas de CDN externe). Subset `latin` uniquement. Lissage (`antialiased`, `optimizeLegibility`) active.

**Note** : 4 families de fonts avec 13 weight variants au total. Orbitron (2 weights) est utilise uniquement pour `.bcn-label`. Impact potentiel sur le temps de chargement initial.

---

## 6. Service Worker (Serwist)

### Strategies de cache runtime

| Ressource | Strategie | Cache Name | Max Entries | TTL |
|-----------|-----------|------------|-------------|-----|
| `/_next/static/` | **StaleWhileRevalidate** | `next-static` | 64 | 30 jours |
| Fonts (`destination: font`) | CacheFirst | `fonts` | 24 | 365 jours |
| Icons (favicon, apple-touch) | CacheFirst | `icons` | 12 | 365 jours |
| Images (`destination: image`) | StaleWhileRevalidate | `images` | 120 | 7 jours |
| Pages essentielles (HTML) | NetworkFirst (3s timeout) | `pages-essential` | - | - |
| Autres pages (HTML) | NetworkFirst (3s timeout) | `pages-fallback` | - | - |

### Precache

- `/offline` (versionne par commit SHA)
- `__SW_MANIFEST` (assets build Next.js)

### Verification `/_next/static/`

**Strategie actuelle** : `StaleWhileRevalidate` -- **CONFORME** a la recommandation du CLAUDE.md.

Le service worker purge TOUS les caches runtime a l'activation (sauf precache), forcant un refresh des assets CSS/JS apres mise a jour.

### Points d'attention

- **Images** : `maxEntries: 120` pour ~270 exercices potentiels (90 slugs x 3 locales). Risque d'eviction prematuree du cache pour les utilisateurs actifs.
- **Videos** : Pas de strategie dediee -- les videos sont traitees comme les images (7 jours SWR).
- **pages-fallback** : Pas de `ExpirationPlugin` (compense par la purge a l'activation).

---

## 7. PROBLEMES IDENTIFIES

Classes par impact estime (Critique > Eleve > Moyen > Faible).

### Eleve

#### P1. Aucune route en SSG -- Tout est SSR
**Impact** : Chaque page est rendue cote serveur a chaque requete. Pas de cache CDN Vercel possible.
**Cause** : `getServerLang()` lit le cookie `eps_lang` via `cookies()`, ce qui force le rendering dynamique de TOUTES les pages.
**Estimation** : Affecte le TTFB de toutes les pages. Sur Vercel, les pages SSR ont un TTFB de 200-800ms vs <50ms pour les pages SSG/ISR servies depuis le edge cache.

#### P2. `react-markdown` + `remark-gfm` dans le bundle initial (42.6 KB gzip)
**Impact** : 42.6 KB charges sur TOUTES les pages, meme celles qui n'affichent pas de MDX.
**Cause** : Le chunk `439-*.js` contenant `react-markdown`, `unified`, `micromark`, `remark-gfm` est marque comme initial.
**Pages concernees** : Seules les pages detail (`/exercices/[slug]`, `/methodes/[slug]`, `/apprendre/[slug]`, `/bac/[slug]`) utilisent le rendu MDX client.

#### P3. `@supabase/supabase-js` complet dans le bundle initial (49.4 KB gzip)
**Impact** : 49.4 KB charges sur TOUTES les pages.
**Cause** : Le SDK complet (auth, storage, functions, postgrest, realtime) est bundle, alors que seuls realtime et postgrest sont utilises.
**Note** : Supabase JS ne propose pas encore de tree-shaking granulaire par module.

### Moyen

#### P4. `@react-three/postprocessing` -- dependance inutilisee
**Impact** : Presente dans `package.json` mais jamais importee. Peut influer sur le temps d'install et la taille de `node_modules`.
**Taille** : Non incluse dans le bundle client (tree-shaking OK), mais surcharge npm.

#### P5. Carnet.tsx utilise `<img>` natif au lieu de `next/image` (3 instances)
**Impact** : Les thumbnails dans le carnet ne beneficient pas de l'optimisation d'images Next.js (redimensionnement, format, lazy loading natif).
**Fichier** : `src/app/outils/carnet/Carnet.tsx` lignes 132, 252, 486.

#### P6. Cache images SW sous-dimensionne (120 max pour ~270+ images)
**Impact** : Eviction prematuree des thumbnails caches pour les utilisateurs qui parcourent beaucoup d'exercices. Re-telechargements inutiles en mode hors-ligne.

### Faible

#### P7. Orbitron charge pour un seul usage (`.bcn-label`)
**Impact** : 2 weights d'une font entiere pour un usage unique dans les labels BAC.
**Taille estimee** : ~15-25 KB supplementaires de font data.

#### P8. `sizes` manquant sur certaines instances de `next/image`
**Impact** : Le navigateur ne peut pas choisir la taille optimale de l'image responsive.
**Fichiers** : `HeroMedia.tsx` (fallback et lightbox), `TopBar.tsx` (logo 24px).

#### P9. Videos exercices non cachees avec strategie dediee
**Impact** : Les videos (.webm, .mp4) partagent la strategie images (7j TTL, 120 max entries). Sous-optimal pour des fichiers volumineux et stables.

---

## 8. RECOMMANDATIONS

Classees par ratio impact/effort.

### Quick Wins (effort faible, impact significatif)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| R1 | Supprimer `@react-three/postprocessing` de `package.json` | Nettoyage deps | 1 min |
| R2 | Migrer les 3 `<img>` de `Carnet.tsx` vers `next/image` | Optimisation images carnet | 15 min |
| R3 | Ajouter `sizes` manquants sur `HeroMedia.tsx` (fallback + lightbox) | Optimisation images | 10 min |
| R4 | Augmenter `maxEntries` images dans SW de 120 a 256 | Meilleur cache offline | 2 min |

### Optimisations moyennes (effort modere, impact eleve)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| R5 | Lazy-loader `react-markdown` via `next/dynamic` sur les pages detail uniquement | **-42.6 KB sur le bundle initial** | 1-2h |
| R6 | Ajouter une strategie SW dediee pour les videos (`CacheFirst`, 30j TTL) | Cache offline video optimise | 30 min |

### Optimisations structurelles (effort eleve, impact eleve)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| R7 | Refactorer l'i18n pour ne plus lire `cookies()` dans les pages (utiliser un middleware qui redirige ou un segment dynamique `[locale]`) | **Debloquer le SSG/ISR pour toutes les pages** -- gain TTFB majeur | 1-2 jours |
| R8 | Evaluer un remplacement de `@supabase/supabase-js` par des appels REST directs pour postgrest + realtime (ou attendre le tree-shaking officiel) | -49.4 KB bundle initial | 1-2 jours |

### Non recommande pour l'instant

| Action | Raison |
|--------|--------|
| Remplacer `react-markdown` par du rendu serveur-only | Les pages detail necessitent du rendu MDX client pour le live sync enseignant |
| Supprimer les font weights inutilises | Risque de regression visuelle, gain marginal |
| Forcer CacheFirst sur `/_next/static/` | Le SWR actuel avec purge a l'activation est le pattern correct |

---

## Annexe : Detail des chunks initiaux

Total initial : **468 KB gzip**

| Chunk | Gzip | Contenu |
|-------|------|---------|
| `react-dom-client.production.js` | 60.9 KB | React DOM |
| `framework-*.js` | 58.3 KB | Next.js framework |
| `3139-*.js` | 51.1 KB | Next.js client + Serwist window |
| `1958-*.js` | 49.4 KB | Supabase JS SDK complet |
| `439-*.js` | 42.6 KB | react-markdown + remark-gfm + unified |
| `main-*.js` | 39.0 KB | Next.js main entry |
| `7167-*.js` | 24.6 KB | i18n (dictionnaires trilingues) |
| `exercices/[slug]/page-*.js` | 23.6 KB | Page detail exercice |
| `exercices/page-*.js` | 8.9 KB | Page liste exercices |
| `layout-*.js` | 8.2 KB | Layout root |
| Autres chunks initiaux | ~101 KB | Pages + composants divers |
