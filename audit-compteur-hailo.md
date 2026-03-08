# Audit du fichier `compteur_hailo_v33.py`

## Contexte

Script Python de comptage de personnes par vision par ordinateur, utilisant un accélérateur Hailo (NPU) avec un modèle YOLOv8n. Le script capture un flux vidéo (caméra USB ou fichier), détecte les personnes via inférence sur le Hailo, les suit par tracking centroïde, et compte les franchissements d'une ligne horizontale.

---

## 1. Architecture générale

| Classe | Rôle |
|---|---|
| `YOLOPostProcess` | Post-traitement des sorties YOLOv8 (format Hailo NMS) |
| `TrajectoryTracker` | Tracking centroïde + comptage de franchissement de ligne |
| `CompteurHailoFinal` | Orchestration : init Hailo, prétraitement, inférence tuilée, boucle principale |

**Verdict** : Architecture correcte en 3 couches (détection → tracking → comptage). Séparation des responsabilités raisonnable pour un script embarqué.

---

## 2. Bugs et problèmes fonctionnels

### 2.1 CRITIQUE — Format de sortie YOLO mal interprété

**Fichier** : `YOLOPostProcess.process_yolo_output`, lignes ~40-100

Le code suppose que la sortie `(1, 5, 100)` contient `[x1, y1, x2, y2, conf]` en coordonnées normalisées (0-1). Or :

- La sortie standard d'un `yolov8n.hef` compilé avec le post-processing Hailo NMS intégré produit des **coordonnées déjà dénormalisées** (en pixels dans l'espace d'entrée), pas normalisées 0-1.
- Le format peut aussi être `[x_center, y_center, w, h, conf]` (format YOLO classique) et non `[x1, y1, x2, y2, conf]`.
- **Conséquence** : les bounding boxes calculées peuvent être totalement fausses (multipliées par 320 alors qu'elles sont déjà en pixels, ou interprétées comme coins alors que ce sont centre+dimensions).

**Recommandation** : Vérifier le format exact de sortie du HEF utilisé (via `hailortcli parse-hef`). Ajouter une validation au démarrage qui affiche les ranges des valeurs brutes pour confirmer le format.

### 2.2 IMPORTANT — Variable `raw` potentiellement non définie

```python
if isinstance(output, np.ndarray):
    raw = output
elif isinstance(output, list):
    raw = output[0][0] if isinstance(output[0], list) else output[0]

raw = np.array(raw)  # ← NameError si output n'est ni ndarray ni list
```

Si `output` est un dict, un tuple, ou tout autre type → `NameError: name 'raw' is not defined`.

**Recommandation** : Ajouter un `else: return detections` ou lever une exception explicite.

### 2.3 IMPORTANT — Tracking greedy non-optimal

`TrajectoryTracker.update` utilise un algorithme greedy (premier track trouvé le plus proche). Cela peut produire des associations sous-optimales quand des personnes se croisent :

- Le track A pourrait "voler" la détection qui appartient logiquement au track B.
- L'algorithme hongrois (scipy.optimize.linear_sum_assignment) serait plus robuste mais ajouterait une dépendance.

**Recommandation** : Acceptable pour un prototype sur Raspberry Pi avec peu de personnes simultanées. À améliorer si le comptage est imprécis en conditions réelles.

### 2.4 MODÉRÉ — Comptage unidirectionnel seulement

Le tracker compte **tout** franchissement de ligne (above→below ET below→above) comme +1. Il n'y a pas de distinction entrée/sortie.

- Une personne qui passe dans un sens puis revient sera comptée 2 fois... sauf que `counted = True` empêche tout recomptage après le premier franchissement.
- **Conséquence** : une personne qui fait un aller-retour n'est comptée qu'une fois, ce qui est correct pour un comptage de personnes uniques. Mais une personne qui entre puis sort ne sera comptée qu'une fois, pas deux (pas de compteur entrées/sorties séparé).

**Recommandation** : Clarifier l'intention. Si on veut compter les passages (et non les personnes uniques), supprimer le flag `counted`. Si on veut entrées/sorties, ajouter un compteur directionnel.

### 2.5 MODÉRÉ — FPS affiché seulement toutes les 30 frames (mode caméra)

```python
if frame_count % 30 == 0:
    now = time.time()
    fps = 30 / (now - fps_time)
    fps_time = now
    cv2.putText(...)  # ← affiché SEULEMENT quand frame_count % 30 == 0
```

L'affichage FPS n'apparaît que sur 1 frame sur 30, puis disparaît. La variable `fps` n'est pas conservée entre les itérations.

**Recommandation** : Stocker `fps` comme attribut d'instance et l'afficher à chaque frame.

### 2.6 MINEUR — Code mort commenté dans la boucle principale

Un gros bloc de ~30 lignes est commenté dans `run()` (l'ancien pipeline non-tuilé). Cela nuit à la lisibilité.

**Recommandation** : Supprimer le code mort. Git conserve l'historique.

---

## 3. Problèmes de robustesse

### 3.1 Pas de gestion d'erreur sur l'inférence tuilée

`detect_tiled` appelle `infer_and_detect` 4 fois sans try/except. Si une inférence échoue sur une tuile, tout le frame est perdu.

**Recommandation** : Encapsuler chaque appel d'inférence dans un try/except pour permettre la dégradation gracieuse (continuer avec 3 tuiles sur 4).

### 3.2 Fichier de sortie JSON écrit dans le répertoire courant

```python
with open("compte_personnes.json", 'w') as f:
```

Le fichier est toujours écrit dans `cwd`, pas à côté de la vidéo source ni dans un répertoire configurable.

**Recommandation** : Utiliser le même répertoire que la vidéo d'entrée, ou ajouter un argument `--output-dir`.

### 3.3 Pas de libération des ressources en cas d'exception

Si une exception survient dans la boucle `run()`, `cap.release()`, `output_video.release()`, `vdevice.release()` ne sont jamais appelés.

**Recommandation** : Utiliser des context managers ou un bloc `try/finally`.

### 3.4 Le `exit(1)` au top-level empêche l'import comme module

```python
except ImportError as e:
    print(f"❌ HailoRT non disponible: {e}")
    exit(1)
```

`exit(1)` au niveau module tue le processus entier, même si on importe ce fichier depuis un autre script pour réutiliser une classe.

**Recommandation** : Lever une `ImportError` ou utiliser `sys.exit(1)` uniquement dans `main()`.

---

## 4. Performance

### 4.1 Inférence tuilée = 4× plus lente

`detect_tiled` exécute **4 inférences séquentielles** par frame. Sur un Hailo-8L à ~30 FPS pour une inférence, cela donne ~7.5 FPS effectifs.

**Recommandation** :
- Évaluer si le tiling est réellement nécessaire (YOLOv8n sur 960×540 en une seule passe peut suffire si les personnes ne sont pas trop petites).
- Si le tiling est nécessaire, considérer le batching (envoyer les 4 tuiles en un seul batch si le modèle le supporte).

### 4.2 `np.array(raw)` potentiellement redondant

Si `raw` est déjà un `np.ndarray`, `np.array(raw)` crée une copie inutile.

**Recommandation** : Utiliser `np.asarray(raw)` qui ne copie que si nécessaire.

### 4.3 NMS recalcule les aires à chaque appel

Mineur, mais `nms()` est correct et efficace pour le volume de détections attendu (~10-50 max).

---

## 5. Sécurité et bonnes pratiques

| Point | Statut | Commentaire |
|---|---|---|
| Injection de chemin | OK | Les chemins viennent d'argparse, pas de shell injection |
| Dépendances | OK | Imports standards (cv2, numpy, hailo_platform) |
| Données sensibles | OK | Pas de credentials, tokens, etc. |
| Type hints | ❌ Absents | Aucune annotation de type sur les méthodes |
| Docstrings | ⚠️ Partiels | Présents sur les classes, absents sur plusieurs méthodes |
| Logging | ❌ | Utilise `print()` partout au lieu du module `logging` |

---

## 6. Résumé des recommandations par priorité

### Priorité haute (bugs potentiels)
1. **Vérifier le format de sortie YOLO** — le code assume normalisé 0-1 + format xyxy, ce qui peut être faux selon le HEF
2. **Gérer le cas où `raw` n'est pas défini** — ajouter un `else` branch
3. **Ajouter try/finally** pour la libération des ressources (caméra, vidéo, vdevice)

### Priorité moyenne (robustesse)
4. Supprimer `exit(1)` au top-level, le déplacer dans `main()`
5. Ajouter une gestion d'erreur par tuile dans `detect_tiled`
6. Rendre le chemin de sortie JSON configurable
7. Conserver et afficher le FPS en continu

### Priorité basse (qualité de code)
8. Supprimer le code mort commenté
9. Utiliser `np.asarray` au lieu de `np.array`
10. Remplacer les `print()` par le module `logging`
11. Ajouter des type hints

---

## 7. Points positifs

- L'approche tuilée avec NMS pour gérer les grandes résolutions est bien pensée
- Le tracker centroïde est simple et adapté au cas d'usage (flux faible de personnes)
- La sauvegarde automatique du compteur en JSON est pratique
- Le support caméra USB + fichier vidéo avec sortie annotée est complet
- Le code est globalement lisible et bien structuré pour un script embarqué
