---
name: timers-chrono
description: >
  Architecture et conventions des timers/chronos de Tazieff EPS :
  Tabata, EMOM, Circuit, AMRAP, Repos, Perso. Utiliser cette skill
  dès qu'on mentionne timer, chrono, chronométre, countdown, wheel
  picker, anneau circulaire, Wake Lock, vibration, bip sonore,
  temps de repos, EMOM, AMRAP, Tabata, circuit training, ou toute
  modification des pages /outils/timer/. Aussi quand on crée un
  nouveau type de timer ou qu'on modifie le composant WheelPicker.
  Les timers ont une architecture spécifique (single page, anneau
  SVG, phases colorées) — ne pas improviser.
---

# Timers / Chronos — Tazieff EPS

## Route et structure

```
src/app/[locale]/outils/timer/
├── page.tsx           ← Grille de sélection (6 cartes colorées)
├── tabata/page.tsx
├── emom/page.tsx
├── circuit/page.tsx
├── amrap/page.tsx
├── repos/page.tsx
└── perso/page.tsx
```

Composants partagés dans `src/components/tools/` :
- `WheelPicker.tsx` — sélecteur rotatif (réutilisé depuis le calculateur 1RM)
- Composants timer spécifiques à chaque mode

## Principe architectural : Design D (layout sur mesure)

Chaque timer a son propre layout adapté à son usage. PAS de layout
générique partagé avec options cachées dans un tiroir.

Raison : un élève qui tape "Repos" veut juste choisir une durée,
pas configurer 6 paramètres. Un élève qui tape "Circuit" a besoin
de stations + tours + travail + repos.

## Les 6 timers

### Tabata (vert #22c55e)
- Pickers : Travail (s) × Repos (s) × Rounds × Repos série
- Défauts : 20s / 10s / 8 rounds / 2mn repos série
- Repos série : 0, 30s, 1mn, 2mn, 3mn, 4mn, 5mn (formatLabel custom pour affichage mixte s/mn)
- Phases alternées travail/repos avec repos inter-série optionnel
- Classique Tabata = 4 min total (hors repos série)

### EMOM (cyan #06b6d4)
- Pickers : Durée par minute (s) × Minutes totales
- Le temps restant dans la minute = repos automatique
- Affiche round en cours "Round 3/10"

### Circuit (orange #f97316)
- Pickers : Travail (s) × Repos (s) × Stations × Tours
- Plus complexe — 4 pickers
- Enchaînement : station 1 → repos → station 2 → ... → tour suivant

### AMRAP (rouge #ef4444)
- Picker : Durée totale uniquement (un seul picker)
- Chrono décompteur
- Compteur de rounds manuel (+/-)
- Intensité maximale, pas de phases travail/repos

### Repos (cyan #0891b2)
- Picker : Durée + presets rapides (30s, 1min, 2min, 5min)
- Le plus simple — chrono entre les séries
- Usage le plus fréquent en salle

### Perso (violet #7c3aed)
- Pickers : Travail × Repos × Séries
- L'élève configure tout librement
- Pour les méthodes hors catégories standard

## Architecture single page — 3 états

Chaque timer est UNE SEULE PAGE avec transition entre 3 états :

### État 1 — Configuration
- Banner coloré en dégradé (couleur du timer)
- Carte avec WheelPickers côte à côte
- Durée totale calculée en temps réel
- Bouton DÉMARRER (dégradé couleur du timer)

### État 2 — Countdown en cours
- La config disparaît
- Anneau circulaire SVG (voir section dédiée)
- Le banner change de couleur selon la phase (travail=vert / repos=rouge)
- Boutons : Stop (rouge) / Pause-Play (central, change de couleur) / Skip
- Transition fluide de couleur entre phases

### État 3 — Terminé
- Retour automatique à l'état 1

Pas de navigation entre config et exécution — tout sur la même page.

## Anneau circulaire SVG (countdown)

L'anneau remplace les simples chiffres ou barres linéaires.

Structure :
- **Fond de l'anneau** : segments alternés travail (vert) / repos (rouge)
  en faible opacité — montre la structure complète des rounds
- **Arc actif** : trait épais qui progresse dans le sens horaire,
  vert pendant travail, rouge pendant repos, avance chaque seconde
- **Centre** : temps de la phase en cours en gros + temps total restant
  en petit dessous
- **Barre linéaire en bas** : phases passées saturées, phase en cours
  pulse, futures atténuées

Les couleurs de l'arc, du banner et du bouton central changent
SIMULTANÉMENT avec une transition fluide quand on passe de
TRAVAIL à REPOS.

## WheelPicker — Spécifications

Composant réutilisable (aussi utilisé par le calculateur 1RM).

```typescript
interface WheelPickerProps {
  values: number[];
  defaultValue: number;
  unit?: string;          // "s", "min", "kg", "" — défaut "s"
  color?: string;         // couleur accent hex — défaut "#22c55e"
  onChange: (value: number) => void;
  height?: number;        // défaut 120px
  itemHeight?: number;    // défaut 40px
  label?: string;         // label au-dessus du picker
  formatLabel?: (value: number) => { main: string; unit?: string };
  // formatLabel remplace l'affichage par défaut "{value}{unit}"
  // Utilisé par Tabata repos série pour affichage mixte s/mn
}
```

Comportement :
- Scroll snap natif CSS (`scroll-snap-type: y mandatory`)
- 3 éléments visibles : centre (gros, opaque) + 2 adjacents (petits, transparents)
- Effet highlight : le centre est scale(1) opacity(1), les voisins
  scale(0.9) opacity(0.3), le reste scale(0.8) opacity(0.1)
- Padding haut et bas pour permettre le scroll au premier/dernier élément
- Font monospace pour les chiffres (alignement)

## Audio et vibration

### Sons
- Bip court au changement de phase (travail → repos, repos → travail)
- Bip long / triple bip à la fin du timer
- Bips de countdown dans les 3 dernières secondes de chaque phase

### Vibration (mobile)
Utiliser `hapticFeedback()` de `@/lib/audio/beep` — PAS `navigator.vibrate` directement.
Android : vibration native. iOS Safari : fallback audio (thump basse fréquence 60 Hz).
Intégré dans `TimerContext.tsx` :
```typescript
import { hapticFeedback } from '@/lib/audio/beep';
// Changement de phase (travail → repos, repos → travail)
hapticFeedback('double');
// Fin du timer
hapticFeedback('heavy');
// Countdown 3-2-1
hapticFeedback('tap');
// Skip
hapticFeedback('tap');
```

### Wake Lock
CRITIQUE : l'écran ne doit JAMAIS s'éteindre pendant un timer.
```typescript
let wakeLock: WakeLockSentinel | null = null;
// Au démarrage du timer
wakeLock = await navigator.wakeLock?.request('screen');
// À l'arrêt
wakeLock?.release();
```

Ne PAS casser le système audio/vibration/Wake Lock lors des
modifications visuelles. Le refonte est visuelle, pas fonctionnelle.

## UX mobile en salle de sport

- Chiffres GROS — lisibles à 2 mètres (téléphone posé au sol)
- Boutons LARGES — utilisables avec les mains moites/occupées
- Fond qui change de couleur = signal visible même en vision périphérique
- 100% client-side, pas de Supabase
- Fonctionne offline (PWA)

## Intégration avec les méthodes

Les fiches méthodes EMOM et AMRAP ont un champ `timer: true` dans
le frontmatter. Un lien "Lancer le timer" apparaît dans la fiche
et redirige vers le timer correspondant.
