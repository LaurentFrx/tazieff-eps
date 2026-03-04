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
    keywords: ["biceps brachii", "brachialis", "coracobrachialis", "brachioradialis"],
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
    keywords: ["gluteus"],
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
      "adductor",
      "gracilis",
      "biceps femoris",
    ],
    exerciseSearchTerms: ["ischio", "leg curl", "jambe", "adducteur"],
  },
  mollets: {
    id: "mollets",
    color: "#f472b6",
    keywords: ["gastrocnemius", "soleus"],
    exerciseSearchTerms: [
      "mollet",
      "gastrocnemien",
      "gastrocnémien",
      "soleaire",
      "soléaire",
    ],
  },
};

/* ── French display names for individual muscles ─────────────────────────── */

export const MUSCLE_FR_NAMES: Record<string, string> = {
  /* Dorsaux */
  "iliocostalis lumborum": "Ilio-costal des lombes",
  "iliocostalis thoracis": "Ilio-costal du thorax",
  "iliocostalis colli": "Ilio-costal du cou",
  "longissimus thoracis": "Longissimus du thorax",
  "longissimus capitis": "Longissimus de la tête",
  "longissimus colli": "Longissimus du cou",
  "spinalis capitis": "Épineux de la tête",
  "spinalis colli": "Épineux du cou",
  "spinalis thoracis": "Épineux du thorax",
  "ascending part of trapezius": "Trapèzes",
  "descending part of trapezius": "Trapèzes",
  "transverse part of trapezius": "Trapèzes",
  "rhomboid major": "Rhomboïdes",
  "rhomboid minor": "Rhomboïdes",
  "latissimus dorsi": "Grand dorsal",
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
  /* Mollets */
  "lateral head of gastrocnemius": "Gastrocnémiens",
  "medial head of gastrocnemius": "Gastrocnémiens",
  soleus: "Soléaire",
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

/* ── Check if an exercise muscle tag matches a group ─────────────────────── */

export function matchesGroup(
  group: MuscleGroup,
  muscleLabel: string,
): boolean {
  const lower = muscleLabel.toLowerCase();
  return group.exerciseSearchTerms.some((term) => lower.includes(term));
}
