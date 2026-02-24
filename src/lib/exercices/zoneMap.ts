export type Zone = "haut" | "milieu" | "bas";

const ZONE_KEYWORDS: Record<Zone, string[]> = {
  haut: [
    "pectora", "deltoid", "biceps", "triceps", "dorsal", "trapez",
    "épaule", "epaule", "bras", "rond", "rhombo",
  ],
  milieu: [
    "abdo", "transverse", "oblique", "lombaire", "dentelé", "dentele",
    "tronc", "carré", "carre",
  ],
  bas: [
    "quadriceps", "ischio", "fessier", "mollet", "cuisse", "jambe",
    "adduct", "soléaire", "soleaire",
  ],
};

export function getZone(muscle: string): Zone {
  const lower = muscle.toLowerCase();
  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS) as [Zone, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return zone;
  }
  return "haut"; // default fallback
}

export function checkBalance(
  allMuscles: string[][],
): { zone: Zone; count: number }[] {
  const counts: Record<Zone, number> = { haut: 0, milieu: 0, bas: 0 };
  for (const muscles of allMuscles) {
    const zones = new Set(muscles.map(getZone));
    for (const z of zones) counts[z]++;
  }
  return (Object.entries(counts) as [Zone, number][])
    .filter(([, count]) => count > 3)
    .map(([zone, count]) => ({ zone, count }));
}
