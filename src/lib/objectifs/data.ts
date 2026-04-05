import type { Lang } from "@/lib/i18n/messages";

export type ObjectifSlug =
  | "endurance-de-force"
  | "gain-de-volume"
  | "gain-de-puissance";

export interface ObjectifData {
  slug: ObjectifSlug;
  gradient: string;
  colorAccent: string;
  icon: string;
  principe: Record<Lang, string>;
  description: Record<Lang, string>;
  params: {
    charge: string;
    repetitions: string;
    series: string;
    recuperation: string;
    rythme: string;
  };
  methodesSlugs: string[];
}

export const OBJECTIFS: ObjectifData[] = [
  {
    slug: "endurance-de-force",
    gradient: "linear-gradient(135deg, #059669, #34d399)",
    colorAccent: "#059669",
    icon: "heartbeat",
    principe: {
      fr: "Capacité de travail prolongé. Formats axés sur la densité d\u2019entraînement et la résistance à l\u2019effort.",
      en: "Prolonged Work Capacity. Formats focused on training density and resistance to fatigue.",
      es: "Capacidad de trabajo prolongado. Formatos centrados en la densidad de entrenamiento y la resistencia al esfuerzo.",
    },
    description: {
      fr: "Utilise des poids légers, des élastiques ou le poids du corps. Vise un volume élevé de répétitions pour stimuler l\u2019endurance musculaire. Maintiens un rythme cardiaque élevé et un stress métabolique constant grâce à une récupération courte.",
      en: "Use light weights, resistance bands, or bodyweight. Aim for a high volume of reps to build muscular endurance. Maintain an elevated heart rate and constant metabolic stress through short rest periods.",
      es: "Utiliza pesos ligeros, bandas elásticas o peso corporal. Apunta a un volumen elevado de repeticiones para estimular la resistencia muscular. Mantén un ritmo cardíaco elevado y un estrés metabólico constante gracias a recuperaciones cortas.",
    },
    params: {
      charge: "30-60% 1RM",
      repetitions: "15 - 30",
      series: "4",
      recuperation: "30 - 60 s",
      rythme: "1-2 s / phase",
    },
    methodesSlugs: [
      "charge-constante",
      "pyramide",
      "triple-tri-set",
      "defi-centurion",
      "amrap",
      "emom",
      "circuit-training",
    ],
  },
  {
    slug: "gain-de-volume",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    colorAccent: "#6366f1",
    icon: "barbell",
    principe: {
      fr: "Hypertrophie et intensification. Techniques visant à augmenter le temps sous tension et la fatigue métabolique.",
      en: "Hypertrophy and Intensification. Techniques designed to increase time under tension and metabolic fatigue.",
      es: "Hipertrofia e intensificación. Técnicas destinadas a aumentar el tiempo bajo tensión y la fatiga metabólica.",
    },
    description: {
      fr: "Travaille avec une charge suffisamment lourde pour stimuler les muscles (65-75% du 1RM). Le nombre de répétitions idéal (8-12) déclenche les mécanismes de croissance musculaire. La récupération incomplète maintient le muscle sous tension et fatigue, favorisant son développement. Maintiens une contraction constante durant les phases de montée et de descente pour maximiser la stimulation.",
      en: "Work with a load heavy enough to stimulate the muscles (65-75% of 1RM). The ideal rep range (8-12) triggers muscle growth mechanisms. Incomplete recovery keeps the muscle under tension and fatigue, promoting development. Maintain constant contraction during both lifting and lowering phases to maximize stimulation.",
      es: "Trabaja con una carga suficientemente pesada para estimular los músculos (65-75% del 1RM). El rango ideal de repeticiones (8-12) activa los mecanismos de crecimiento muscular. La recuperación incompleta mantiene el músculo bajo tensión y fatiga, favoreciendo su desarrollo. Mantén una contracción constante durante las fases de subida y bajada para maximizar la estimulación.",
    },
    params: {
      charge: "65-75% 1RM",
      repetitions: "8 - 12",
      series: "6 - 10",
      recuperation: "1 min 30 - 2 min",
      rythme: "Lent / Slow / Lento",
    },
    methodesSlugs: [
      "drop-set",
      "super-set",
      "serie-brulante",
      "rest-pause",
      "aps",
      "pre-activation",
      "double-progression",
      "demi-pyramide",
    ],
  },
  {
    slug: "gain-de-puissance",
    gradient: "linear-gradient(135deg, #f97316, #ef4444)",
    colorAccent: "#f97316",
    icon: "bolt",
    principe: {
      fr: "Explosivité et recrutement nerveux. Méthodes favorisant la vitesse d\u2019exécution et la force maximale.",
      en: "Explosiveness and Neural Recruitment. Methods promoting execution speed and maximal strength.",
      es: "Explosividad y reclutamiento nervioso. Métodos que favorecen la velocidad de ejecución y la fuerza máxima.",
    },
    description: {
      fr: "L\u2019objectif est de produire un maximum de force en un minimum de temps. On utilise une charge modérée à lourde avec peu de répétitions et une récupération longue pour permettre au système nerveux de se régénérer. Chaque répétition doit être réalisée avec une intention d\u2019accélération maximale.",
      en: "The goal is to produce maximum force in minimum time. Use a moderate to heavy load with few reps and long recovery to allow the nervous system to regenerate. Every rep must be performed with maximum acceleration intent.",
      es: "El objetivo es producir la máxima fuerza en el mínimo tiempo. Se utiliza una carga moderada a pesada con pocas repeticiones y una recuperación larga para permitir al sistema nervioso regenerarse. Cada repetición debe realizarse con una intención de aceleración máxima.",
    },
    params: {
      charge: "~70% 1RM",
      repetitions: "3 - 5",
      series: "3 - 4",
      recuperation: "3 min",
      rythme: "Explosif / Explosive / Explosivo",
    },
    methodesSlugs: [
      "methode-bulgare",
      "pliometrie",
      "stato-dynamique",
      "demi-pyramide-force",
    ],
  },
];

export function getObjectifBySlug(slug: string): ObjectifData | undefined {
  return OBJECTIFS.find((o) => o.slug === slug);
}
