import { normalizeForSearch as normalize } from "@/lib/text/normalize";

/* ═══════════════════════════════════════════════════════════════════════════
   8 groupes musculaires EPS — Nomenclature anatomique 2019
   (Terminologia Anatomica)

   SOURCE DE VÉRITÉ UNIQUE pour toute l'app :
   chips, mannequin 3D, filtres, légende.
   ═══════════════════════════════════════════════════════════════════════════ */

export type MuscleGroupId =
  | "pectoraux"
  | "dorsaux"
  | "epaules"
  | "bras"
  | "abdominaux"
  | "cuisses"
  | "fessiers"
  | "mollets";

export const MUSCLE_GROUP_IDS: readonly MuscleGroupId[] = [
  "pectoraux",
  "dorsaux",
  "epaules",
  "bras",
  "abdominaux",
  "cuisses",
  "fessiers",
  "mollets",
];

/* ── Couleurs par groupe (identiques mannequin + chips + légende) ───────── */

export const MUSCLE_GROUP_COLORS: Record<MuscleGroupId, string> = {
  pectoraux: "#EF4444",
  dorsaux: "#3B82F6",
  epaules: "#F97316",
  bras: "#06B6D4",
  abdominaux: "#A855F7",
  cuisses: "#22C55E",
  fessiers: "#EC4899",
  mollets: "#14B8A6",
};

/* ── Muscles officiels avec ancienne appellation ───────────────────────── */

export type OfficialMuscle = {
  name: string;
  oldName?: string;
};

export const GROUP_OFFICIAL_MUSCLES: Record<MuscleGroupId, OfficialMuscle[]> = {
  pectoraux: [
    { name: "Grand pectoral" },
    { name: "Dentelé antérieur", oldName: "Grand dentelé" },
  ],
  dorsaux: [
    { name: "Grand dorsal" },
    { name: "Trapèze" },
    { name: "Rhomboïde" },
    { name: "Infra-épineux", oldName: "Sous-épineux" },
    { name: "Grand rond" },
    { name: "Petit rond" },
    { name: "Érecteurs du rachis", oldName: "Spinaux dorsaux" },
  ],
  epaules: [
    { name: "Deltoïde" },
  ],
  bras: [
    { name: "Biceps brachial" },
    { name: "Triceps brachial" },
    { name: "Avant-bras" },
  ],
  abdominaux: [
    { name: "Droit de l'abdomen", oldName: "Grand droit" },
    { name: "Oblique externe" },
    { name: "Oblique interne" },
    { name: "Transverse de l'abdomen" },
  ],
  cuisses: [
    { name: "Quadriceps fémoral" },
    { name: "Ischio-jambiers" },
    { name: "Adducteurs" },
    { name: "Ilio-psoas", oldName: "Psoas-iliaque" },
    { name: "Sartorius", oldName: "Couturier" },
  ],
  fessiers: [
    { name: "Grand glutéal", oldName: "Grand fessier" },
    { name: "Moyen glutéal", oldName: "Moyen fessier" },
    { name: "Piriforme", oldName: "Pyramidal" },
  ],
  mollets: [
    { name: "Gastrocnémiens", oldName: "Jumeaux" },
    { name: "Soléaire" },
    { name: "Tibial antérieur", oldName: "Jambier antérieur" },
  ],
};

/* ── Alias de matching par groupe ──────────────────────────────────────── */

// Ordonnés du plus long au plus court à la construction du reverse lookup
const MUSCLE_GROUP_ALIASES: Record<MuscleGroupId, string[]> = {
  pectoraux: [
    "pectoral", "pectoraux", "dentele", "denteles",
    "grand dentele", "pectoraux superieurs", "pectoraux claviculaires",
    "pectoraux internes", "pectoraux inferieurs", "pectoraux externes",
    "portion claviculaire des pectoraux",
  ],
  dorsaux: [
    "dorsal", "dorsaux", "grand dorsal", "trapeze",
    "trapezes", "trapezes moyens", "trapezes superieurs",
    "trapezes inferieurs", "rhomboide", "rhomboides", "infra-epineux",
    "sous-epineux", "grand rond", "petit rond", "erecteurs", "erecteurs du rachis",
    "spinaux", "spinaux dorsaux", "carre des lombes",
    "lombaires", "erecteur",
  ],
  epaules: [
    "deltoide", "deltoides", "deltoides anterieurs",
    "deltoides moyens", "deltoides posterieurs", "deltoides anterieur",
    "deltoides moyen", "deltoides posterieur", "coiffe des rotateurs",
    "supra-epineux", "subscapulaire", "sus-epineux", "faisceau lateral",
    "faisceau anterieur", "faisceau posterieur",
  ],
  bras: [
    "biceps brachial", "brachial anterieur",
    "triceps brachial", "triceps brachiaux",
    "brachio-radial", "long supinateur",
    "avant-bras", "extenseurs", "flechisseurs des doigts",
    "flechisseurs du poignet", "extenseurs du poignet",
    "avant-bras (grip)",
  ],
  abdominaux: [
    "abdominaux", "abdo", "abdos", "grand droit",
    "grand droit des abdominaux", "grand droit complet",
    "grand droit de l'abdomen", "droit de l'abdomen",
    "obliques", "obliques externes", "obliques internes",
    "oblique externe", "oblique interne", "grand oblique",
    "petit oblique", "transverse", "transverse de l'abdomen",
    "stabilisateurs", "gainage", "sangle abdominale",
    "obliques externes et internes",
    "obliques externes et internes droits",
    "obliques externes et internes gauches",
    "abdominaux (stabilisation)",
    "grand droit des abdominaux (portion superieure)",
    "grand droit (portion inferieure)",
  ],
  cuisses: [
    "quadriceps", "quadricep", "droit femoral",
    "droit anterieur", "vaste medial", "vaste lateral",
    "vaste intermediaire", "ischio-jambiers", "ischio", "ischios",
    "semi-tendineux", "semi-membraneux", "biceps femoral",
    "adducteurs", "adducteur", "grand adducteur", "court adducteur",
    "long adducteur", "gracile", "droit interne",
    "ilio-psoas", "psoas", "psoas-iliaque", "psoas iliaque",
    "sartorius", "couturier", "tenseur du fascia lata",
    "tenseur fasciae latae", "tension-fasciae latae",
    "abducteurs",
    "quadriceps (jambe avant)",
    "ischio-jambiers (excentrique intense)",
  ],
  fessiers: [
    "fessier", "fessiers", "grand fessier",
    "moyen fessier", "petit fessier", "grand gluteal",
    "moyen gluteal", "petit gluteal", "piriforme", "pyramidal",
  ],
  mollets: [
    "mollet", "mollets", "gastrocnemiens",
    "gastrocnemien", "jumeaux", "soleaire", "soleaires", "triceps sural",
    "tibial anterieur", "jambier anterieur", "fibulaires",
    "peronier", "long peronier lateral",
  ],
};

/* ── Fantômes (qualités physiques, pas des muscles) ────────────────────── */

const PHANTOM_MUSCLES = new Set([
  "anti-rotation",
  "cardio",
  "coordination",
  "equilibre",
  "equilibre dynamique",
  "mobilite cheville",
  "rotation",
  "rotation et flexion",
  "rotation thoracique",
  "stabilisateurs profonds",
]);

/* ── Normalisation d'un nom de muscle frontmatter ──────────────────────── */

function normalizeMuscle(raw: string): string {
  return normalize(raw)
    .replace(/\s*\([^)]*\)\s*/g, " ") // supprimer parenthèses
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Construction du reverse lookup ────────────────────────────────────── */

// Exact match lookup : alias normalisé → groupId
const exactLookup = new Map<string, MuscleGroupId>();

// All aliases sorted longest-first for substring matching
const sortedAliases: { normalized: string; groupId: MuscleGroupId }[] = [];

for (const [groupId, aliases] of Object.entries(MUSCLE_GROUP_ALIASES) as [MuscleGroupId, string[]][]) {
  for (const alias of aliases) {
    const norm = normalize(alias);
    exactLookup.set(norm, groupId);
    sortedAliases.push({ normalized: norm, groupId });
  }
}

// Sort aliases longest-first for substring matching to avoid false positives
// e.g. "biceps femoral" matches CUISSES before "biceps" matches BRAS
sortedAliases.sort((a, b) => b.normalized.length - a.normalized.length);

/* ── Public API ────────────────────────────────────────────────────────── */

/** Return the muscle group ID for a single muscle name, or null if phantom/unknown. */
export function getMuscleGroup(muscleName: string): MuscleGroupId | null {
  const key = normalizeMuscle(muscleName);

  // Phantom muscles — exclude silently
  if (PHANTOM_MUSCLES.has(key)) return null;

  // 1. Exact match first
  const exact = exactLookup.get(key);
  if (exact) return exact;

  // 2. Substring match (longest alias first to avoid false positives)
  for (const { normalized, groupId } of sortedAliases) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return groupId;
    }
  }

  return null;
}

/** Return all unique muscle group IDs that match at least one muscle from the exercise. */
export function getMuscleGroups(muscles: string[]): MuscleGroupId[] {
  const groups = new Set<MuscleGroupId>();
  for (const muscle of muscles) {
    const group = getMuscleGroup(muscle);
    if (group) groups.add(group);
  }
  return MUSCLE_GROUP_IDS.filter((id) => groups.has(id));
}

/** Alias for getMuscleGroups — named for clarity when mapping an exercise's muscle list. */
export const getMuscleGroupsForExercise = getMuscleGroups;

/** Check if an exercise's muscles match any of the selected groups. */
export function matchesMuscleGroups(
  exerciseMuscles: string[],
  selectedGroups: MuscleGroupId[],
): boolean {
  if (selectedGroups.length === 0) return true;
  const exerciseGroups = getMuscleGroups(exerciseMuscles);
  return selectedGroups.some((group) => exerciseGroups.includes(group));
}

/* ── Mapping ancien 12 groupes anatomy → nouveau 8 groupes ─────────── */

export const ANATOMY_TO_GROUP: Record<string, MuscleGroupId> = {
  pectoraux: "pectoraux",
  epaules: "epaules",
  bras_anterieurs: "bras",
  triceps: "bras",
  abdominaux: "abdominaux",
  dos: "dorsaux",
  fessiers: "fessiers",
  cuisses_avant: "cuisses",
  cuisses_arriere: "cuisses",
  adducteurs: "cuisses",
  mollets: "mollets",
  flechisseurs: "cuisses",
};

/* ── Affichage avec ancienne appellation ───────────────────────────────── */

/** Map of normalized muscle names → { officialName, oldName? } for display */
const displayNameLookup = new Map<string, { official: string; oldName?: string }>();

// Build from GROUP_OFFICIAL_MUSCLES
for (const muscles of Object.values(GROUP_OFFICIAL_MUSCLES)) {
  for (const m of muscles) {
    displayNameLookup.set(normalize(m.name), { official: m.name, oldName: m.oldName });
    if (m.oldName) {
      displayNameLookup.set(normalize(m.oldName), { official: m.name, oldName: m.oldName });
    }
  }
}

export type MuscleDisplayName = {
  /** The official 2019 name */
  official: string;
  /** The old name, if different from official */
  oldName?: string;
};

/**
 * Get the official 2019 display name for a frontmatter muscle.
 * Returns the official name + old name if applicable.
 * If no mapping found, returns the original name as-is.
 */
export function getMuscleDisplayName(frontmatterMuscle: string): MuscleDisplayName {
  const key = normalizeMuscle(frontmatterMuscle);
  const entry = displayNameLookup.get(key);
  if (entry) return entry;

  // Try substring match against alias → find group → find closest official muscle
  const groupId = getMuscleGroup(frontmatterMuscle);
  if (groupId) {
    const officials = GROUP_OFFICIAL_MUSCLES[groupId];
    // Strip trailing 's' for plural tolerance (e.g. "denteles" → "dentele")
    const keySingular = key.endsWith("s") ? key.slice(0, -1) : key;
    for (const m of officials) {
      const normOfficial = normalize(m.name);
      const normOld = m.oldName ? normalize(m.oldName) : null;
      if (key.includes(normOfficial) || normOfficial.includes(key)
        || keySingular.includes(normOfficial) || normOfficial.includes(keySingular)) {
        return { official: m.name, oldName: m.oldName };
      }
      if (normOld && (key.includes(normOld) || normOld.includes(key)
        || keySingular.includes(normOld) || normOld.includes(keySingular))) {
        return { official: m.name, oldName: m.oldName };
      }
    }
  }

  // Fallback: return the original name capitalized
  return { official: frontmatterMuscle };
}

/* ── GLB mesh → group mapping (pour le mannequin 3D) ──────────────────── */

/** Keywords to match GLB mesh node names to the 8 groups */
export const MESH_KEYWORDS: Record<MuscleGroupId, string[]> = {
  pectoraux: ["pectoralis", "serratus"],
  dorsaux: [
    "iliocostalis", "longissimus", "spinalis",
    "trapezius", "rhomboid", "latissimus",
    "quadratus lumborum", "erector spinae",
    "levator scapulae", "sternocleidomastoid",
  ],
  epaules: ["deltoid", "supraspinatus", "infraspinatus", "teres", "subscapularis"],
  bras: [
    "biceps brachii", "brachialis", "coracobrachialis", "brachioradialis",
    "extensor digitorum", "flexor carpi", "triceps",
  ],
  abdominaux: ["abdominis", "oblique", "transversus"],
  cuisses: [
    "rectus femoris", "vastus", "sartorius",
    "semimembranosus", "semitendinosus", "biceps femoris", "popliteus",
    "adductor", "gracilis",
    "iliacus", "psoas",
  ],
  fessiers: ["gluteus", "tensor fasciae", "piriformis"],
  mollets: ["gastrocnemius", "soleus", "tibialis", "fibularis"],
};

/** Find which 8-group a GLB mesh node belongs to */
export function getGroupForMeshNode(raw: string): MuscleGroupId | null {
  const norm = raw.toLowerCase();
  for (const [groupId, keywords] of Object.entries(MESH_KEYWORDS) as [MuscleGroupId, string[]][]) {
    if (keywords.some((kw) => norm.includes(kw))) return groupId;
  }
  return null;
}
