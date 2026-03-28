---
name: tazieff-design
description: Design system and UI guidelines for Tazieff EPS musculation app. Activate when building or modifying any UI component, page, or layout in this Next.js PWA for French high school students.
---

# Tazieff EPS — Design System "Sport Vibrant"

App de musculation pour lycéens (15-18 ans) au Lycée Haroun Tazieff, Saint-Paul-lès-Dax.
Stack : Next.js, React, TypeScript, Tailwind CSS v4, MDX.

## Identité visuelle

### Philosophie
L'esthétique doit rivaliser avec les apps fitness que les ados utilisent (Nike Training Club, Hevy, Strong). Jamais infantilisant, jamais scolaire. Professionnel, énergique, moderne. L'interface doit fonctionner en salle de sport : luminosité variable, doigts humides, attention limitée entre deux séries.

### Palette couleur par section
- Exercices : orange (gradient from-orange-500 to-amber-500)
- Méthodes : bleu (gradient from-blue-500 to-cyan-500)
- Apprendre : vert (gradient from-emerald-500 to-teal-500)
- BAC : violet (gradient from-violet-500 to-purple-500)
- Outils : rose/pink (gradient from-pink-500 to-rose-500)

### Thème
- Mode sombre par défaut (dark backgrounds)
- Fond principal : slate-950 / zinc-950
- Accents : orange-500, rose-500 pour les éléments d'action
- Effets glow sur les éléments interactifs importants
- Gradients saturés, jamais pastel

### Tailwind v4 — Règle critique
Dark mode utilise un custom variant, PAS prefers-color-scheme :
@custom-variant dark (&:where(.dark, .dark *));
Toujours utiliser les classes dark: avec cette convention.

### Typographie
- Police sans-serif moderne, lisible sur mobile en mouvement
- Titres : bold, tailles généreuses (text-2xl minimum sur mobile)
- Corps : text-base minimum pour lisibilité en salle de sport
- Contraste élevé obligatoire (texte blanc/clair sur fond sombre)

## Composants — Conventions

### Cards exercices
- Grid view : image carrée thumb-{slug}.webp, titre, badge niveau
- List view : image 16:9 thumb169-{slug}.webp, titre complet, sous-info (muscle + niveau)
- Coins arrondis (rounded-xl minimum)
- Ombre ou bordure subtile pour la profondeur
- Hover/tap : scale légère ou glow

### SectionHero (réutilisable)
Chaque section-index utilise un hero compact avec :
- Titre + icône de section
- Compteur de résultats
- Gradient de fond correspondant à la section

### Filtres
- Chips horizontaux scrollables (pas de dropdown)
- Style : pills avec fond semi-transparent, texte clair
- Chip actif : fond plein avec la couleur de section
- Scroll horizontal sans scrollbar visible

### Badges niveau
- Débutant : vert
- Intermédiaire : orange/jaune
- Avancé : rouge/rose

### Boutons d'action
- Primaire : gradient orange-to-rose, rounded-full, shadow-lg
- Secondaire : bordure + fond transparent
- Cibles tactiles : minimum 44x44px (usage en salle, doigts gantés/humides)

## Layout — Règles

### Mobile first (priorité absolue)
- L'app est consultée à 95% sur smartphone en salle de sport
- 2 colonnes grid sur mobile, 3-4 sur desktop
- Bottom tab bar fixe sur mobile
- Pas de menus déroulants complexes — boutons d'action directs

### Règle des 2 taps
Tout contenu principal (exercice, méthode) accessible en maximum 2 taps depuis l'accueil.

### Scroll et performance
- Pas de long scroll monolithique — découper en sous-pages
- Lazy loading des images
- Transitions fluides et ambitieuses (voir section Animations)

## Animations — Principes

### Philosophie
L'app doit IMPRESSIONNER au premier lancement. Les animations sont un facteur de crédibilité auprès des ados — elles différencient une app pro d'un projet scolaire. Viser le niveau qualitatif des apps iOS natives (Apple Fitness+, Nike Training Club).

### Encouragé
- Transitions de page fluides avec spring physics (ease, bounce, elastic)
- Hero animations entre la liste et la page détail (shared element transition)
- Staggered reveals orchestrés au chargement des listes de cards
- Parallax subtil sur les hero banners (performant avec transform: translate3d)
- Scroll-triggered animations (éléments qui apparaissent au scroll)
- Micro-interactions riches : hover glow, tap feedback, swipe gestures
- Animations SVG (icônes animées, illustrations qui prennent vie)
- Skeleton shimmer loading avec gradient animé
- Smooth morph entre états (filtres actifs/inactifs, toggle views grid/list)
- Motion sur le mannequin 3D (rotation fluide, highlights progressifs)

### Règles techniques
- Utiliser exclusivement transform et opacity pour les animations fréquentes (GPU-accelerated)
- will-change sur les éléments animés complexes
- Respecter prefers-reduced-motion pour l'accessibilité
- Durées typiques : micro-interactions 150-300ms, transitions de page 300-500ms, reveals au scroll 400-800ms, animations décoratives jusqu'à 1500ms
- Framer Motion / CSS animations selon le contexte

### À éviter
- Animations qui BLOQUENT l'interaction (l'utilisateur doit pouvoir tapper pendant l'animation)
- Jank visible (frame drops sous 60fps)
- Animations identiques partout (varier les effets selon le contexte)

## Anti-patterns — Ne JAMAIS faire
- Inter, Roboto, Arial, system-ui comme font principale
- Gradient violet sur fond blanc (signature AI slop)
- Cards plates sans profondeur ni hiérarchie
- Texte gris clair sur fond gris (contraste insuffisant en salle)
- Boutons < 44px (inutilisables avec doigts humides)
- Dropdowns pour les filtres (préférer chips)
- Design infantilisant (badges emoji, couleurs bonbon)
- Design scolaire/institutionnel (Moodle-like)

## Médias — Conventions de nommage
Tous dans /public/images/exos/ :
- Grid view : thumb-{slug}.webp
- List view : thumb169-{slug}.webp
- Detail page : priorité 1 {slug}.webm (fallback .mp4), priorité 2 {slug}.webp

## Contexte d'usage
Les utilisateurs consultent l'app entre deux séries de musculation (10-90 secondes de repos), debout, téléphone dans une main, éclairage artificiel de gymnase. Chaque décision de design doit passer ce test : "Est-ce utilisable en 3 secondes, debout, une main, entre deux séries ?"
