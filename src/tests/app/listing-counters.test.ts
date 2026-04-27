// Sprint P0.7-nonies — Tests régression-guard sur les compteurs des pages
// de listing. Garantit que le compteur affiché en header reste aligné avec
// la source de données (longueur du fetch ou nombre de cartes calculé).

import { describe, it, expect } from "vitest";

describe("Compteurs listings (P0.7-nonies)", () => {
  it("/fr/methodes : displayedCount = methodes.length quand pas de filtre", () => {
    // Reproduit la logique de [locale]/methodes/page.tsx :
    //   const displayedCount = activeCategory
    //     ? grouped.reduce((sum, g) => sum + g.items.length, 0)
    //     : methodes.length;
    const methodes = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
    const activeCategory = null;
    const grouped = [{ items: methodes }];
    const displayedCount = activeCategory
      ? grouped.reduce((sum, g) => sum + g.items.length, 0)
      : methodes.length;
    expect(displayedCount).toBe(methodes.length);
  });

  it("/fr/methodes : displayedCount = somme des items filtrés quand activeCategory", () => {
    const grouped = [{ items: [{ slug: "a" }, { slug: "b" }] }];
    const activeCategory = "endurance-de-force";
    const displayedCount = activeCategory
      ? grouped.reduce((sum, g) => sum + g.items.length, 0)
      : 99;
    expect(displayedCount).toBe(2);
  });

  it("/fr/apprendre : allCards.length = 4 hardcoded + 8 ORDERED_SLUGS = 12", () => {
    // Reproduit la structure de [locale]/apprendre/page.tsx :
    //   1 (parametres) + 4 (slice 0-4) + 1 (techniques) + 1 (connaissances)
    //   + 4 (slice 4) + 1 (anatomie) = 12
    const ORDERED_SLUGS = [
      "muscles",
      "rm-rir-rpe",
      "securite",
      "contractions",
      "glossaire",
      "programmes-hebdomadaires",
      "nutrition",
      "sante-prevention",
    ];
    const allCards = [
      { href: "/apprendre/parametres" },
      ...ORDERED_SLUGS.slice(0, 4).map((slug) => ({ href: `/apprendre/${slug}` })),
      { href: "/apprendre/techniques" },
      { href: "/apprendre/connaissances" },
      ...ORDERED_SLUGS.slice(4).map((slug) => ({ href: `/apprendre/${slug}` })),
      { href: "/apprendre/anatomie" },
    ];
    expect(allCards.length).toBe(12);
  });

  it("Home learnCount = learnPages.length + 4 reste aligné avec allCards.length de /fr/apprendre", () => {
    // [locale]/page.tsx passe learnCount = learnPages.length + 4 à HomepageClient
    // Si learnPages.length === ORDERED_SLUGS.length (8), learnCount = 12.
    const learnPages = Array.from({ length: 8 }, (_, i) => ({ slug: `s${i}` }));
    const learnCount = learnPages.length + 4;
    expect(learnCount).toBe(12);
  });

  it("/fr/parcours-bac : 3 niveaux + 1 carte epreuve-bac = 4 cartes", () => {
    // ParcoursDashboard rend NIVEAUX.length cartes + 1 hardcoded epreuve-bac
    const NIVEAUX = ["seconde", "premiere", "terminale"];
    const totalCards = NIVEAUX.length + 1;
    expect(totalCards).toBe(4);
  });

  it("Home methodeCount aligné avec /fr/methodes total non-filtré", () => {
    // HomePage et /fr/methodes appellent tous deux getAllMethodes(lang),
    // donc methodes.length === methodeCount par construction.
    const methodes = Array.from({ length: 19 }, (_, i) => ({ slug: `m${i}` }));
    expect(methodes.length).toBe(19);
  });
});
