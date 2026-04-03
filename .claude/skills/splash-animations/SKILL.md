---
name: splash-animations
description: >
  Patterns d'animation avancés de Tazieff EPS : splash screen IIFE,
  hydration safety, animations CSS complexes. Utiliser cette skill
  dès qu'on mentionne splash screen, écran de démarrage, animation
  de chargement, IIFE, suppressHydrationWarning, sessionStorage
  anti-replay, mix-blend-mode, film grain, ou toute animation qui
  s'exécute avant l'hydratation React. Aussi pour les patterns
  d'animation qui impliquent du contenu client-only ou time-based.
disable-model-invocation: true
---

# Splash screen & animations avancées — Tazieff EPS

## Splash screen — Architecture

Le splash screen est un script IIFE (Immediately Invoked Function
Expression) injecté directement dans le `<head>` du root `layout.tsx`,
AVANT l'hydratation React.

### Pourquoi cette architecture
- Le splash doit apparaître INSTANTANÉMENT au chargement
- React n'est pas encore hydraté → pas de JSX possible
- Le script crée les éléments DOM dynamiquement en vanilla JS/CSS

### Fichier source
Le IIFE vit dans `public/splash.js` (fichier externe), chargé via
`<script src="/splash.js" />` dans le `<head>` de `src/app/layout.tsx`.

C'est un FICHIER PROTÉGÉ — ne jamais modifier le splash sans
demande explicite.

### Anti-replay
```javascript
// Le splash ne joue qu'une fois par session navigateur
if (sessionStorage.getItem('splash_shown')) return;
sessionStorage.setItem('splash_shown', '1');
```

`sessionStorage` (pas `localStorage`) : le splash rejoue si on
ferme et rouvre l'onglet, mais pas à chaque navigation interne.

## Hydratation React — Pièges à éviter

### suppressHydrationWarning
Le root `layout.tsx` utilise `suppressHydrationWarning` sur `<html>`
et `<body>` car le splash IIFE modifie le DOM avant React.

```tsx
<html suppressHydrationWarning>
  <body suppressHydrationWarning>
```

### Contenu time-based ou client-only
Tout contenu qui dépend de :
- L'heure (salutations "Bonjour"/"Bonsoir")
- `window` / `document`
- `localStorage` / `sessionStorage`
- La taille de l'écran

DOIT utiliser `useEffect` pour éviter le mismatch server/client
(erreur React #418).

```tsx
// CORRECT
const [greeting, setGreeting] = useState('');
useEffect(() => {
  const hour = new Date().getHours();
  setGreeting(hour < 18 ? 'Bonjour' : 'Bonsoir');
}, []);

// INTERDIT — cause hydration mismatch
const hour = new Date().getHours();
const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';
```

## Effets visuels du splash

### Éléments
1. Mannequin Vitruvien (PNG `public/images/anatomy/mini-mannequin.webp`)
2. Ligne de scan cyan (animation verticale descendante)
3. Effet film grain (bruit visuel subtil)
4. Typographie séquencée (apparition lettre par lettre ou mot par mot)

### Techniques CSS
- `mix-blend-mode: screen` sur les éléments lumineux (scan line, glow)
  Fonctionne car le fond est sombre — `screen` additionne les lumières
- Film grain : pseudo-élément avec `background-image` noise ou
  animation CSS de points aléatoires
- Scan line : `@keyframes` vertical translate + glow cyan

### Performance
- Tout en CSS/vanilla JS — zéro dépendance externe
- Les animations utilisent `transform` et `opacity` uniquement
  (GPU-accelerated, pas de layout thrash)
- Durée totale < 3 secondes
- Le splash se retire proprement (opacity fade out + `display: none`)

## Pattern général pour animations complexes

1. Vérifier si c'est pré-hydratation → IIFE dans `<head>` (fichier externe dans `public/`)
2. Vérifier si c'est client-only → `useEffect` + state
3. Vérifier si c'est une préférence persistante → `localStorage`
4. Vérifier `prefers-reduced-motion` → skip si activé
5. Toujours animer avec `transform`/`opacity` (pas `top`/`left`/`width`)

## Settings toggle pattern

Les animations optionnelles (scan 3D, splash) suivent ce pattern :

```typescript
// Lecture
const enabled = localStorage.getItem('eps_anatomy_anim') !== 'false';

// Toggle dans les settings
localStorage.setItem('eps_anatomy_anim', String(!enabled));
```

Clé de convention : préfixe `eps_` pour toutes les clés localStorage
de l'app.
