/* ═══════════════════════════════════════════════════════════════════════════
   Anatomy data – 11 muscle groups (EPS lycée taxonomy)
   Maps individual muscles → 11 groups → exercise catalog tags
   ═══════════════════════════════════════════════════════════════════════════ */

export type MuscleGroup = {
  id: string;
  color: string;
  /** Keywords to match GLB mesh node names to this group */
  keywords: string[];
  /** Terms matching exercise.muscles tags from the catalog */
  exerciseSearchTerms: string[];
};

/* ── 11 muscle groups ────────────────────────────────────────────────────── */

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  dorsaux: {
    id: "dorsaux",
    color: "#ef4444",
    keywords: [
      "iliocostalis",
      "longissimus",
      "spinalis",
      "trapezius",
      "rhomboid",
      "latissimus",
      "infraspinatus",
      "supraspinatus",
      "teres",
      "subscapularis",
      "levator scapulae",
      "sternocleidomastoid",
    ],
    exerciseSearchTerms: [
      "grand dorsal",
      "dorsaux",
      "dorsal",
      "trapeze",
      "trapèze",
      "trapezes",
      "rhomboide",
      "rhomboïde",
      "erecteur",
      "érecteur",
      "carre des lombes",
      "carré des lombes",
      "lombaire",
    ],
  },
  pectoraux: {
    id: "pectoraux",
    color: "#f97316",
    keywords: ["pectoralis", "serratus"],
    exerciseSearchTerms: [
      "pectora",
      "portion claviculaire",
      "dentel",
      "dentele",
      "dentelé",
    ],
  },
  abdominaux: {
    id: "abdominaux",
    color: "#eab308",
    keywords: ["abdominis", "oblique", "transversus"],
    exerciseSearchTerms: [
      "abdomin",
      "abdos",
      "grand droit",
      "oblique",
      "transverse",
      "gainage",
      "rotation",
      "anti-rotation",
    ],
  },
  deltoides: {
    id: "deltoides",
    color: "#22c55e",
    keywords: ["deltoid"],
    exerciseSearchTerms: [
      "deltoide",
      "deltoïde",
      "epaule",
      "épaule",
    ],
  },
  biceps: {
    id: "biceps",
    color: "#38bdf8",
    keywords: ["biceps brachii", "brachialis", "coracobrachialis", "brachioradialis", "extensor digitorum", "flexor carpi"],
    exerciseSearchTerms: ["biceps", "brachial", "curl", "avant-bras"],
  },
  triceps: {
    id: "triceps",
    color: "#818cf8",
    keywords: ["triceps"],
    exerciseSearchTerms: ["triceps", "extension", "dips"],
  },
  flechisseurs: {
    id: "flechisseurs",
    color: "#a78bfa",
    keywords: ["iliacus", "psoas"],
    exerciseSearchTerms: [
      "psoas",
      "ilio-psoas",
      "iliaque",
      "flechisseur",
      "fléchisseur",
      "hanche",
    ],
  },
  fessiers: {
    id: "fessiers",
    color: "#ec4899",
    keywords: ["gluteus", "tensor fasciae", "piriformis"],
    exerciseSearchTerms: [
      "fessier",
      "abducteur",
    ],
  },
  quadriceps: {
    id: "quadriceps",
    color: "#14b8a6",
    keywords: ["rectus femoris", "vastus", "sartorius"],
    exerciseSearchTerms: ["quadricep", "extension jambe"],
  },
  ischio_jambiers: {
    id: "ischio_jambiers",
    color: "#06b6d4",
    keywords: [
      "semimembranosus",
      "semitendinosus",
      "biceps femoris",
      "popliteus",
    ],
    exerciseSearchTerms: ["ischio", "leg curl"],
  },
  adducteurs: {
    id: "adducteurs",
    color: "#d946ef",
    keywords: ["adductor", "gracilis"],
    exerciseSearchTerms: ["adducteur", "adduction"],
  },
  mollets: {
    id: "mollets",
    color: "#f472b6",
    keywords: ["gastrocnemius", "soleus", "tibialis", "fibularis"],
    exerciseSearchTerms: [
      "mollet",
      "gastrocnemien",
      "gastrocnémien",
      "soleaire",
      "soléaire",
    ],
  },
};

/* ── Sub-muscles per group (French display names for bottom sheets) ──────── */

export const GROUP_MUSCLES: Record<string, string[]> = {
  dorsaux: ["Grand dorsal", "Trapèzes", "Rhomboïdes", "Infra-épineux", "Grand rond", "Petit rond", "Subscapulaire", "Élévateur de la scapula", "Sterno-cléido-mastoïdien", "Carré des lombes", "Spinaux"],
  pectoraux: ["Grand pectoral", "Dentelé antérieur"],
  abdominaux: ["Grand droit", "Obliques", "Transverse"],
  deltoides: ["Deltoïde antérieur", "Deltoïde moyen", "Deltoïde postérieur"],
  biceps: ["Biceps brachial", "Brachial", "Brachio-radial", "Extenseur des doigts", "Fléchisseur radial du carpe", "Fléchisseur ulnaire du carpe"],
  triceps: ["Triceps brachial"],
  flechisseurs: ["Psoas-iliaque"],
  fessiers: ["Grand fessier", "Moyen fessier", "Tenseur du fascia lata", "Piriforme"],
  quadriceps: ["Droit fémoral", "Vastes"],
  ischio_jambiers: ["Biceps fémoral", "Semi-tendineux", "Semi-membraneux", "Poplité"],
  adducteurs: ["Grand adducteur", "Long adducteur", "Gracile"],
  mollets: ["Gastrocnémiens", "Soléaire", "Tibial antérieur", "Long fibulaire", "Court fibulaire"],
};

/* ── 3D anchor positions per group (model space, before MANNEQUIN_SCALE) ── */

export const GROUP_ANCHORS: Record<string, [number, number, number]> = {
  dorsaux: [0, 1.15, -0.12],
  pectoraux: [0, 1.20, 0.12],
  abdominaux: [0, 0.90, 0.11],
  deltoides: [0.20, 1.35, 0.02],
  biceps: [0.26, 1.10, 0.06],
  triceps: [-0.26, 1.10, -0.06],
  flechisseurs: [0.08, 0.72, 0.06],
  fessiers: [0.10, 0.68, -0.12],
  quadriceps: [0.12, 0.45, 0.08],
  ischio_jambiers: [-0.12, 0.42, -0.08],
  adducteurs: [0.10, 0.50, 0.06],
  mollets: [0.08, 0.15, -0.04],
};

/* ── Posterior-dominant groups (for camera orientation) ─────────────────── */

export const POSTERIOR_GROUPS = new Set([
  "dorsaux",
  "triceps",
  "fessiers",
  "ischio_jambiers",
  "mollets",
]);

/* ── French display names for individual muscles ─────────────────────────── */

export const MUSCLE_FR_NAMES: Record<string, string> = {
  /* Dorsaux */
  "iliocostalis lumborum": "Spinaux",
  "iliocostalis thoracis": "Spinaux",
  "iliocostalis colli": "Spinaux",
  "longissimus thoracis": "Spinaux",
  "longissimus capitis": "Spinaux",
  "longissimus colli": "Spinaux",
  "spinalis capitis": "Spinaux",
  "spinalis colli": "Spinaux",
  "spinalis thoracis": "Spinaux",
  "ascending part of trapezius": "Trapèzes",
  "descending part of trapezius": "Trapèzes",
  "transverse part of trapezius": "Trapèzes",
  "rhomboid major": "Rhomboïdes",
  "rhomboid minor": "Rhomboïdes",
  "latissimus dorsi": "Grand dorsal",
  "quadratus lumborum": "Carré des lombes",
  "erector spinae": "Spinaux",
  "subscapularis": "Subscapulaire",
  "levator scapulae": "Élévateur de la scapula",
  "sternocleidomastoid": "Sterno-cléido-mastoïdien",
  /* Pectoraux */
  "clavicular head of pectoralis major": "Grand pectoral",
  "sternocostal head of pectoralis major": "Grand pectoral",
  "abdominal part of pectoralis major": "Grand pectoral",
  "pectoralis minor": "Petit pectoral",
  "serratus anterior": "Dentelé antérieur",
  /* Abdominaux */
  "rectus abdominis": "Grand droit",
  "external abdominal oblique": "Obliques",
  "internal abdominal oblique": "Obliques",
  "transversus abdominis": "Transverse",
  /* Deltoïdes */
  "acromial part of deltoid": "Deltoïde moyen",
  "clavicular part of deltoid": "Deltoïde antérieur",
  "scapular spinal part of deltoid": "Deltoïde postérieur",
  supraspinatus: "Supra-épineux",
  infraspinatus: "Infra-épineux",
  "teres major": "Grand rond",
  /* Biceps */
  "long head of biceps brachii": "Biceps brachial",
  "short head of biceps brachii": "Biceps brachial",
  brachialis: "Brachial",
  coracobrachialis: "Coraco-brachial",
  brachioradialis: "Brachio-radial",
  /* Triceps */
  "medial head of triceps brachii": "Triceps brachial",
  "lateral head of triceps brachii": "Triceps brachial",
  "long head of triceps brachii": "Triceps brachial",
  /* Fléchisseurs de hanche */
  iliacus: "Psoas-iliaque",
  "psoas major": "Psoas-iliaque",
  /* Fessiers */
  "gluteus medius": "Moyen fessier",
  "gluteus maximus": "Grand fessier",
  "gluteus minimus": "Petit fessier",
  "tensor fasciae latae": "Tenseur du fascia lata",
  "piriformis": "Piriforme",
  /* Quadriceps */
  "rectus femoris": "Droit fémoral",
  "vastus lateralis": "Vastes",
  "vastus medialis": "Vastes",
  "vastus intermedius": "Vastes",
  sartorius: "Couturier",
  /* Ischio-jambiers */
  "adductor magnus": "Grand adducteur",
  "adductor longus": "Long adducteur",
  "adductor brevis": "Court adducteur",
  gracilis: "Gracile",
  "long head of biceps femoris": "Biceps fémoral",
  "short head of biceps femoris": "Biceps fémoral",
  semimembranosus: "Semi-membraneux",
  semitendinosus: "Semi-tendineux",
  "popliteus": "Poplité",
  /* Mollets */
  "lateral head of gastrocnemius": "Gastrocnémiens",
  "medial head of gastrocnemius": "Gastrocnémiens",
  soleus: "Soléaire",
  "tibialis anterior": "Tibial antérieur",
  "fibularis longus": "Long fibulaire",
  "fibularis brevis": "Court fibulaire",
  /* Avant-bras */
  "extensor digitorum": "Extenseur des doigts",
  "flexor carpi radialis": "Fléchisseur radial du carpe",
  "humeral head of flexor carpi ulnaris": "Fléchisseur ulnaire du carpe",
  "ulnar head of flexor carpi ulnaris": "Fléchisseur ulnaire du carpe",
  "teres minor": "Petit rond",
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

/* ── Find which group a mesh node belongs to ─────────────────────────────── */

export function getGroupForNode(raw: string): string | null {
  const norm = raw.toLowerCase();
  for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
    if (group.keywords.some((kw) => norm.includes(kw))) return key;
  }
  return null;
}

/* ── Layered groups (overlapping muscles — generic sub-menu system) ──────── */

/**
 * Groups where muscles physically overlap in the 3D model, making deeper
 * layers unreachable by raycast. Each entry has a French display name
 * and a distinct highlight color for visual differentiation.
 *
 * Adding an entry here automatically enables the sub-menu picker UI;
 * no component code changes needed.
 */
export type LayeredMuscle = { name: string; color: string };

export const LAYERED_GROUPS: Record<string, LayeredMuscle[]> = {
  abdominaux: [
    { name: "Obliques", color: "#E8433E" },
    { name: "Grand droit", color: "#FF6B35" },
    { name: "Transverse", color: "#FFB347" },
  ],
  deltoides: [
    { name: "Deltoïde antérieur", color: "#2ECC71" },
    { name: "Deltoïde moyen", color: "#2ECC71" },
    { name: "Deltoïde postérieur", color: "#2ECC71" },
    { name: "Supra-épineux", color: "#27AE60" },
    { name: "Infra-épineux", color: "#1ABC9C" },
    { name: "Grand rond", color: "#16A085" },
    { name: "Petit rond", color: "#45B39D" },
    { name: "Subscapulaire", color: "#52BE80" },
  ],
  dorsaux: [
    { name: "Trapèzes", color: "#3498DB" },
    { name: "Grand dorsal", color: "#2980B9" },
    { name: "Rhomboïdes", color: "#5DADE2" },
    { name: "Spinaux", color: "#85C1E9" },
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
  const lower = muscleLabel.toLowerCase();
  return group.exerciseSearchTerms.some((term) => lower.includes(term));
}
