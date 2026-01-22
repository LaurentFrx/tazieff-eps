export type Lang = "fr" | "en";

export const messages = {
  fr: {
    header: {
      subtitle: "Architecture application",
      status: "Mobile d'abord",
    },
    settings: {
      title: "Réglages",
      language: {
        label: "Langue",
        fr: "Français",
        en: "Anglais",
      },
      theme: {
        label: "Thème",
        system: "Système",
        light: "Clair",
        dark: "Sombre",
      },
    },
    nav: {
      exos: { label: "Exos", meta: "Mouvements" },
      seances: { label: "Séances", meta: "Plan" },
      apprendre: { label: "Apprendre", meta: "Savoir" },
      progres: { label: "Progrès", meta: "Suivi" },
    },
    pages: {
      exos: {
        eyebrow: "Exos",
        title: "Construire des blocs efficaces",
        lede: "Commencez par une liste claire d'exercices et gardez le rythme.",
        cards: {
          catalogue: {
            tag: "Catalogue",
            title: "Catalogue",
            body: "Parcourez une liste claire de mouvements pour composer vos blocs.",
          },
          focus: {
            tag: "Cible",
            title: "Ciblage",
            body: "Filtrez par objectif, matériel ou intensité.",
          },
          quickset: {
            tag: "Bloc rapide",
            title: "Bloc rapide",
            body: "Préparez un enchaînement court et gardez le tempo.",
          },
        },
      },
      seances: {
        eyebrow: "Séances",
        title: "Planifier des séances simples",
        lede: "Gardez une structure légère pour répéter sans friction.",
        cards: {
          weekly: {
            tag: "Plan",
            title: "Carte de la semaine",
            body: "Esquissez une semaine avec des jours prioritaires.",
          },
          flow: {
            tag: "Tempo",
            title: "Flux de séance",
            body: "Enchaînez échauffement, travail, retour au calme.",
          },
          notes: {
            tag: "Notes",
            title: "Notes",
            body: "Ajoutez des repères courts pour la prochaine séance.",
          },
        },
      },
      apprendre: {
        eyebrow: "Apprendre",
        title: "Apprendre l'essentiel",
        lede: "Des leçons courtes, faciles à relire avant l'entraînement.",
        cards: {
          basics: {
            tag: "Bases",
            title: "Bases",
            body: "Posture, tempo, récupération expliqués simplement.",
          },
          guides: {
            tag: "Guides",
            title: "Guides",
            body: "Approfondissements adaptés à chaque objectif.",
          },
          glossary: {
            tag: "Lexique",
            title: "Lexique",
            body: "Définitions rapides pour rester clair.",
          },
        },
      },
      progres: {
        eyebrow: "Progrès",
        title: "Suivre vos progrès",
        lede: "Gardez une vue claire des gains et des prochains pas.",
        cards: {
          checkins: {
            tag: "Suivi",
            title: "Points réguliers",
            body: "Notez force et effort pour voir les tendances.",
          },
          milestones: {
            tag: "Objectifs",
            title: "Paliers",
            body: "Fixez de petits objectifs et validez chaque semaine.",
          },
          insights: {
            tag: "Bilan",
            title: "Bilan",
            body: "Repérez les schémas et ajustez le plan.",
          },
        },
      },
      settings: {
        eyebrow: "Réglages",
        title: "Préférences",
        lede: "Choisissez la langue et le thème pour personnaliser l'app.",
        languageHelp: "La langue s'applique à tous les écrans.",
        themeHelp: "Suivez le système ou forcez un mode fixe.",
      },
    },
    pwaBanner: {
      title: "Installer l'app",
      body: "Pour un affichage plein écran (sans menus iOS).",
      hint: "Safari → Partager → « Sur l'écran d'accueil ».",
      close: "Fermer",
    },
  },
  en: {
    header: {
      subtitle: "App structure",
      status: "Mobile first",
    },
    settings: {
      title: "Settings",
      language: {
        label: "Language",
        fr: "French",
        en: "English",
      },
      theme: {
        label: "Theme",
        system: "System",
        light: "Light",
        dark: "Dark",
      },
    },
    nav: {
      exos: { label: "Exercises", meta: "Moves" },
      seances: { label: "Sessions", meta: "Plan" },
      apprendre: { label: "Learn", meta: "Guide" },
      progres: { label: "Progress", meta: "Track" },
    },
    pages: {
      exos: {
        eyebrow: "Exercises",
        title: "Build stronger blocks",
        lede: "Start with a focused list of moves and keep the pace steady.",
        cards: {
          catalogue: {
            tag: "Library",
            title: "Catalog",
            body: "Browse a clear list of movements to shape your blocks.",
          },
          focus: {
            tag: "Target",
            title: "Focus",
            body: "Filter by goal, equipment, or intensity.",
          },
          quickset: {
            tag: "Quick set",
            title: "Quick set",
            body: "Draft a short sequence and keep your tempo.",
          },
        },
      },
      seances: {
        eyebrow: "Sessions",
        title: "Plan simple sessions",
        lede: "Keep a light structure so sessions stay repeatable.",
        cards: {
          weekly: {
            tag: "Plan",
            title: "Weekly map",
            body: "Sketch a week with clear focus days.",
          },
          flow: {
            tag: "Tempo",
            title: "Session flow",
            body: "Move from warmup to work to cooldown smoothly.",
          },
          notes: {
            tag: "Notes",
            title: "Notes",
            body: "Add short cues for the next session.",
          },
        },
      },
      apprendre: {
        eyebrow: "Learn",
        title: "Learn the essentials",
        lede: "Short lessons you can scan before training.",
        cards: {
          basics: {
            tag: "Basics",
            title: "Basics",
            body: "Form, tempo, and recovery explained simply.",
          },
          guides: {
            tag: "Guides",
            title: "Guides",
            body: "Deeper dives tuned to each goal.",
          },
          glossary: {
            tag: "Glossary",
            title: "Glossary",
            body: "Quick definitions to stay consistent.",
          },
        },
      },
      progres: {
        eyebrow: "Progress",
        title: "Track your progress",
        lede: "Keep a clear view of gains and next steps.",
        cards: {
          checkins: {
            tag: "Track",
            title: "Check-ins",
            body: "Log strength and effort to spot trends.",
          },
          milestones: {
            tag: "Goals",
            title: "Milestones",
            body: "Set small wins and review them weekly.",
          },
          insights: {
            tag: "Review",
            title: "Insights",
            body: "Spot patterns and adjust the plan.",
          },
        },
      },
      settings: {
        eyebrow: "Settings",
        title: "Preferences",
        lede: "Choose language and theme to personalize the app.",
        languageHelp: "The language applies across all screens.",
        themeHelp: "Follow the system or force a fixed mode.",
      },
    },
    pwaBanner: {
      title: "Install the app",
      body: "Get a full-screen view (without iOS browser UI).",
      hint: "Safari → Share → “Add to Home Screen”.",
      close: "Close",
    },
  },
} as const;

export type Messages = typeof messages.fr;
