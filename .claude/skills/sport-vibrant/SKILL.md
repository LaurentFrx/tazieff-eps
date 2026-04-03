---
name: sport-vibrant
description: >
  Design system "Sport Vibrant" de Tazieff EPS. Utiliser cette skill
  dès qu'on crée ou modifie un composant UI, un style, une couleur,
  une animation, une typographie, ou tout élément visuel de l'app.
  Aussi quand on mentionne palette, gradient, glow, dark mode,
  Tailwind, Bebas Neue, DM Sans, thème sombre, ou design system.
  Utiliser même pour des modifications CSS mineures — la cohérence
  visuelle est critique pour l'identité de l'app.
user-invocable: false
---

# Design System "Sport Vibrant" — Tazieff EPS

## Identité visuelle

L'app cible des lycéens en salle de musculation. Le design s'inspire
des apps fitness premium (Apple Fitness+, Nike Training Club) avec une
esthétique sombre, des couleurs saturées et des effets lumineux.

Niveau d'ambition : iOS native quality.

## Palette de couleurs

### Couleurs principales
| Nom | Hex | Usage |
|---|---|---|
| Cyan | `#00E5FF` | Accents interactifs, liens, highlights |
| Magenta | `#FF006E` | CTA, alertes, badges |
| Violet | `#7B2FFF` | Gradients, headers secondaires |
| Background | `#04040A` | Fond principal (quasi-noir) |

### Accents et gradients
- Orange/Rose : accents chauds, boutons d'action
- Gradients saturés : cyan→violet, magenta→orange
- Glow effects : `box-shadow` avec couleurs de la palette + blur

### Règle d'or
Le fond est TOUJOURS sombre. Le contenu est TOUJOURS lumineux.
Jamais de fond clair, jamais de texte sombre sur fond clair.

## Typographie

| Police | Usage | Import |
|---|---|---|
| Bebas Neue | Titres, headers, badges | Google Fonts |
| DM Sans | Corps de texte, UI | Google Fonts |
| JetBrains Mono | Code, données techniques | Google Fonts |

Hiérarchie : Bebas pour impact visuel, DM Sans pour lisibilité,
JetBrains Mono pour les chiffres et données.

## Tailwind CSS v4 — Dark mode

Configuration critique (apprise par l'expérience) :

```css
/* CORRECT pour Tailwind v4 */
@custom-variant dark (&:where(.dark, .dark *));

/* INCORRECT — ne fonctionne pas en Tailwind v4 */
@media (prefers-color-scheme: dark) { ... }
```

L'app est en dark mode permanent — la variante `dark:` est toujours
active. Ne jamais créer de mode clair.

## Composants UI — Principes

### Touch targets
Minimum 44×44px pour tous les éléments interactifs (boutons, liens,
filtres). Les lycéens utilisent l'app entre deux séries, debout,
en salle — les cibles doivent être généreuses.

### Contraste
WCAG AA minimum. Texte blanc/gris clair sur fond sombre. Les couleurs
accent (cyan, magenta) sont assez lumineuses pour être lisibles sur
`#04040A`.

### Cards et containers
- Fond légèrement plus clair que le background (`rgba(255,255,255,0.05)`)
- Bordure subtile (`rgba(255,255,255,0.1)`)
- Border-radius : `rounded-xl` (12px) ou `rounded-2xl` (16px)
- Hover : glow subtil ou scale légère

### Animations
- Transitions : `transition-all duration-300 ease-out`
- Hover : scale(1.02) + glow subtil
- Pas d'animations longues qui bloquent l'interaction
- `prefers-reduced-motion` : respecter les préférences système
- Le glow utilise `mix-blend-mode: screen` sur fonds sombres

## Filtres et chips

- Chips horizontales (scroll horizontal sur mobile)
- État actif : fond coloré (cyan ou magenta) + texte blanc
- État inactif : fond transparent + bordure subtile + texte gris
- Pas de dropdown pour les filtres principaux

## Grilles d'exercices

- Mode grille : cards carrées avec thumbnail, titre tronqué, badge level
- Mode liste : rangées avec thumb169, titre complet, sous-info muscles+level
- Tri par session (S1-S7) en grille/liste

## Icônes

Préférer les icônes SVG inline ou un set cohérent (Lucide, Heroicons).
Pas de mix entre sets d'icônes différents.
