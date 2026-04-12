/* ═══════════════════════════════════════════════════════════════════════════
   Anatomy data – aligned with the unified 8-group system from muscleGroups.ts
   Ordered: haut du corps → tronc → bas du corps
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  type MuscleGroupId,
  MUSCLE_GROUP_IDS,
  MUSCLE_GROUP_COLORS,
  MESH_KEYWORDS,
  getGroupForMeshNode,
  getMuscleGroup,
  GROUP_OFFICIAL_MUSCLES,
} from "@/lib/exercices/muscleGroups";

/* ── Re-export MuscleGroupId for consumers ─────────────────────────────── */

export type MuscleGroup = {
  id: MuscleGroupId;
  color: string;
  /** Keywords to match GLB mesh node names to this group */
  keywords: string[];
};

/* ── Build MUSCLE_GROUPS from the unified source ───────────────────────── */

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {};

for (const id of MUSCLE_GROUP_IDS) {
  MUSCLE_GROUPS[id] = {
    id,
    color: MUSCLE_GROUP_COLORS[id],
    keywords: MESH_KEYWORDS[id],
  };
}

/* ── Sub-muscles per group (French display names for bottom sheets) ──────── */

export const GROUP_MUSCLES: Record<string, string[]> = {};

for (const id of MUSCLE_GROUP_IDS) {
  GROUP_MUSCLES[id] = GROUP_OFFICIAL_MUSCLES[id].map((m) =>
    m.oldName ? `${m.name} (${m.oldName})` : m.name,
  );
}

/* ── 3D anchor positions per group (model space, before MANNEQUIN_SCALE) ── */

export const GROUP_ANCHORS: Record<string, [number, number, number]> = {
  pectoraux: [0, 1.20, 0.12],
  epaules: [0.20, 1.35, 0.02],
  bras: [0.26, 1.10, 0.06],
  abdominaux: [0, 0.90, 0.11],
  dorsaux: [0, 1.15, -0.12],
  fessiers: [0.10, 0.68, -0.12],
  cuisses: [0.12, 0.45, 0.08],
  mollets: [0.08, 0.15, -0.04],
};

/* ── Posterior-dominant groups (for camera orientation) ─────────────────── */

export const POSTERIOR_GROUPS = new Set<string>([
  "dorsaux",
  "fessiers",
  "mollets",
]);

/* ── French display names for individual muscles (GLB mesh → FR) ───────── */

export const MUSCLE_FR_NAMES: Record<string, string> = {
  /* Dos / Dorsaux */
  "iliocostalis lumborum": "Érecteurs du rachis",
  "iliocostalis thoracis": "Érecteurs du rachis",
  "iliocostalis colli": "Érecteurs du rachis",
  "longissimus thoracis": "Érecteurs du rachis",
  "longissimus capitis": "Érecteurs du rachis",
  "longissimus colli": "Érecteurs du rachis",
  "spinalis capitis": "Érecteurs du rachis",
  "spinalis colli": "Érecteurs du rachis",
  "spinalis thoracis": "Érecteurs du rachis",
  "ascending part of trapezius": "Trapèze",
  "descending part of trapezius": "Trapèze",
  "transverse part of trapezius": "Trapèze",
  "rhomboid major": "Rhomboïde",
  "rhomboid minor": "Rhomboïde",
  "latissimus dorsi": "Grand dorsal",
  "quadratus lumborum": "Érecteurs du rachis",
  "erector spinae": "Érecteurs du rachis",
  "levator scapulae": "Élévateur de la scapula",
  "sternocleidomastoid": "Sterno-cléido-mastoïdien",
  /* Pectoraux */
  "clavicular head of pectoralis major": "Grand pectoral",
  "sternocostal head of pectoralis major": "Grand pectoral",
  "abdominal part of pectoralis major": "Grand pectoral",
  "pectoralis minor": "Petit pectoral",
  "serratus anterior": "Dentelé antérieur",
  /* Abdominaux */
  "rectus abdominis": "Droit de l'abdomen",
  "external abdominal oblique": "Oblique externe",
  "internal abdominal oblique": "Oblique interne",
  "transversus abdominis": "Transverse de l'abdomen",
  /* Épaules */
  "acromial part of deltoid": "Deltoïde moyen",
  "clavicular part of deltoid": "Deltoïde antérieur",
  "scapular spinal part of deltoid": "Deltoïde postérieur",
  supraspinatus: "Supra-épineux",
  infraspinatus: "Infra-épineux",
  "teres major": "Grand rond",
  "teres minor": "Petit rond",
  subscapularis: "Subscapulaire",
  /* Bras */
  "long head of biceps brachii": "Biceps brachial",
  "short head of biceps brachii": "Biceps brachial",
  brachialis: "Brachial",
  coracobrachialis: "Coraco-brachial",
  brachioradialis: "Brachio-radial",
  "extensor digitorum": "Extenseur des doigts",
  "flexor carpi radialis": "Fléchisseur radial du carpe",
  "humeral head of flexor carpi ulnaris": "Fléchisseur ulnaire du carpe",
  "ulnar head of flexor carpi ulnaris": "Fléchisseur ulnaire du carpe",
  "medial head of triceps brachii": "Triceps brachial",
  "lateral head of triceps brachii": "Triceps brachial",
  "long head of triceps brachii": "Triceps brachial",
  /* Cuisses */
  iliacus: "Ilio-psoas",
  "psoas major": "Ilio-psoas",
  "rectus femoris": "Quadriceps fémoral",
  "vastus lateralis": "Quadriceps fémoral",
  "vastus medialis": "Quadriceps fémoral",
  "vastus intermedius": "Quadriceps fémoral",
  sartorius: "Sartorius",
  "long head of biceps femoris": "Ischio-jambiers",
  "short head of biceps femoris": "Ischio-jambiers",
  semimembranosus: "Ischio-jambiers",
  semitendinosus: "Ischio-jambiers",
  popliteus: "Ischio-jambiers",
  "adductor magnus": "Adducteurs",
  "adductor longus": "Adducteurs",
  "adductor brevis": "Adducteurs",
  gracilis: "Adducteurs",
  /* Fessiers */
  "gluteus medius": "Moyen glutéal",
  "gluteus maximus": "Grand glutéal",
  "gluteus minimus": "Petit glutéal",
  "tensor fasciae latae": "Tenseur du fascia lata",
  piriformis: "Piriforme",
  /* Mollets */
  "lateral head of gastrocnemius": "Gastrocnémiens",
  "medial head of gastrocnemius": "Gastrocnémiens",
  soleus: "Soléaire",
  "tibialis anterior": "Tibial antérieur",
  "fibularis longus": "Long fibulaire",
  "fibularis brevis": "Court fibulaire",
};

/* ── Normalize GLB mesh/node name to a clean base for lookup ─────────────── */

export function normalizeName(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\.(l|r)$/i, "")
    .replace(/\.00\d+$/i, "")
    .replace(/_dec$/i, "")
    .replace(/ dec$/i, "")
    .replace(/ muscle[lr]?$/i, "")
    .replace(/[()]/g, "")
    .trim()
    .toLowerCase();
}

/* ── Get French display name from raw mesh name ──────────────────────────── */

export function getFrenchName(raw: string): string {
  const norm = normalizeName(raw);
  if (MUSCLE_FR_NAMES[norm]) return MUSCLE_FR_NAMES[norm];
  // Partial match — find longest matching key
  let best: string | null = null;
  let bestLen = 0;
  for (const [key, fr] of Object.entries(MUSCLE_FR_NAMES)) {
    if (norm.includes(key) && key.length > bestLen) {
      best = fr;
      bestLen = key.length;
    }
    if (key.includes(norm) && norm.length > bestLen) {
      best = fr;
      bestLen = norm.length;
    }
  }
  if (best) return best;
  return raw
    .replace(/_/g, " ")
    .replace(/\.(l|r)$/i, "")
    .replace(/_dec.*$/i, "")
    .replace(/ muscle.*$/i, "")
    .trim();
}

/* ── Get side (G/D) from raw mesh name ───────────────────────────────────── */

export function getSide(raw: string): string {
  const n = raw.toLowerCase();
  if (n.endsWith(".r") || n.endsWith("muscler")) return "D";
  if (n.endsWith(".l") || n.endsWith("musclel")) return "G";
  return "";
}

/* ── Find which group a mesh node belongs to (delegates to muscleGroups.ts) ── */

export function getGroupForNode(raw: string): string | null {
  return getGroupForMeshNode(raw);
}

/* ── Layered groups (overlapping muscles — sub-menu system) ──────────────── */

export type LayeredMuscle = { name: string; color: string };

export const LAYERED_GROUPS: Record<string, LayeredMuscle[]> = {
  pectoraux: [
    { name: "Grand pectoral", color: "#E74C3C" },
    { name: "Petit pectoral", color: "#2ECC71" },
    { name: "Dentelé antérieur", color: "#3498DB" },
  ],
  epaules: [
    { name: "Deltoïde antérieur", color: "#E74C3C" },
    { name: "Deltoïde moyen", color: "#E74C3C" },
    { name: "Deltoïde postérieur", color: "#E74C3C" },
    { name: "Supra-épineux", color: "#3498DB" },
    { name: "Infra-épineux", color: "#2ECC71" },
    { name: "Grand rond", color: "#F39C12" },
    { name: "Petit rond", color: "#9B59B6" },
    { name: "Subscapulaire", color: "#1ABC9C" },
  ],
  bras: [
    { name: "Biceps brachial", color: "#E74C3C" },
    { name: "Brachial", color: "#2ECC71" },
    { name: "Brachio-radial", color: "#F39C12" },
    { name: "Triceps brachial", color: "#9B59B6" },
    { name: "Extenseur des doigts", color: "#3498DB" },
    { name: "Fléchisseur radial du carpe", color: "#1ABC9C" },
    { name: "Fléchisseur ulnaire du carpe", color: "#E67E22" },
  ],
  abdominaux: [
    { name: "Droit de l'abdomen", color: "#E74C3C" },
    { name: "Oblique externe", color: "#3498DB" },
    { name: "Oblique interne", color: "#2ECC71" },
    { name: "Transverse de l'abdomen", color: "#F39C12" },
  ],
  dorsaux: [
    { name: "Trapèze", color: "#E74C3C" },
    { name: "Grand dorsal", color: "#3498DB" },
    { name: "Rhomboïde", color: "#2ECC71" },
    { name: "Érecteurs du rachis", color: "#F39C12" },
    { name: "Infra-épineux", color: "#9B59B6" },
    { name: "Grand rond", color: "#1ABC9C" },
    { name: "Petit rond", color: "#E67E22" },
  ],
  fessiers: [
    { name: "Grand glutéal", color: "#E74C3C" },
    { name: "Moyen glutéal", color: "#3498DB" },
    { name: "Piriforme", color: "#2ECC71" },
  ],
  cuisses: [
    { name: "Quadriceps fémoral", color: "#E74C3C" },
    { name: "Ischio-jambiers", color: "#3498DB" },
    { name: "Adducteurs", color: "#2ECC71" },
    { name: "Ilio-psoas", color: "#F39C12" },
    { name: "Sartorius", color: "#9B59B6" },
  ],
  mollets: [
    { name: "Gastrocnémiens", color: "#E74C3C" },
    { name: "Soléaire", color: "#3498DB" },
    { name: "Tibial antérieur", color: "#2ECC71" },
    { name: "Long fibulaire", color: "#F39C12" },
  ],
};

export function isLayeredGroup(groupKey: string): boolean {
  return groupKey in LAYERED_GROUPS;
}

export function getLayeredMuscles(groupKey: string): string[] | null {
  const entries = LAYERED_GROUPS[groupKey];
  return entries ? entries.map((e) => e.name) : null;
}

export function getSubMuscleColor(groupKey: string, muscleName: string): string | null {
  const entries = LAYERED_GROUPS[groupKey];
  if (!entries) return null;
  return entries.find((e) => e.name === muscleName)?.color ?? null;
}

/* ── Check if an exercise muscle tag matches a group ─────────────────────── */

export function matchesGroup(
  group: MuscleGroup,
  muscleLabel: string,
): boolean {
  const matched = getMuscleGroup(muscleLabel);
  return matched === group.id;
}
