/**
 * Paires agoniste/antagoniste — anatomie fonctionnelle standard.
 * Clés normalisées en minuscules pour le matching.
 */
const MUSCLE_PAIRS: Record<string, string[]> = {
  pectoraux: ["dos", "grand dorsal", "trapèzes", "rhomboïdes"],
  dos: ["pectoraux"],
  "grand dorsal": ["pectoraux", "deltoïdes antérieurs"],
  quadriceps: ["ischios-jambiers", "ischios"],
  "ischios-jambiers": ["quadriceps"],
  ischios: ["quadriceps"],
  biceps: ["triceps"],
  triceps: ["biceps"],
  "deltoïdes antérieurs": ["deltoïdes postérieurs", "grand dorsal"],
  "deltoides anterieurs": ["deltoïdes postérieurs", "grand dorsal"],
  "deltoïdes postérieurs": ["deltoïdes antérieurs", "pectoraux"],
  "deltoides posterieurs": ["deltoïdes antérieurs", "pectoraux"],
  abdominaux: ["spinaux", "lombaires"],
  abdos: ["spinaux", "lombaires"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Returns antagonist muscle names for a list of muscles. */
export function getAntagonists(muscles: string[]): string[] {
  const result = new Set<string>();
  for (const m of muscles) {
    const key = normalize(m);
    // Check exact and normalized keys
    for (const [pairKey, antagonists] of Object.entries(MUSCLE_PAIRS)) {
      if (normalize(pairKey) === key) {
        for (const a of antagonists) result.add(a.toLowerCase());
      }
    }
  }
  return [...result];
}

/** Returns exercises targeting antagonist muscles of the given exercise. Max 4 results. */
export function getComplementaryExercises<T extends { slug: string; muscles: string[] }>(
  currentSlug: string,
  allExercises: T[],
): T[] {
  const current = allExercises.find((e) => e.slug === currentSlug);
  if (!current) return [];

  const antagonists = getAntagonists(current.muscles);
  if (antagonists.length === 0) return [];

  const scored = allExercises
    .filter((e) => e.slug !== currentSlug)
    .map((e) => {
      const matchCount = e.muscles.filter((m) =>
        antagonists.some((a) => normalize(a) === normalize(m)),
      ).length;
      return { exercise: e, matchCount };
    })
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  return scored.slice(0, 4).map((s) => s.exercise);
}
