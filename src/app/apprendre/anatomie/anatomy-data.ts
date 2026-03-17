/* ═══════════════════════════════════════════════════════════════════════════
   Anatomy data – Fred's muscle groups (Diapo p.31)
   Ordered: haut du corps → tronc → bas du corps
   ═══════════════════════════════════════════════════════════════════════════ */

export type MuscleGroup = {
  id: string;
  color: string;
  /** Keywords to match GLB mesh node names to this group */
  keywords: string[];
  /** Terms matching exercise.muscles tags from the catalog */
  exerciseSearchTerms: string[];
};

/* ── Muscle groups (insertion order = side panel display order) ────────── */

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  /* ── HAUT DU CORPS ─── */
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
  epaules: {
    id: "epaules",
    color: "#22c55e",
    keywords: ["deltoid", "supraspinatus", "infraspinatus", "teres", "subscapularis"],
    exerciseSearchTerms: [
      "deltoide",
      "deltoïde",
      "epaule",
      "épaule",
      "coiffe",
    ],
  },
  bras_anterieurs: {
    id: "bras_anterieurs",
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
  /* ── TRONC ─── */
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
  dos: {
    id: "dos",
    color: "#ef4444",
    keywords: [
      "iliocostalis",
      "longissimus",
      "spinalis",
      "trapezius",
      "rhomboid",
      "latissimus",
      "quadratus lumborum",
      "erector spinae",
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
  /* ── BAS DU CORPS ─── */
  fessiers: {
    id: "fessiers",
    color: "#ec4899",
    keywords: ["gluteus", "tensor fasciae", "piriformis"],
    exerciseSearchTerms: [
      "fessier",
      "abducteur",
    ],
  },
  cuisses_avant: {
    id: "cuisses_avant",
    color: "#14b8a6",
    keywords: ["rectus femoris", "vastus", "sartorius"],
    exerciseSearchTerms: ["quadricep", "extension jambe"],
  },
  cuisses_arriere: {
    id: "cuisses_arriere",
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
  /* ── NON LISTÉ PAR FRED — meshes existants dans le GLB ─── */
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
};

/* ── Sub-muscles per group (French display names for bottom sheets) ──────── */

export const GROUP_MUSCLES: Record<string, string[]> = {
  pectoraux: ["Grand pectoral", "Dentelé antérieur"],
  epaules: ["Deltoïde antérieur", "Deltoïde moyen", "Deltoïde postérieur", "Supra-épineux", "Infra-épineux", "Grand rond", "Petit rond", "Subscapulaire"],
  bras_anterieurs: ["Biceps brachial", "Brachial", "Brachio-radial", "Extenseur des doigts", "Fléchisseur radial du carpe", "Fléchisseur ulnaire du carpe"],
  triceps: ["Triceps brachial"],
  abdominaux: ["Grand droit", "Oblique externe", "Oblique interne", "Transverse"],
  dos: ["Trapèzes", "Grand dorsal", "Rhomboïdes", "Spinaux", "Carré des lombes"],
  fessiers: ["Grand fessier", "Moyen fessier", "Tenseur du fascia lata", "Piriforme"],
  cuisses_avant: ["Droit fémoral", "Vaste latéral", "Vaste médial", "Vaste intermédiaire", "Couturier"],
  cuisses_arriere: ["Biceps fémoral", "Semi-tendineux", "Semi-membraneux", "Poplité"],
  adducteurs: ["Grand adducteur", "Long adducteur", "Gracile"],
  mollets: ["Gastrocnémiens", "Soléaire", "Tibial antérieur", "Long fibulaire", "Court fibulaire"],
  flechisseurs: ["Psoas-iliaque"],
};

/* ── 3D anchor positions per group (model space, before MANNEQUIN_SCALE) ── */

export const GROUP_ANCHORS: Record<string, [number, number, number]> = {
  pectoraux: [0, 1.20, 0.12],
  epaules: [0.20, 1.35, 0.02],
  bras_anterieurs: [0.26, 1.10, 0.06],
  triceps: [-0.26, 1.10, -0.06],
  abdominaux: [0, 0.90, 0.11],
  dos: [0, 1.15, -0.12],
  fessiers: [0.10, 0.68, -0.12],
  cuisses_avant: [0.12, 0.45, 0.08],
  cuisses_arriere: [-0.12, 0.42, -0.08],
  adducteurs: [0.10, 0.50, 0.06],
  mollets: [0.08, 0.15, -0.04],
  flechisseurs: [0.08, 0.72, 0.06],
};

/* ── Posterior-dominant groups (for camera orientation) ─────────────────── */

export const POSTERIOR_GROUPS = new Set([
  "dos",
  "triceps",
  "fessiers",
  "cuisses_arriere",
  "mollets",
]);

/* ── French display names for individual muscles ─────────────────────────── */

export const MUSCLE_FR_NAMES: Record<string, string> = {
  /* Dos */
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
  "external abdominal oblique": "Oblique externe",
  "internal abdominal oblique": "Oblique interne",
  "transversus abdominis": "Transverse",
  /* Épaules */
  "acromial part of deltoid": "Deltoïde moyen",
  "clavicular part of deltoid": "Deltoïde antérieur",
  "scapular spinal part of deltoid": "Deltoïde postérieur",
  supraspinatus: "Supra-épineux",
  infraspinatus: "Infra-épineux",
  "teres major": "Grand rond",
  "teres minor": "Petit rond",
  subscapularis: "Subscapulaire",
  /* Bras antérieurs */
  "long head of biceps brachii": "Biceps brachial",
  "short head of biceps brachii": "Biceps brachial",
  brachialis: "Brachial",
  coracobrachialis: "Coraco-brachial",
  brachioradialis: "Brachio-radial",
  "extensor digitorum": "Extenseur des doigts",
  "flexor carpi radialis": "Fléchisseur radial du carpe",
  "humeral head of flexor carpi ulnaris": "Fléchisseur ulnaire du carpe",
  "ulnar head of flexor carpi ulnaris": "Fléchisseur ulnaire du carpe",
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
  piriformis: "Piriforme",
  /* Cuisses avant */
  "rectus femoris": "Droit fémoral",
  "vastus lateralis": "Vaste latéral",
  "vastus medialis": "Vaste médial",
  "vastus intermedius": "Vaste intermédiaire",
  sartorius: "Couturier",
  /* Cuisses arrière */
  "long head of biceps femoris": "Biceps fémoral",
  "short head of biceps femoris": "Biceps fémoral",
  semimembranosus: "Semi-membraneux",
  semitendinosus: "Semi-tendineux",
  popliteus: "Poplité",
  /* Adducteurs */
  "adductor magnus": "Grand adducteur",
  "adductor longus": "Long adducteur",
  "adductor brevis": "Court adducteur",
  gracilis: "Gracile",
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

/* ── Find which group a mesh node belongs to ─────────────────────────────── */

export function getGroupForNode(raw: string): string | null {
  const norm = raw.toLowerCase();
  for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
    if (group.keywords.some((kw) => norm.includes(kw))) return key;
  }
  return null;
}

/* ── Layered groups (overlapping muscles — sub-menu system) ──────────────── */

export type LayeredMuscle = { name: string; color: string };

export const LAYERED_GROUPS: Record<string, LayeredMuscle[]> = {
  pectoraux: [
    { name: "Grand pectoral", color: "#E74C3C" },
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
  bras_anterieurs: [
    { name: "Biceps brachial", color: "#E74C3C" },
    { name: "Brachial", color: "#2ECC71" },
    { name: "Brachio-radial", color: "#F39C12" },
  ],
  abdominaux: [
    { name: "Grand droit", color: "#E74C3C" },
    { name: "Oblique externe", color: "#3498DB" },
    { name: "Oblique interne", color: "#2ECC71" },
    { name: "Transverse", color: "#F39C12" },
  ],
  dos: [
    { name: "Trapèzes", color: "#E74C3C" },
    { name: "Grand dorsal", color: "#3498DB" },
    { name: "Rhomboïdes", color: "#2ECC71" },
    { name: "Spinaux", color: "#F39C12" },
    { name: "Carré des lombes", color: "#9B59B6" },
  ],
  fessiers: [
    { name: "Grand fessier", color: "#E74C3C" },
    { name: "Moyen fessier", color: "#3498DB" },
  ],
  cuisses_avant: [
    { name: "Droit fémoral", color: "#E74C3C" },
    { name: "Vaste latéral", color: "#3498DB" },
    { name: "Vaste médial", color: "#2ECC71" },
    { name: "Vaste intermédiaire", color: "#F39C12" },
    { name: "Couturier", color: "#9B59B6" },
  ],
  cuisses_arriere: [
    { name: "Biceps fémoral", color: "#E74C3C" },
    { name: "Semi-tendineux", color: "#3498DB" },
    { name: "Semi-membraneux", color: "#2ECC71" },
  ],
  adducteurs: [
    { name: "Grand adducteur", color: "#E74C3C" },
    { name: "Long adducteur", color: "#3498DB" },
    { name: "Gracile", color: "#2ECC71" },
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
  const lower = muscleLabel.toLowerCase();
  return group.exerciseSearchTerms.some((term) => lower.includes(term));
}
