export interface GlossaryTerm {
  term: string;
  variants: string[];
  href: string;
  tooltip: string;
  type: "glossaire" | "anatomie" | "methode" | "concept";
}

/**
 * Dictionnaire de termes auto-linkables dans le contenu MDX.
 * Trié par longueur décroissante du term principal pour éviter les faux positifs
 * (ex: "RM" ne doit pas matcher dans "AMRAP").
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── Méthodes (noms longs d'abord) ──
  { term: "Double Progression", variants: ["double progression", "double-progression"], href: "/methodes/double-progression", tooltip: "Progression en reps puis en charge", type: "methode" },
  { term: "Circuit Training", variants: ["circuit training", "circuit-training"], href: "/methodes/circuit-training", tooltip: "Enchaînement d'exercices variés", type: "methode" },
  { term: "Charge Constante", variants: ["charge constante"], href: "/methodes/charge-constante", tooltip: "Même charge sur toutes les séries", type: "methode" },
  { term: "Stato-Dynamique", variants: ["stato-dynamique", "stato dynamique"], href: "/methodes/stato-dynamique", tooltip: "Pause isométrique suivie d'une phase explosive", type: "methode" },
  { term: "Série Brûlante", variants: ["série brûlante", "séries brûlantes", "serie brulante"], href: "/methodes/serie-brulante", tooltip: "Réps partielles en fin de série jusqu'à l'échec", type: "methode" },
  { term: "Défi Centurion", variants: ["défi centurion", "centurion"], href: "/methodes/defi-centurion", tooltip: "100 reps en un minimum de séries", type: "methode" },
  { term: "Triple Tri-Set", variants: ["triple tri-set", "triple tri set", "tri-set"], href: "/methodes/triple-tri-set", tooltip: "3 exercices enchaînés sans repos", type: "methode" },
  { term: "Pré-Activation", variants: ["pré-activation", "pre-activation", "préactivation"], href: "/methodes/pre-activation", tooltip: "Isolation avant polyarticulaire", type: "methode" },
  { term: "Méthode Bulgare", variants: ["méthode bulgare", "bulgare"], href: "/methodes/methode-bulgare", tooltip: "Alternance charges lourdes et légères", type: "methode" },
  { term: "Pliométrie", variants: ["pliométrie", "pliometrie", "pliométrique"], href: "/methodes/pliometrie", tooltip: "Enchaînement excentrique-concentrique explosif", type: "methode" },
  { term: "Rest Pause", variants: ["rest pause", "rest-pause"], href: "/methodes/rest-pause", tooltip: "Micro-repos de 10-20s pour cumuler plus de reps", type: "methode" },
  { term: "Super Set", variants: ["super set", "super-set", "superset"], href: "/methodes/super-set", tooltip: "2 exercices enchaînés sans repos", type: "methode" },
  { term: "Drop Set", variants: ["drop set", "drop-set", "dropset"], href: "/methodes/drop-set", tooltip: "Réduction de charge sans repos entre les séries", type: "methode" },
  { term: "Pyramide", variants: ["pyramide", "pyramidale", "méthode pyramidale"], href: "/methodes/pyramide", tooltip: "Charge croissante puis décroissante", type: "methode" },
  { term: "AMRAP", variants: ["amrap"], href: "/methodes/amrap", tooltip: "Maximum de reps ou tours en temps limité", type: "methode" },
  { term: "EMOM", variants: ["emom"], href: "/methodes/emom", tooltip: "Un exercice chaque minute", type: "methode" },
  { term: "APS", variants: ["aps", "antagonist paired set"], href: "/methodes/aps", tooltip: "Séries alternées agoniste-antagoniste", type: "methode" },

  // ── Concepts d'entraînement ──
  { term: "Surcharge progressive", variants: ["surcharge progressive"], href: "/apprendre/rm-rir-rpe", tooltip: "Augmentation graduelle de la charge", type: "concept" },
  { term: "Charge maximale", variants: ["charge maximale"], href: "/apprendre/rm-rir-rpe", tooltip: "Charge la plus lourde pour 1 rep", type: "concept" },
  { term: "Répétition Maximale", variants: ["répétition maximale"], href: "/apprendre/rm-rir-rpe", tooltip: "Charge max pour un nombre de reps donné", type: "glossaire" },

  // ── Types de contraction ──
  { term: "Concentrique", variants: ["concentrique", "concentriques"], href: "/apprendre/contractions", tooltip: "Contraction avec raccourcissement du muscle", type: "glossaire" },
  { term: "Excentrique", variants: ["excentrique", "excentriques"], href: "/apprendre/contractions", tooltip: "Contraction avec allongement du muscle", type: "glossaire" },
  { term: "Isométrique", variants: ["isométrique", "isométriques"], href: "/apprendre/contractions", tooltip: "Contraction sans changement de longueur", type: "glossaire" },

  // ── Sécurité ──
  { term: "Échauffement", variants: ["échauffement", "echauffement"], href: "/apprendre/securite", tooltip: "Préparation du corps avant l'effort", type: "concept" },
  { term: "Gainage", variants: ["gainage"], href: "/apprendre/securite", tooltip: "Stabilisation active du tronc", type: "concept" },
  { term: "Amplitude", variants: ["amplitude"], href: "/apprendre/securite", tooltip: "Étendue complète du mouvement", type: "concept" },

  // ── Groupes musculaires → Anatomie (8 groupes unifiés) ──
  { term: "Ischios-jambiers", variants: ["ischios-jambiers", "ischios", "ischio-jambiers"], href: "/apprendre/anatomie?muscles=cuisses", tooltip: "Muscles arrière de la cuisse", type: "anatomie" },
  { term: "Grand dorsal", variants: ["grand dorsal", "grands dorsaux"], href: "/apprendre/anatomie?muscles=dorsaux", tooltip: "Large muscle du dos", type: "anatomie" },
  { term: "Quadriceps", variants: ["quadriceps"], href: "/apprendre/anatomie?muscles=cuisses", tooltip: "Muscles avant de la cuisse", type: "anatomie" },
  { term: "Abdominaux", variants: ["abdominaux", "abdos"], href: "/apprendre/anatomie?muscles=abdominaux", tooltip: "Muscles de la sangle abdominale", type: "anatomie" },
  { term: "Pectoraux", variants: ["pectoraux"], href: "/apprendre/anatomie?muscles=pectoraux", tooltip: "Muscles de la poitrine", type: "anatomie" },
  { term: "Deltoïdes", variants: ["deltoïdes", "deltoides", "deltoïde"], href: "/apprendre/anatomie?muscles=epaules", tooltip: "Muscles de l'épaule", type: "anatomie" },
  { term: "Trapèzes", variants: ["trapèzes", "trapeze", "trapèze"], href: "/apprendre/anatomie?muscles=dorsaux", tooltip: "Muscles du haut du dos et du cou", type: "anatomie" },
  { term: "Fessiers", variants: ["fessiers", "fessier"], href: "/apprendre/anatomie?muscles=fessiers", tooltip: "Muscles des fesses", type: "anatomie" },
  { term: "Triceps", variants: ["triceps"], href: "/apprendre/anatomie?muscles=bras", tooltip: "Muscles arrière du bras", type: "anatomie" },
  { term: "Mollets", variants: ["mollets", "mollet"], href: "/apprendre/anatomie?muscles=mollets", tooltip: "Muscles arrière de la jambe", type: "anatomie" },
  { term: "Biceps", variants: ["biceps"], href: "/apprendre/anatomie?muscles=bras", tooltip: "Muscles avant du bras", type: "anatomie" },

  // ── Glossaire court (3 lettres — matché en dernier) ──
  { term: "RPE", variants: ["rpe"], href: "/apprendre/rm-rir-rpe", tooltip: "Échelle de perception de l'effort (1-10)", type: "glossaire" },
  { term: "RIR", variants: ["rir"], href: "/apprendre/rm-rir-rpe", tooltip: "Répétitions en réserve avant l'échec", type: "glossaire" },
  { term: "1RM", variants: ["1rm", "1 rm"], href: "/apprendre/rm-rir-rpe", tooltip: "Charge maximale pour 1 répétition", type: "glossaire" },
];
