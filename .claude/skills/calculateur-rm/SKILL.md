---
name: calculateur-rm
description: >
  Calculateur de Répétition Maximale (1RM) de Tazieff EPS : formules
  Epley/Brzycki, sliders colorés, wheel picker zones de travail,
  pourcentages de charge. Utiliser cette skill dès qu'on mentionne
  calculateur, 1RM, RM, charge maximale, Epley, Brzycki, zones de
  travail, pourcentage de charge, slider charge, ou toute modification
  de la page /outils/calculateur-rm/. Aussi pour tout composant qui
  calcule ou affiche des charges d'entraînement dérivées du 1RM.
---

# Calculateur 1RM — Tazieff EPS

## Route

`src/app/[locale]/outils/calculateur-rm/`

Composant principal : `src/components/tools/RMCalculator.tsx`
Client component ("use client").

## Formules de calcul

### Epley (standard EPS)
```
1RM = charge × (1 + reps / 30)
```

### Brzycki (alternative)
```
1RM = charge × 36 / (37 - reps)
```

### Règles d'affichage
- Valeur affichée = **moyenne des deux**, arrondie à l'entier
- Si reps = 1 → 1RM = charge directement (pas de calcul)
- Si reps ≥ 37 → utiliser seulement Epley (Brzycki donne division
  par zéro ou résultat négatif)
- Toujours afficher les deux résultats séparément sous le résultat
  principal (Epley: X kg / Brzycki: Y kg)

## Section 1 — Sliders d'entrée

### Slider Charge (cyan #00E5FF)
- Range : 5 à 200 kg, step 1
- Valeur en gros à droite du label (font-mono, 28px, cyan-400)
- Track bicolore en JS : partie gauche `rgba(0,229,255,0.35)`,
  partie droite `rgba(255,255,255,0.06)`
- Labels min/max : "5 kg" et "200 kg"

### Slider Répétitions (magenta #FF006E)
- Range : 1 à 30, step 1
- Track : partie gauche `rgba(255,0,110,0.35)`
- Labels : "1 rep" et "30 reps"

### Container sliders
- bg `rgba(0,229,255,0.04)`, border `rgba(0,229,255,0.08)`,
  rounded-2xl, p-5, gap-6 entre les deux sliders

### Mise à jour du track coloré (pattern JS)
```typescript
// Recalculer le gradient à chaque changement de valeur
const pct = ((value - min) / (max - min)) * 100;
slider.style.background = `linear-gradient(90deg,
  rgba(R,G,B,0.35) ${pct}%,
  rgba(255,255,255,0.06) ${pct}%)`;
```

## Section 2 — Résultat 1RM

- "TON 1RM ESTIMÉ" : tracking-widest, text-zinc-500, 11px
- Valeur : font-mono, 52px, text-zinc-100 + "kg" en 18px
- Epley et Brzycki en dessous, côte à côte, séparateur vertical
- Container : bg-white/[0.02], border white/[0.06], rounded-2xl

## Section 3 — Zones de travail (Wheel Picker)

### Architecture
Remplace le tableau statique. Un **WheelPicker vertical** (même
composant que les timers) scrollable de 100% à 30%, step 5%.

Pour chaque palier affiché, 3 cartes empilées :
- Carte du DESSUS : palier - 5% (estompée)
- Carte du MILIEU : palier sélectionné (fond teinté, mise en avant)
- Carte du DESSOUS : palier + 5% (estompée)

### Aux bornes
- À 30% : carte du dessus disparaît (pas de 25%)
- À 100% : carte du dessous disparaît (pas de 105%)

### Contenu de chaque carte
- Pourcentage (ex: "75%")
- Charge calculée (ex: "60 kg" = 1RM × 75%)
- Objectif associé selon les zones NSCA :
  - 100-90% → Force maximale (orange)
  - 85-75% → Hypertrophie / Volume (bleu)
  - 70-50% → Endurance musculaire (vert)
  - 45-30% → Échauffement / Récupération (gris)

### Zones de travail rapides (toujours visibles)
3 cartes résumé colorées sous le picker :
- Endurance (vert) : 50-70% du 1RM → charge X-Y kg
- Volume (bleu) : 65-80% → charge X-Y kg
- Puissance (orange) : 80-95% → charge X-Y kg

## Warning sécurité

Toujours visible en ambre sous les zones :
"Le 1RM est une estimation. Ne jamais tenter une charge maximale
seul et sans parade."

## Liens

Chips liens vers les pages :
- /apprendre/rm-rir-rpe (théorie RM/RIR/RPE)
- /apprendre/connaissances (types de contraction, principes)

## Tout est client-side

Zéro Supabase, zéro API. Calcul instantané, fonctionne offline.
