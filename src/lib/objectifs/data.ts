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
      fr: "L\u2019endurance de force, c\u2019est la capacité de tes muscles à répéter un effort modéré pendant longtemps sans s\u2019épuiser. Concrètement, tu travailles avec des charges légères (30 à 60% de ton 1RM) et tu fais beaucoup de répétitions (15 à 30 par série). La récupération entre les séries est courte (30 à 60 secondes) pour maintenir ton rythme cardiaque élevé et créer un stress métabolique constant. Le rythme du mouvement est contrôlé : 1 à 2 secondes en montée et en descente. Ce type de travail améliore ta résistance musculaire, ta définition et ta capacité à tenir l\u2019effort dans la durée. C\u2019est le thème idéal pour débuter en musculation ou pour travailler la tonification.",
      en: "Strength endurance is your muscles\u2019 ability to sustain a moderate effort over a long period without fatiguing. In practice, you work with light loads (30\u201360% of your 1RM) and perform many reps (15\u201330 per set). Rest between sets is short (30\u201360 seconds) to keep your heart rate elevated and maintain constant metabolic stress. Movement tempo is controlled: 1\u20132 seconds up and down. This type of training improves muscular resilience, definition, and your capacity to sustain effort over time. It\u2019s the ideal theme for beginners or for toning work.",
      es: "La resistencia de fuerza es la capacidad de tus músculos para repetir un esfuerzo moderado durante mucho tiempo sin agotarse. En la práctica, trabajas con cargas ligeras (30 a 60% de tu 1RM) y realizas muchas repeticiones (15 a 30 por serie). La recuperación entre series es corta (30 a 60 segundos) para mantener tu ritmo cardíaco elevado y crear un estrés metabólico constante. El ritmo del movimiento es controlado: 1 a 2 segundos en subida y bajada. Este tipo de trabajo mejora tu resistencia muscular, tu definición y tu capacidad de mantener el esfuerzo en el tiempo. Es el tema ideal para empezar en musculación o para trabajar la tonificación.",
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
      fr: "Le gain de volume, aussi appelé hypertrophie, c\u2019est l\u2019augmentation de la taille de tes muscles. Pour y parvenir, tu travailles avec des charges moyennes à lourdes (65 à 75% de ton 1RM) et tu vises 8 à 12 répétitions par série — c\u2019est la zone idéale pour déclencher les mécanismes de croissance musculaire. Tu fais 6 à 10 séries par groupe musculaire pour créer un volume d\u2019entraînement suffisant. La récupération est incomplète (1 min 30 à 2 minutes) : elle maintient le muscle sous tension et fatigue, ce qui favorise son développement. Le rythme est lent et contrôlé, en maintenant une contraction constante en montée comme en descente pour maximiser le temps sous tension.",
      en: "Volume gain, also called hypertrophy, is the increase in the size of your muscles. To achieve this, you work with moderate to heavy loads (65\u201375% of your 1RM) and aim for 8\u201312 reps per set \u2014 the ideal range to trigger muscle growth mechanisms. You perform 6\u201310 sets per muscle group to create sufficient training volume. Recovery is incomplete (1 min 30 to 2 minutes): it keeps the muscle under tension and fatigue, promoting its development. Tempo is slow and controlled, maintaining constant contraction during both lifting and lowering phases to maximize time under tension.",
      es: "La ganancia de volumen, también llamada hipertrofia, es el aumento del tamaño de tus músculos. Para lograrlo, trabajas con cargas moderadas a pesadas (65 a 75% de tu 1RM) y apuntas a 8 a 12 repeticiones por serie \u2014 la zona ideal para activar los mecanismos de crecimiento muscular. Realizas de 6 a 10 series por grupo muscular para crear un volumen de entrenamiento suficiente. La recuperación es incompleta (1 min 30 a 2 minutos): mantiene el músculo bajo tensión y fatiga, favoreciendo su desarrollo. El ritmo es lento y controlado, manteniendo una contracción constante en subida y bajada para maximizar el tiempo bajo tensión.",
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
      fr: "Le gain de puissance vise à produire un maximum de force en un minimum de temps. C\u2019est l\u2019explosivité : la capacité à accélérer une charge le plus vite possible. Tu travailles avec des charges modérées à lourdes (environ 70% de ton 1RM) mais avec peu de répétitions (3 à 5 par série) et une intention d\u2019accélération maximale sur chaque mouvement. La récupération est longue (3 minutes) pour permettre à ton système nerveux de se régénérer complètement entre chaque série. Ce thème mobilise le recrutement nerveux : ton cerveau apprend à activer simultanément un maximum de fibres musculaires. C\u2019est un travail avancé, réservé aux élèves de Terminale qui maîtrisent déjà les placements et la technique.",
      en: "Power gain aims to produce maximum force in minimum time. It\u2019s explosiveness: the ability to accelerate a load as fast as possible. You work with moderate to heavy loads (around 70% of your 1RM) but with few reps (3\u20135 per set) and maximum acceleration intent on every movement. Recovery is long (3 minutes) to allow your nervous system to fully regenerate between sets. This theme focuses on neural recruitment: your brain learns to simultaneously activate the maximum number of muscle fibers. This is advanced work, reserved for Terminale students who already master positioning and technique.",
      es: "La ganancia de potencia busca producir la máxima fuerza en el mínimo tiempo. Es la explosividad: la capacidad de acelerar una carga lo más rápido posible. Trabajas con cargas moderadas a pesadas (alrededor del 70% de tu 1RM) pero con pocas repeticiones (3 a 5 por serie) y una intención de aceleración máxima en cada movimiento. La recuperación es larga (3 minutos) para permitir a tu sistema nervioso regenerarse completamente entre cada serie. Este tema moviliza el reclutamiento nervioso: tu cerebro aprende a activar simultáneamente el máximo de fibras musculares. Es un trabajo avanzado, reservado a los alumnos de Terminale que dominan los posicionamientos y la técnica.",
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
