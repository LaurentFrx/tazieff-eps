export type AnatomyFace = "anterior" | "posterior";
export type AnatomyRegion = "upper" | "core" | "lower";

export type AnatomyZone = {
  id: string;
  face: AnatomyFace;
  searchTerms: string[];
  antagonist?: string;
  region: AnatomyRegion;
};

// ── 19 muscle zones ─────────────────────────────────────────────────────────
export const ANATOMY_ZONES: AnatomyZone[] = [
  // ── Anterior (9) ──────────────────────────────────────────────────────────
  {
    id: "pectoraux",
    face: "anterior",
    searchTerms: ["pectora", "portion claviculaire"],
    antagonist: "grand-dorsal",
    region: "upper",
  },
  {
    id: "biceps",
    face: "anterior",
    searchTerms: ["biceps", "brachial"],
    antagonist: "triceps",
    region: "upper",
  },
  {
    id: "avant-bras",
    face: "anterior",
    searchTerms: ["avant-bras", "brachio-radial", "grip"],
    region: "upper",
  },
  {
    id: "dentele",
    face: "anterior",
    searchTerms: ["dentel"],
    region: "upper",
  },
  {
    id: "abdominaux",
    face: "anterior",
    searchTerms: ["abdomin", "grand droit", "transverse", "gainage", "abdos"],
    antagonist: "carre-des-lombes",
    region: "core",
  },
  {
    id: "obliques",
    face: "anterior",
    searchTerms: ["oblique", "rotation"],
    region: "core",
  },
  {
    id: "quadriceps",
    face: "anterior",
    searchTerms: ["quadricep"],
    antagonist: "ischio-jambiers",
    region: "lower",
  },
  {
    id: "adducteurs",
    face: "anterior",
    searchTerms: ["adducteur"],
    region: "lower",
  },
  {
    id: "jambier-anterieur",
    face: "anterior",
    searchTerms: ["jambier", "tibial"],
    region: "lower",
  },

  // ── Posterior (10) ────────────────────────────────────────────────────────
  {
    id: "trapezes",
    face: "posterior",
    searchTerms: ["trapèze", "trapeze", "trapezes"],
    antagonist: "deltoides",
    region: "upper",
  },
  {
    id: "deltoides",
    face: "posterior",
    searchTerms: ["deltoïde", "deltoide", "épaule", "epaule"],
    antagonist: "trapezes",
    region: "upper",
  },
  {
    id: "grand-dorsal",
    face: "posterior",
    searchTerms: ["grand dorsal", "dorsaux", "dorsal"],
    antagonist: "pectoraux",
    region: "upper",
  },
  {
    id: "triceps",
    face: "posterior",
    searchTerms: ["triceps"],
    antagonist: "biceps",
    region: "upper",
  },
  {
    id: "infra-epineux",
    face: "posterior",
    searchTerms: ["infra", "rhomboïde", "rhomboide", "grand rond"],
    region: "upper",
  },
  {
    id: "carre-des-lombes",
    face: "posterior",
    searchTerms: ["carré des lombes", "carre des lombes", "lombaire", "érecteur", "erecteur"],
    antagonist: "abdominaux",
    region: "core",
  },
  {
    id: "grand-fessier",
    face: "posterior",
    searchTerms: ["grand fessier", "fessier"],
    region: "lower",
  },
  {
    id: "moyen-fessier",
    face: "posterior",
    searchTerms: ["moyen fessier", "abducteur"],
    region: "lower",
  },
  {
    id: "ischio-jambiers",
    face: "posterior",
    searchTerms: ["ischio"],
    antagonist: "quadriceps",
    region: "lower",
  },
  {
    id: "mollets",
    face: "posterior",
    searchTerms: ["mollet", "gastrocnémien", "gastrocnemien", "soléaire", "soleaire"],
    region: "lower",
  },
];

// ── Agonist / antagonist pairs ──────────────────────────────────────────────
export const AGONIST_PAIRS: [string, string][] = [
  ["biceps", "triceps"],
  ["quadriceps", "ischio-jambiers"],
  ["pectoraux", "grand-dorsal"],
  ["deltoides", "trapezes"],
  ["abdominaux", "carre-des-lombes"],
];

// ── Helpers ─────────────────────────────────────────────────────────────────
export function getZone(id: string) {
  return ANATOMY_ZONES.find((z) => z.id === id);
}

export function getAntagonist(id: string) {
  const zone = getZone(id);
  if (!zone?.antagonist) return null;
  return getZone(zone.antagonist) ?? null;
}

export function getZonesByFace(face: AnatomyFace) {
  return ANATOMY_ZONES.filter((z) => z.face === face);
}

export function matchesZone(zone: AnatomyZone, muscleLabel: string): boolean {
  const lower = muscleLabel.toLowerCase();
  return zone.searchTerms.some((term) => lower.includes(term));
}
