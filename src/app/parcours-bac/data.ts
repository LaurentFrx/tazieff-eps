/**
 * Parcours BAC — checklist items & auto-evaluation questions
 * Source : Diapo Muscu'EPS de Frédérique Proisy (pages 60–65)
 */

export type Niveau = "seconde" | "premiere" | "terminale";
export type Competence = "realiser" | "concevoir" | "analyser" | "cooperer";

export type ChecklistItem = {
  text: string;
  link?: string;
};

export type CompetenceBlock = {
  key: Competence;
  items: ChecklistItem[];
};

export type NiveauData = {
  key: Niveau;
  subtitleKey: string;
  summaryKey: string;
  competences: CompetenceBlock[];
};

export const NIVEAUX: NiveauData[] = [
  {
    key: "seconde",
    subtitleKey: "parcours.initiation",
    summaryKey: "parcours.secondeSummary",
    competences: [
      {
        key: "realiser",
        items: [
          { text: "R\u00e9aliser les exercices avec une technique correcte (placement du dos, des appuis, amplitude, mouvements sans posture compensatoire)" },
          { text: "Ajuster la charge optimale pour 12 \u00e0 20 REP : charge l\u00e9g\u00e8re = 20 REP, mod\u00e9r\u00e9e = 15 REP, lourde = 12 REP" },
          { text: "Bien se placer, bien rythmer (mouvement + lent avec charge + lourde, + dynamique avec du l\u00e9ger)" },
          { text: "S\u2019engager dans une zone d\u2019effort adapt\u00e9e \u00e0 ses ressources" },
        ],
      },
      {
        key: "concevoir",
        items: [
          { text: "Conna\u00eetre les noms et la localisation d\u2019au moins 10 muscles", link: "/apprendre/muscles" },
          { text: "Viser un d\u00e9veloppement \u00e9quilibr\u00e9 des diff\u00e9rentes zones du corps (agonistes/antagonistes, stabilisateurs du tronc)", link: "/apprendre/muscles" },
          { text: "Conna\u00eetre et bien utiliser les param\u00e8tres n\u00e9cessaires (s\u00e9rie, REP, r\u00e9cup, intensit\u00e9 de la charge, rythme du mouvement)", link: "/apprendre/rm-rir-rpe" },
          { text: "Tenir un carnet d\u2019entra\u00eenement" },
        ],
      },
      {
        key: "analyser",
        items: [
          { text: "\u00c9valuer son ressenti en fin de s\u00e9rie pour r\u00e9guler la charge (localisation des sensations musculaires, niveau de difficult\u00e9)" },
          { text: "Utiliser une \u00e9chelle quantitative de perception de l\u2019effort : notion de RIR (combien de REP je pourrais encore faire ?)", link: "/apprendre/rm-rir-rpe" },
        ],
      },
      {
        key: "cooperer",
        items: [
          { text: "\u00catre un pratiquant responsable : manipulation des charges et du mat\u00e9riel, mise en place, remise en ordre apr\u00e8s utilisation" },
          { text: "Faire preuve de responsabilit\u00e9 et d\u2019engagement dans son r\u00f4le de partenaire : \u00eatre attentif \u00e0 l\u2019autre, le conseiller, le corriger", link: "/apprendre/securite" },
        ],
      },
    ],
  },
  {
    key: "premiere",
    subtitleKey: "parcours.consolidation",
    summaryKey: "parcours.premiereSummary",
    competences: [
      {
        key: "realiser",
        items: [
          { text: "Choisir un th\u00e8me : Endurance de Force ou Gain de volume" },
          { text: "R\u00e9aliser une s\u00e9ance de 45\u2019 sans temps mort, \u00e9chauffement compris", link: "/outils/ma-seance" },
          { text: "Organiser ses choix d\u2019ateliers et d\u2019exercices" },
          { text: "\u00catre en capacit\u00e9 de trouver un exercice de substitution si l\u2019atelier est occup\u00e9" },
          { text: "S\u2019engager et maintenir un engagement dans des zones d\u2019effort correspondant \u00e0 ses ressources et \u00e0 son th\u00e8me" },
        ],
      },
      {
        key: "concevoir",
        items: [
          { text: "Conna\u00eetre les param\u00e8tres pour les 2 th\u00e8mes d\u2019entra\u00eenement (Endurance de force et Gain de volume)" },
          { text: "Concevoir un programme coh\u00e9rent de 6 exercices choisis en lien avec son projet personnel", link: "/outils/ma-seance" },
          { text: "Les param\u00e8tres sont connus et ma\u00eetris\u00e9s avec coh\u00e9rence" },
          { text: "Le programme s\u2019articule autour d\u2019au moins 2 m\u00e9thodes d\u2019entra\u00eenement complexes exp\u00e9riment\u00e9es dans le cycle et en coh\u00e9rence avec le projet choisi", link: "/methodes" },
        ],
      },
      {
        key: "analyser",
        items: [
          { text: "Mettre en relation les indicateurs de ma\u00eetrise technique identifi\u00e9s pour ajuster globalement la charge et la r\u00e9cup\u00e9ration" },
          { text: "Identifier r\u00e9guli\u00e8rement des ressentis musculaires de difficult\u00e9 per\u00e7ue, en cours d\u2019action et apr\u00e8s son effort" },
          { text: "Utiliser \u00e0 bon escient la notion de RM et de RIR pour r\u00e9guler pr\u00e9cis\u00e9ment l\u2019intensit\u00e9", link: "/apprendre/rm-rir-rpe" },
        ],
      },
      {
        key: "cooperer",
        items: [
          { text: "S\u2019engager dans une relation avec un partenaire qui va permettre de confronter ses id\u00e9es, ses choix afin de s\u2019enrichir et d\u2019\u00e9largir ses comp\u00e9tences" },
          { text: "Observer et conseiller son partenaire de mani\u00e8re attentive pour l\u2019aider \u00e0 progresser" },
        ],
      },
    ],
  },
  {
    key: "terminale",
    subtitleKey: "parcours.optimisation",
    summaryKey: "parcours.terminaleSummary",
    competences: [
      {
        key: "realiser",
        items: [
          { text: "S\u2019engager dans une s\u00e9ance d\u2019entra\u00eenement de 45\u2019 garantissant le maintien dans des zones d\u2019efforts intenses et \u00e0 son plus haut niveau de ressources" },
          { text: "La s\u00e9ance propos\u00e9e doit r\u00e9pondre \u00e0 un projet personnel de transformation (Endurance/Volume/Puissance)", link: "/outils/ma-seance" },
          { text: "Ma\u00eetriser syst\u00e9matiquement tous les contenus relatifs aux placements et aux trajets moteurs", link: "/apprendre/securite" },
          { text: "Diff\u00e9rencier et adapter le rythme \u00e0 la m\u00e9thode choisie", link: "/methodes" },
        ],
      },
      {
        key: "concevoir",
        items: [
          { text: "Conna\u00eetre les param\u00e8tres pour les 3 th\u00e8mes d\u2019entra\u00eenement" },
          { text: "Concevoir un programme coh\u00e9rent de 6 exercices choisis en lien avec son projet personnel. Conna\u00eetre et ma\u00eetriser un grand nombre d\u2019exercices pour s\u2019adapter au contexte", link: "/outils/ma-seance" },
          { text: "Les param\u00e8tres sont connus et ma\u00eetris\u00e9s avec coh\u00e9rence" },
          { text: "Le programme s\u2019articule autour de la combinaison d\u2019au moins 3 m\u00e9thodes d\u2019entra\u00eenement complexes choisies pour leurs b\u00e9n\u00e9fices et pour intensifier les effets", link: "/methodes" },
        ],
      },
      {
        key: "analyser",
        items: [
          { text: "Capable de proc\u00e9der \u00e0 des r\u00e9gulations pertinentes \u00e0 partir du croisement d\u2019indicateurs chiffr\u00e9s et de diff\u00e9rents types de ressentis (Musculaires/Cardio/Psychologiques)" },
          { text: "Compr\u00e9hension et utilisation du RM et du RIR pour analyser et r\u00e9guler", link: "/apprendre/rm-rir-rpe" },
        ],
      },
      {
        key: "cooperer",
        items: [
          { text: "\u00catre un partenaire attentif, hyper pr\u00e9sent, qui compte les REP, aide \u00e0 l\u2019optimisation de la charge" },
          { text: "Identifier constamment le non respect de l\u2019amplitude et des postures s\u00e9curitaires", link: "/apprendre/securite" },
          { text: "Apporter des conseils pertinents et cibl\u00e9s par rapport aux actions de son partenaire" },
        ],
      },
    ],
  },
];

/* ── Auto-evaluation questions ── */

export type AutoEvalOption = {
  label: string;
  score: number; // 0 = beginner, 1 = in progress, 2 = validated
};

export type AutoEvalQuestion = {
  question: string;
  options: AutoEvalOption[];
};

export const AUTO_EVAL: Record<Niveau, AutoEvalQuestion[]> = {
  seconde: [
    {
      question: "Combien de muscles peux-tu nommer et localiser ?",
      options: [
        { label: "Moins de 5", score: 0 },
        { label: "5 \u00e0 10", score: 1 },
        { label: "Plus de 10", score: 2 },
      ],
    },
    {
      question: "Utilises-tu un carnet d\u2019entra\u00eenement ?",
      options: [
        { label: "Jamais", score: 0 },
        { label: "Parfois", score: 1 },
        { label: "Toujours", score: 2 },
      ],
    },
    {
      question: "Connais-tu la notion de RIR ?",
      options: [
        { label: "Non", score: 0 },
        { label: "Vaguement", score: 1 },
        { label: "Oui, je l\u2019utilise", score: 2 },
      ],
    },
  ],
  premiere: [
    {
      question: "Combien de m\u00e9thodes d\u2019entra\u00eenement ma\u00eetrises-tu ?",
      options: [
        { label: "0\u20131", score: 0 },
        { label: "2", score: 1 },
        { label: "3 ou plus", score: 2 },
      ],
    },
    {
      question: "Peux-tu concevoir une s\u00e9ance de 45\u2019 sans aide ?",
      options: [
        { label: "Non", score: 0 },
        { label: "Avec aide", score: 1 },
        { label: "Seul", score: 2 },
      ],
    },
    {
      question: "Utilises-tu le RM pour r\u00e9guler tes charges ?",
      options: [
        { label: "Non", score: 0 },
        { label: "Parfois", score: 1 },
        { label: "Syst\u00e9matiquement", score: 2 },
      ],
    },
  ],
  terminale: [
    {
      question: "Combines-tu 3+ m\u00e9thodes dans ta s\u00e9ance ?",
      options: [
        { label: "Non", score: 0 },
        { label: "2 m\u00e9thodes", score: 1 },
        { label: "3 ou plus", score: 2 },
      ],
    },
    {
      question: "Analyses-tu tes ressentis musculaires, cardio ET psychologiques ?",
      options: [
        { label: "1 type seulement", score: 0 },
        { label: "2 types", score: 1 },
        { label: "Les 3", score: 2 },
      ],
    },
    {
      question: "Ton partenaire te consid\u00e8re-t-il comme un coach efficace ?",
      options: [
        { label: "Pas vraiment", score: 0 },
        { label: "\u00c7a d\u00e9pend", score: 1 },
        { label: "Oui", score: 2 },
      ],
    },
  ],
};

/* ── Grille BAC (F4.4) ── */

export type GrilleCompetence = {
  titleKey: string;
  points: number;
  descriptionKey: string;
  links: { labelKey: string; href: string }[];
};

export const GRILLE_BAC: GrilleCompetence[] = [
  {
    titleKey: "parcours.grille.concevoir",
    points: 4,
    descriptionKey: "parcours.grille.concevoirDesc",
    links: [
      { labelKey: "parcours.grille.linkSeance", href: "/outils/ma-seance" },
    ],
  },
  {
    titleKey: "parcours.grille.realiserAnalyser",
    points: 8,
    descriptionKey: "parcours.grille.realiserAnalyserDesc",
    links: [
      { labelKey: "parcours.grille.linkExercices", href: "/exercices" },
      { labelKey: "parcours.grille.linkSecurite", href: "/apprendre/securite" },
    ],
  },
  {
    titleKey: "parcours.grille.sentrainer",
    points: 6,
    descriptionKey: "parcours.grille.sentrainerDesc",
    links: [
      { labelKey: "parcours.grille.linkMethodes", href: "/methodes" },
      { labelKey: "parcours.grille.linkContractions", href: "/apprendre/contractions" },
      { labelKey: "parcours.grille.linkAnatomie", href: "/apprendre/anatomie" },
    ],
  },
  {
    titleKey: "parcours.grille.cooperer",
    points: 2,
    descriptionKey: "parcours.grille.coopererDesc",
    links: [
      { labelKey: "parcours.grille.linkPartenaire", href: "/apprendre/securite" },
    ],
  },
];

/* ── Helpers ── */

export function storageKey(niveau: Niveau, competence: Competence): string {
  return `parcours-${niveau}-${competence}`;
}

export function getTotalItems(niveau: Niveau): number {
  const data = NIVEAUX.find((n) => n.key === niveau);
  if (!data) return 0;
  return data.competences.reduce((sum, c) => sum + c.items.length, 0);
}

export function getCheckedCount(niveau: Niveau): number {
  if (typeof window === "undefined") return 0;
  const data = NIVEAUX.find((n) => n.key === niveau);
  if (!data) return 0;
  let count = 0;
  for (const comp of data.competences) {
    const key = storageKey(niveau, comp.key);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        count += parsed.filter(Boolean).length;
      }
    } catch { /* ignore */ }
  }
  return count;
}
