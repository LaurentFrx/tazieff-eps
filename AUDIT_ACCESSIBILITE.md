# Audit Accessibilite -- Contraste & Cibles tactiles

Date : 2026-04-05

Contexte : application consultee sur smartphone EN SALLE DE SPORT, entre deux series d'exercices (5-15 secondes d'attention, mains potentiellement moites/gantees, eclairage variable).

---

## 1. Violations de contraste (WCAG 2.1 AA)

Seuils : ratio >= 4.5:1 texte normal (< 18px bold ou < 24px), >= 3:1 gros texte (>= 18px bold ou >= 24px).

Couleurs de reference en dark mode :
- Fond page : `#0b1020` (luminance ~0.003)
- `--ink` : `#f8fafc` (luminance ~0.97)
- `--muted` : `#c4d0ee` (luminance ~0.53)

### Violations critiques (ratio < 3:1)

| Fichier | Ligne(s) | Element | Couleur texte | Couleur fond | Ratio | Seuil | Severite |
|---------|----------|---------|---------------|--------------|-------|-------|----------|
| `timer/presets/CircuitTimer.tsx` | 122 | Label "Duree totale" | `white/35` (~#595959) | `#0b1020` | **2.07:1** | 4.5:1 | CRITIQUE |
| `timer/presets/TabataTimer.tsx` | 128 | Label "Duree totale" | `white/35` (~#595959) | `#0b1020` | **2.07:1** | 4.5:1 | CRITIQUE |
| `timer/presets/CustomTimer.tsx` | 171 | Label "Duree totale" | `white/35` (~#595959) | `#0b1020` | **2.07:1** | 4.5:1 | CRITIQUE |
| `timer/presets/EmomTimer.tsx` | 81 | Label "Duree totale" | `white/35` (~#595959) | `#0b1020` | **2.07:1** | 4.5:1 | CRITIQUE |
| `tools/CountdownWheels.tsx` | 114 | Labels "min"/"sec" | `white/30` (~#4D4D4D) | `#0b1020` | **1.78:1** | 4.5:1 | CRITIQUE |
| `tools/WheelPicker.tsx` | 205 | Label unite | `white/40` (~#666666) | fond sombre | **2.45:1** | 4.5:1 | CRITIQUE |
| `timer/presets/CircuitTimer.tsx` | 106, 116 | Separateurs "\|" et "x" | `zinc-700` (#3f3f46) | `#0b1020` | **1.66:1** | 4.5:1 | CRITIQUE |
| `timer/presets/TabataTimer.tsx` | 118-122 | Separateurs "\|", "x", "\|" | `zinc-700` (#3f3f46) | `#0b1020` | **1.66:1** | 4.5:1 | CRITIQUE |
| `timer/presets/EmomTimer.tsx` | 75 | Separateur "x" | `zinc-700` (#3f3f46) | `#0b1020` | **1.66:1** | 4.5:1 | CRITIQUE |
| `HomepageClient.tsx` | 157 | Description carte exercices | `white/70` (~#B2B2B2) | gradient orange | **1.68:1** | 4.5:1 | CRITIQUE |
| `HomepageClient.tsx` | 171 | Description carte methodes | `white/70` (~#B2B2B2) | gradient violet | **2.12:1** | 4.5:1 | CRITIQUE |
| `HomepageClient.tsx` | 185 | Description carte apprendre | `white/70` (~#B2B2B2) | gradient vert | **1.85:1** | 4.5:1 | CRITIQUE |
| `HomepageClient.tsx` | 199 | Description carte BAC | `white/70` (~#B2B2B2) | gradient rose | **1.92:1** | 4.5:1 | CRITIQUE |

### Violations majeures (ratio 3:1 - 4.5:1 sur texte normal)

| Fichier | Ligne(s) | Element | Couleur texte | Couleur fond | Ratio | Seuil | Severite |
|---------|----------|---------|---------------|--------------|-------|-------|----------|
| `timer/presets/CircuitTimer.tsx` | 100 | Label WheelPicker inline | `#f97316` (orange) | conteneur sombre | **4.55:1** | 4.5:1 | MARGINAL |
| `timer/presets/CircuitTimer.tsx` | 102 | Label WheelPicker inline | `#ef4444` (rouge) | conteneur sombre | **3.86:1** | 4.5:1 | MAJEUR |
| `timer/presets/CircuitTimer.tsx` | 112 | Label WheelPicker inline | `#8b5cf6` (violet) | conteneur sombre | **3.28:1** | 4.5:1 | MAJEUR |
| `tools/CountdownRing.tsx` | 123 | Label sous anneau | `white/35` | `#0b1020` | **2.07:1** | 4.5:1 | CRITIQUE |

### Patterns acceptables mais a surveiller

| Pattern | Ratio | Verdict |
|---------|-------|---------|
| `text-white/70` sur `#0b1020` | 4.94:1 | PASSE (marginal) |
| `text-zinc-400` sur `#0b1020` | 5.93:1 | PASSE |
| `var(--muted)` sur `#0b1020` | 6.61:1 | PASSE |
| `cyan-400` sur `zinc-900/80` (18px+) | 3.68:1 | PASSE (gros texte) |

---

## 2. Cibles tactiles sous-dimensionnees

Minimum WCAG 2.5.5 : 44x44px. Recommande contexte sport : 48x48px.

### Violations critiques (< 44px)

| Fichier | Ligne(s) | Element | Taille actuelle | Taille requise |
|---------|----------|---------|-----------------|----------------|
| `InstallPwaBanner.tsx` | 102 | Bouton fermer PWA banner | 32x32px (`h-8 w-8`) | 44x44px |
| `OnboardingBanner.tsx` | 39 | Bouton fermer onboarding | ~8px effectif (`p-1`) | 44x44px |
| `ExerciseGrid.tsx` | 137, 154 | Boutons toggle vue grille/liste | 36x36px (`h-9 w-9`) | 44x44px |
| `DetailHeader.tsx` | 27 | Lien retour navigation | 32px hauteur | 44x44px |
| `TopBar.tsx` | 126 | Bouton recherche header | 40x40px (`w-10 h-10`) | 44x44px |
| `TopBar.tsx` | 135 | Bouton outils header | 40x40px (`w-10 h-10`) | 44x44px |
| `TopBar.tsx` | 144 | Bouton reglages header | 40x40px (`w-10 h-10`) | 44x44px |
| `TopBar.tsx` | 154 | Bouton mode enseignant | 40x40px (`w-10 h-10`) | 44x44px |
| `HeroMedia.tsx` | 67 | Bouton play video | 40x40px (`w-10 h-10`) | 44x44px |
| `VoiceSelector.tsx` | 31 | Bouton toggle voix | 40x40px (`w-10 h-10`) | 44x44px |
| `VoiceSelector.tsx` | 41-52 | Pills choix voix (Paul/Koraly) | ~24px hauteur | 44x44px |
| `exercise-anatomy.css` | 315-330 | Boutons toolbar anatomie (x4) | 40x40px | 44x44px |
| `exercise-anatomy.css` | 24-31 | Bouton retour anatomie | 40x40px | 44x44px |
| `exercise-anatomy.css` | 166-179 | Bouton fermer sous-menu anatomie | 32x32px | 44x44px |
| `exercise-anatomy.css` | 193-217 | Chips selecteur muscles anatomie | 38px hauteur | 44x44px |

### Violations borderline (40-43px)

| Fichier | Ligne(s) | Element | Taille actuelle | Note |
|---------|----------|---------|-----------------|------|
| `ExerciseFilters.tsx` | 32-44 | Chips de filtre | Largeur variable, ~36px min | Hauteur OK si padding suffisant |
| `globals.css` | 1828-1835 | Items resultats recherche | 32-36px hauteur | Padding trop serré |
| `BottomTabBar.tsx` | 95 | Items onglets bas | ~40px hauteur | A surveiller |

---

## 3. Resume

### Contraste

- **13 violations critiques** (ratio < 3:1) -- principalement `text-white/30`, `text-white/35`, `dark:text-zinc-700` sur fond sombre
- **4 violations majeures** (ratio 3:1-4.5:1 sur texte normal) -- couleurs inline et labels WheelPicker
- **Pattern recurrent** : `text-white/(30|35|40)` + `dark:` + `text-[11px]` = echec systematique

### Cibles tactiles

- **15 elements sous-dimensionnes** (< 44px) dont 2 critiques (< 32px)
- **3 elements borderline** (40-43px)

### Fichiers les plus impactes

1. `src/components/timer/presets/*.tsx` -- 5 fichiers, violations contraste separateurs + labels
2. `src/components/tools/WheelPicker.tsx` -- label unite trop discret
3. `src/components/tools/CountdownWheels.tsx` -- labels min/sec invisibles
4. `src/components/HomepageClient.tsx` -- descriptions cartes sur gradients colores
5. `src/components/TopBar.tsx` -- 4 boutons header sous-dimensionnes
6. `src/app/[locale]/apprendre/anatomie/` -- 5 elements tactiles sous-dimensionnes

### Corrections prioritaires

**P0 -- Corrections immédiates :**
- Remplacer `dark:text-white/35` par `dark:text-white/70` minimum partout
- Remplacer `dark:text-zinc-700` par `dark:text-zinc-400` pour les séparateurs
- Passer les boutons TopBar de `w-10 h-10` a `w-11 h-11` (44px)
- Agrandir le bouton fermer InstallPwaBanner de `h-8 w-8` a `h-11 w-11`

**P1 -- Avant prochaine release :**
- Revoir les descriptions des cartes homepage (blanc sur gradient colore)
- Passer tous les boutons anatomie de 40px a 44px
- Augmenter la taille des pills VoiceSelector
- Verifier le padding des items de recherche

**P2 -- Amelioration continue :**
- Auditer les couleurs inline `style={{ color: '...' }}` dans les timer presets
- Considerer 48px pour toutes les cibles tactiles (contexte salle de sport)
- Tester sur appareil reel avec mains mouillees
