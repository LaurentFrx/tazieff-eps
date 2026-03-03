/* ═══════════════════════════════════════════════════════════════════════════
   Anatomy data – 9 muscle groups from 3D GLB model
   Maps 59 individual muscles → 9 groups → exercise catalog tags
   ═══════════════════════════════════════════════════════════════════════════ */

export type MuscleGroup = {
  id: string;
  color: string;
  /** Keywords to match GLB mesh node names to this group */
  keywords: string[];
  /** Terms matching exercise.muscles tags from the catalog */
  exerciseSearchTerms: string[];
};

/* ── 9 muscle groups ─────────────────────────────────────────────────────── */

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
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
  epaules: {
    id: "epaules",
    color: "#22c55e",
    keywords: ["deltoid", "supraspinatus", "infraspinatus", "teres"],
    exerciseSearchTerms: [
      "deltoide",
      "deltoïde",
      "epaule",
      "épaule",
      "infra",
      "supra",
      "grand rond",
    ],
  },
  bras: {
    id: "bras",
    color: "#38bdf8",
    keywords: [
      "biceps",
      "brachialis",
      "coracobrachialis",
      "triceps",
      "brachioradialis",
    ],
    exerciseSearchTerms: [
      "biceps",
      "triceps",
      "brachial",
      "brachio-radial",
      "avant-bras",
      "grip",
    ],
  },
  psoas: {
    id: "psoas",
    color: "#a78bfa",
    keywords: ["iliacus", "psoas"],
    exerciseSearchTerms: ["psoas", "ilio-psoas", "iliaque"],
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
  cuisses: {
    id: "cuisses",
    color: "#14b8a6",
    keywords: [
      "femoris",
      "vastus",
      "sartorius",
      "adductor",
      "gracilis",
      "semimembranosus",
      "semitendinosus",
    ],
    exerciseSearchTerms: [
      "quadricep",
      "ischio",
      "adducteur",
      "jambe",
    ],
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
  "iliocostalis lumborum": "Ilio-costal des lombes",
  "iliocostalis thoracis": "Ilio-costal du thorax",
  "iliocostalis colli": "Ilio-costal du cou",
  "longissimus thoracis": "Longissimus du thorax",
  "longissimus capitis": "Longissimus de la tête",
  "longissimus colli": "Longissimus du cou",
  "spinalis capitis": "Épineux de la tête",
  "spinalis colli": "Épineux du cou",
  "spinalis thoracis": "Épineux du thorax",
  "ascending part of trapezius": "Trapèze ascendant",
  "descending part of trapezius": "Trapèze descendant",
  "transverse part of trapezius": "Trapèze transverse",
  "rhomboid major": "Grand rhomboïde",
  "rhomboid minor": "Petit rhomboïde",
  "latissimus dorsi": "Grand dorsal",
  "clavicular head of pectoralis major": "Pectoral (claviculaire)",
  "sternocostal head of pectoralis major": "Pectoral (sterno-costal)",
  "abdominal part of pectoralis major": "Pectoral (abdominal)",
  "pectoralis minor": "Petit pectoral",
  "serratus anterior": "Dentelé antérieur",
  "rectus abdominis": "Grand droit abdomen",
  "external abdominal oblique": "Oblique externe",
  "internal abdominal oblique": "Oblique interne",
  "transversus abdominis": "Transverse abdomen",
  "acromial part of deltoid": "Deltoïde moyen",
  "clavicular part of deltoid": "Deltoïde antérieur",
  "scapular spinal part of deltoid": "Deltoïde postérieur",
  supraspinatus: "Supra-épineux",
  infraspinatus: "Infra-épineux",
  "teres major": "Grand rond",
  "long head of biceps brachii": "Biceps (long chef)",
  "short head of biceps brachii": "Biceps (court chef)",
  brachialis: "Brachial",
  coracobrachialis: "Coraco-brachial",
  "medial head of triceps brachii": "Triceps (médial)",
  "lateral head of triceps brachii": "Triceps (latéral)",
  "long head of triceps brachii": "Triceps (long chef)",
  brachioradialis: "Brachio-radial",
  iliacus: "Iliaque",
  "psoas major": "Psoas",
  "gluteus medius": "Moyen fessier",
  "gluteus maximus": "Grand fessier",
  "gluteus minimus": "Petit fessier",
  "rectus femoris": "Droit fémoral",
  "vastus lateralis": "Vaste latéral",
  "vastus medialis": "Vaste médial",
  "vastus intermedius": "Vaste intermédiaire",
  sartorius: "Couturier",
  "adductor magnus": "Grand adducteur",
  "adductor longus": "Long adducteur",
  "adductor brevis": "Court adducteur",
  gracilis: "Gracile",
  "long head of biceps femoris": "Biceps fémoral (long)",
  "short head of biceps femoris": "Biceps fémoral (court)",
  semimembranosus: "Semi-membraneux",
  semitendinosus: "Semi-tendineux",
  "lateral head of gastrocnemius": "Gastrocnémien latéral",
  "medial head of gastrocnemius": "Gastrocnémien médial",
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
