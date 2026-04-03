---
name: mannequin-3d
description: >
  Règles et conventions pour le mannequin anatomique 3D de Tazieff EPS
  (Three.js / React Three Fiber). Utiliser cette skill dès qu'on
  mentionne mannequin, anatomie 3D, silhouette, muscles 3D, scan
  animation, wireframe, ombre, shadow, R3F, React Three Fiber,
  GLB/GLTF, ou toute modification du rendu 3D anatomique. Aussi
  quand on travaille sur les fichiers anatomy-data.ts, le modèle
  silhouette_fixed.glb, ou les composants de visualisation musculaire.
  Même pour des modifications mineures — les règles visuelles sont
  absolues. Contient les erreurs passées à ne pas reproduire
  (shadow maps, perspective camera, DoubleSide).
---

# Mannequin anatomique 3D — Tazieff EPS

## Fichiers clés

- Modèle 3D : `public/models/silhouette_fixed.glb`
- Image de fond : `public/images/anatomy/mini-mannequin.webp`
- Données muscles : `src/lib/anatomy-data.ts` (FICHIER PROTÉGÉ)
- Composants R3F : chercher dans `src/components/` les fichiers liés

`anatomy-data.ts` est un fichier protégé : ajouts ciblés uniquement,
ne jamais refactorer ou réorganiser sans demande explicite.

## 4 règles visuelles ABSOLUES

Ces règles ont été établies après de nombreuses itérations. Elles sont
NON NÉGOCIABLES et s'appliquent à toute modification du rendu 3D.

### Règle 1 — Jamais de faces internes

Tous les materials (wireframe, points, muscles) utilisent
`THREE.FrontSide` uniquement.

```typescript
material.side = THREE.FrontSide; // TOUJOURS
// JAMAIS THREE.DoubleSide ou THREE.BackSide
```

Les faces internes créent des artefacts visuels (flickering,
z-fighting) sur la silhouette.

### Règle 2 — Le wireframe ne recouvre jamais un muscle coloré

Le wireframe de la silhouette sert de contour/squelette. Il ne doit
JAMAIS se dessiner par-dessus un muscle visible et coloré.

Solution technique : stencil buffer.
- Les muscles écrivent dans le stencil
- Le wireframe ne se dessine que là où le stencil est vide

### Règle 3 — Highlights additifs uniquement

Aucun muscle ne doit jamais assombrir la scène. Tous les effets de
surbrillance utilisent le blending additif.

```typescript
material.blending = THREE.AdditiveBlending;
// Résultat : les muscles s'illuminent, jamais ne s'assombrissent
```

### Règle 4 — Turntable : mannequin tourne, caméra fixe, fond fixe

En mode rotation (turntable) :
- Le mannequin (mesh group) tourne sur l'axe Y
- La caméra reste fixe
- L'image de fond reste fixe
- Résultat : le mannequin tourne "devant" le fond

## Caméra orthographique obligatoire

TOUJOURS utiliser `OrthographicCamera`, JAMAIS `PerspectiveCamera`
pour le mannequin sur fond d'image.

Raison (apprise par l'expérience) : la perspective crée un parallaxe
incorrigible entre l'objet 3D et l'image de fond. L'orthographique
élimine ce problème — zoom et pan uniformes sur toute la scène.

```typescript
// Correct
<OrthographicCamera makeDefault zoom={...} />

// INTERDIT pour ce use case
<PerspectiveCamera />
```

## Animation scan CT-scanner

L'animation de "scan" utilise un disque opaque horizontal
(`CircleGeometry`) qui descend verticalement sur le mannequin.

Comportement :
- Les muscles sont invisibles en dessous de la ligne de scan
- Le disque les "génère" / révèle en descendant
- Glow néon : noyau blanc + halo cyan en `AdditiveBlending`
- Toggle dans les paramètres app (localStorage key `eps_anatomy_anim`)
- Labels i18n FR/EN/ES

## Éclairage

- Lumière principale : directionnelle, légèrement au-dessus
- Lumière d'ambiance faible pour les zones d'ombre
- Pas de lumière ponctuelle forte (crée des hotspots)
- Le fond sombre (`#04040A`) absorbe la lumière ambiante

## Ombre au sol — Planar Projected Shadow

### Ce qui NE MARCHE PAS (testé et abandonné)

**Shadow maps (DirectionalLight + castShadow + shadowMaterial)** :
incompatibles avec notre setup. L'association caméra orthographique
+ stencil buffer pour les muscles + transforms imbriquées du GLB
cause des problèmes insolubles de shadow-camera frustum, bias, et
plan récepteur invisible. Après de multiples itérations :
suppression complète du code shadow map (commit a9e5806, -46 lignes).

NE JAMAIS RÉINTRODUIRE de shadow maps sur ce mannequin.
Pas de `castShadow`, pas de `receiveShadow`, pas de `shadowMaterial`,
pas de `<Canvas shadows>`.

### Approche retenue : ombre projetée géométriquement

Technique dite "planar projected shadow" — la plus ancienne et
robuste en 3D, sans dépendance au système de shadow maps.

Principe :
1. Cloner les meshes visibles du mannequin
2. Les écraser sur le plan du sol avec une matrice de projection 4×4
3. Les rendre en noir semi-transparent, sans éclairage

La matrice de projection écrase chaque vertex sur Y=sol et le
décale en X/Z selon la direction de la lumière :

```
| 1   0   0   0 |
| lx  0   lz  0 |    (lx, lz = direction lumière normalisée)
| 0   0   1   0 |
| 0   0   0   1 |
```

### Direction de l'ombre

Lumière venant du haut-gauche-arrière (~110-120°).
Ombre projetée vers le bas-droite-avant (~290-300°).
Cohérent avec l'éclairage de l'image de fond du mannequin.

### Rendu de l'ombre

```typescript
// Material de l'ombre
const shadowMaterial = new THREE.MeshBasicMaterial({
  color: '#0a0505',        // Noir chaud, pas noir pur
  transparent: true,
  opacity: 0.55,           // Ajuster si trop subtil sur fond sombre
  depthTest: false,
  depthWrite: false,
  side: THREE.FrontSide,   // Règle 1 toujours applicable
});
```

### Pièges connus (appris par l'expérience)

1. **CircleGeometry/PlaneGeometry invisible** : ces géométries plates
   peuvent être vues "de côté" (edge-on) si un group parent a une
   rotation. Préférer un `BoxGeometry` très plat (`args=[w, 0.01, d]`)
   qui est naturellement horizontal sans rotation.

2. **Position Y** : l'ombre doit être à `BOX_MIN_Y` (pieds du mannequin).
   Toujours `console.log` la world position si invisible.

3. **Transforms parent** : vérifier que le parent du mesh ombre n'a
   pas de transform qui annule le positionnement. Logger
   `mesh.getWorldPosition()` et `mesh.matrixWorld`.

4. **L'ombre tourne AVEC le mannequin** en mode turntable : c'est une
   copie géométrique attachée au même group, donc elle suit la rotation.

## Performance mobile

- Le modèle GLB doit rester léger (<2 Mo)
- Lazy-load le composant R3F (Three.js ~500 Ko min)
- Utiliser `React.lazy()` + `Suspense` pour le chargement
- Monitorer le FPS sur mobile — viser 30+ fps minimum

## Palette couleurs muscles

Voir `references/couleurs-muscles.md` si besoin de la palette exacte.
Les couleurs sont définies dans `anatomy-data.ts`.

Principe : chaque groupe musculaire a une couleur distinctive,
suffisamment contrastée sur fond sombre. Les couleurs sont saturées
(design system Sport Vibrant) mais jamais blanches pures.
