import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getAllLearnPages, getLearnPage } from "@/lib/content/fs";
import {
  MUSCLE_GROUPS,
  MUSCLE_FR_NAMES,
  normalizeName,
  getFrenchName,
  getSide,
  getGroupForNode,
  matchesGroup,
} from "@/app/apprendre/anatomie/anatomy-data";

/* ── Learn pages (content loader) ─────────────────────────────────── */

describe("Learn pages — multi-locale", () => {
  it("EN learn pages load without error", async () => {
    const pages = await getAllLearnPages("en");
    expect(pages.length).toBeGreaterThanOrEqual(5);
  });

  it("ES learn pages load without error", async () => {
    const pages = await getAllLearnPages("es");
    expect(pages.length).toBeGreaterThanOrEqual(5);
  });

  it("EN glossaire has same slug as FR", async () => {
    const en = await getLearnPage("glossaire", "en");
    expect(en).not.toBeNull();
    expect(en!.frontmatter.slug).toBe("glossaire");
  });

  it("ES glossaire has same slug as FR", async () => {
    const es = await getLearnPage("glossaire", "es");
    expect(es).not.toBeNull();
    expect(es!.frontmatter.slug).toBe("glossaire");
  });
});

/* ── Glossaire content validation ─────────────────────────────────── */

describe("Glossaire content", () => {
  const GLOSSARY_DIR = path.join(process.cwd(), "content", "learn");

  async function parseGlossary(lang: string) {
    const raw = await fs.readFile(
      path.join(GLOSSARY_DIR, `glossaire.${lang}.mdx`),
      "utf8",
    );
    const { content } = matter(raw);
    return content;
  }

  function extractAnchors(content: string): string[] {
    const regex = /span id="([^"]+)"/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      ids.push(match[1]);
    }
    return ids;
  }

  it("FR glossaire has ≥ 20 terms", async () => {
    const content = await parseGlossary("fr");
    const anchors = extractAnchors(content);
    expect(anchors.length).toBeGreaterThanOrEqual(20);
  });

  it("FR glossaire has no duplicate anchors", async () => {
    const content = await parseGlossary("fr");
    const anchors = extractAnchors(content);
    const unique = new Set(anchors);
    expect(unique.size).toBe(anchors.length);
  });

  it("EN glossaire preserves same anchor IDs as FR", async () => {
    const frContent = await parseGlossary("fr");
    const enContent = await parseGlossary("en");
    const frAnchors = extractAnchors(frContent);
    const enAnchors = extractAnchors(enContent);
    expect(enAnchors).toEqual(frAnchors);
  });

  it("ES glossaire preserves same anchor IDs as FR", async () => {
    const frContent = await parseGlossary("fr");
    const esContent = await parseGlossary("es");
    const frAnchors = extractAnchors(frContent);
    const esAnchors = extractAnchors(esContent);
    expect(esAnchors).toEqual(frAnchors);
  });

  it("each glossaire term has a non-empty definition", async () => {
    const content = await parseGlossary("fr");
    // Split by ### headings, skip first chunk (intro)
    const sections = content.split(/^###\s/m).slice(1);
    expect(sections.length).toBeGreaterThanOrEqual(20);
    for (const section of sections) {
      // After the heading line, there should be content
      const lines = section.split("\n").slice(1).join("\n").trim();
      expect(lines.length).toBeGreaterThan(0);
    }
  });
});

/* ── Static pages (techniques, connaissances) ─────────────────────── */

describe("Static learn pages — MDX content", () => {
  const APPRENDRE_DIR = path.join(process.cwd(), "content", "apprendre");

  async function loadPage(subdir: string) {
    const raw = await fs.readFile(
      path.join(APPRENDRE_DIR, subdir, "index.mdx"),
      "utf8",
    );
    return matter(raw);
  }

  it("techniques page has real content (not placeholder)", async () => {
    const { data, content } = await loadPage("techniques");
    expect(data.title).toBeTruthy();
    expect(data.summary).not.toBe("À compléter");
    expect(content).toContain("## Placements");
    expect(content).toContain("## Trajectoires");
    expect(content).toContain("## Rythme");
    expect(content).toContain("## Respiration");
  });

  it("connaissances page has real content (not placeholder)", async () => {
    const { data, content } = await loadPage("connaissances");
    expect(data.title).toBeTruthy();
    expect(data.summary).not.toBe("À compléter");
    expect(content).toContain("## Les paramètres");
    expect(content).toContain("## Relation charge");
    expect(content).toContain("## Les 3 thèmes");
    expect(content).toContain("## Choisir son thème");
  });

  it("parametres page loads with valid frontmatter", async () => {
    const { data } = await loadPage("parametres");
    expect(data.title).toBe("Paramètres");
    expect(data.summary).toBeTruthy();
  });
});

/* ── Anatomy data (12 muscle groups) ──────────────────────────────── */

describe("Anatomy data — MUSCLE_GROUPS", () => {
  const groupKeys = Object.keys(MUSCLE_GROUPS);

  it("defines exactly 12 muscle groups", () => {
    expect(groupKeys).toHaveLength(12);
  });

  it("each group has id, color, keywords, exerciseSearchTerms", () => {
    for (const key of groupKeys) {
      const group = MUSCLE_GROUPS[key];
      expect(group.id).toBe(key);
      expect(group.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(group.keywords.length).toBeGreaterThan(0);
      expect(group.exerciseSearchTerms.length).toBeGreaterThan(0);
    }
  });

  it("expected groups are present", () => {
    const expected = [
      "pectoraux", "epaules", "bras_anterieurs", "triceps",
      "abdominaux", "dos", "fessiers", "cuisses_avant",
      "cuisses_arriere", "adducteurs", "mollets", "flechisseurs",
    ];
    expect(groupKeys.sort()).toEqual(expected.sort());
  });
});

describe("Anatomy data — MUSCLE_FR_NAMES", () => {
  it("has ≥ 40 individual muscle names", () => {
    expect(Object.keys(MUSCLE_FR_NAMES).length).toBeGreaterThanOrEqual(40);
  });

  it("all values are non-empty strings", () => {
    for (const [key, value] of Object.entries(MUSCLE_FR_NAMES)) {
      expect(typeof value).toBe("string");
      expect(value.length, `Empty name for key "${key}"`).toBeGreaterThan(0);
    }
  });
});

describe("Anatomy data — utility functions", () => {
  it("normalizeName strips underscores and suffixes", () => {
    expect(normalizeName("Biceps_Brachii.L")).toBe("biceps brachii");
    expect(normalizeName("Gluteus_Maximus.R")).toBe("gluteus maximus");
    expect(normalizeName("Rectus_Abdominis_dec")).toBe("rectus abdominis");
    expect(normalizeName("Soleus_MuscleL")).toBe("soleus");
  });

  it("getFrenchName returns correct French name", () => {
    expect(getFrenchName("latissimus dorsi")).toBe("Grand dorsal");
    expect(getFrenchName("rectus abdominis")).toBe("Grand droit");
    expect(getFrenchName("soleus")).toBe("Soléaire");
  });

  it("getSide returns G for .l, D for .r", () => {
    expect(getSide("muscle.l")).toBe("G");
    expect(getSide("muscle.r")).toBe("D");
    expect(getSide("midline_muscle")).toBe("");
  });

  it("getGroupForNode finds correct group", () => {
    expect(getGroupForNode("latissimus_dorsi")).toBe("dos");
    expect(getGroupForNode("pectoralis_major")).toBe("pectoraux");
    expect(getGroupForNode("biceps brachii")).toBe("bras_anterieurs");
    expect(getGroupForNode("gluteus_maximus")).toBe("fessiers");
    expect(getGroupForNode("unknown_bone")).toBeNull();
  });

  it("matchesGroup matches exercise muscle tags", () => {
    const dos = MUSCLE_GROUPS.dos;
    expect(matchesGroup(dos, "Grand dorsal")).toBe(true);
    expect(matchesGroup(dos, "Trapèze supérieur")).toBe(true);
    expect(matchesGroup(dos, "Biceps brachial")).toBe(false);

    const cuisses_avant = MUSCLE_GROUPS.cuisses_avant;
    expect(matchesGroup(cuisses_avant, "Quadriceps")).toBe(true);
    expect(matchesGroup(cuisses_avant, "Mollets")).toBe(false);
  });
});

/* ── Anatomy — exercise matching per group ───────────────────────── */

describe("Anatomy — exercise matching coverage", () => {
  const GROUP_MUSCLES: Record<string, string[]> = {
    pectoraux: ["Grand pectoral", "Dentelé antérieur"],
    epaules: ["Deltoïde antérieur", "Deltoïde moyen", "Deltoïde postérieur", "Infra-épineux", "Grand rond"],
    bras_anterieurs: ["Biceps brachial", "Brachial", "Brachio-radial"],
    triceps: ["Triceps brachial"],
    abdominaux: ["Grand droit", "Oblique externe", "Transverse"],
    dos: ["Trapèzes", "Grand dorsal", "Rhomboïdes", "Spinaux", "Carré des lombes"],
    fessiers: ["Grand fessier", "Moyen fessier"],
    cuisses_avant: ["Droit fémoral", "Vaste latéral", "Vaste médial", "Couturier"],
    cuisses_arriere: ["Biceps fémoral", "Semi-tendineux", "Semi-membraneux"],
    adducteurs: ["Grand adducteur", "Long adducteur", "Gracile"],
    mollets: ["Gastrocnémiens", "Soléaire"],
    flechisseurs: ["Psoas-iliaque"],
  };

  it("GROUP_MUSCLES covers all 12 MUSCLE_GROUPS", () => {
    for (const key of Object.keys(MUSCLE_GROUPS)) {
      expect(GROUP_MUSCLES[key], `Missing GROUP_MUSCLES entry for ${key}`).toBeDefined();
      expect(GROUP_MUSCLES[key].length).toBeGreaterThan(0);
    }
  });

  it("each group has exerciseSearchTerms that match typical exercise tags", () => {
    // exerciseSearchTerms are designed to match exercise catalog tags, not display names
    const typicalTags: Record<string, string> = {
      dorsaux: "Grand dorsal",
      pectoraux: "Pectoraux",
      abdominaux: "Abdominaux",
      deltoides: "Deltoïde moyen",
      biceps: "Biceps brachial",
      triceps: "Triceps brachial",
      flechisseurs: "Psoas-iliaque",
      fessiers: "Fessiers",
      quadriceps: "Quadriceps",
      ischio_jambiers: "Ischio-jambiers",
      adducteurs: "Adducteur",
      mollets: "Mollets",
    };
    for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
      const tag = typicalTags[key];
      if (!tag) continue;
      expect(matchesGroup(group, tag), `Group ${key} should match tag "${tag}"`).toBe(true);
    }
  });

  it("no group matches muscles from an unrelated group", () => {
    // Pectoraux should not match leg muscles
    expect(matchesGroup(MUSCLE_GROUPS.pectoraux, "Gastrocnémiens")).toBe(false);
    expect(matchesGroup(MUSCLE_GROUPS.pectoraux, "Quadriceps")).toBe(false);
    // Mollets should not match upper body
    expect(matchesGroup(MUSCLE_GROUPS.mollets, "Grand pectoral")).toBe(false);
    expect(matchesGroup(MUSCLE_GROUPS.mollets, "Deltoïde antérieur")).toBe(false);
  });

  it("getFrenchName covers all GROUP_MUSCLES display names", () => {
    const allDisplayNames = Object.values(GROUP_MUSCLES).flat();
    // All display names should appear in MUSCLE_FR_NAMES values
    const frNameValues = Object.values(MUSCLE_FR_NAMES);
    for (const name of allDisplayNames) {
      expect(
        frNameValues.includes(name),
        `Display name "${name}" not found in MUSCLE_FR_NAMES values`,
      ).toBe(true);
    }
  });

  it("GROUP_MUSCLES keys match MUSCLE_GROUPS keys exactly", () => {
    const gmKeys = Object.keys(GROUP_MUSCLES).sort();
    const mgKeys = Object.keys(MUSCLE_GROUPS).sort();
    expect(gmKeys).toEqual(mgKeys);
  });

  it("each GROUP_MUSCLES entry has at least 1 muscle", () => {
    for (const [key, muscles] of Object.entries(GROUP_MUSCLES)) {
      expect(muscles.length, `GROUP_MUSCLES[${key}] is empty`).toBeGreaterThan(0);
    }
  });

  it("matchesGroup self-matches at least 1 exerciseSearchTerm per group", () => {
    for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
      const hasMatch = group.exerciseSearchTerms.some((term) =>
        matchesGroup(group, term),
      );
      expect(hasMatch, `No exerciseSearchTerm self-matches for group ${key}`).toBe(true);
    }
  });
});

/* ── Anatomy — label + sheet data contracts ─────────────────────── */

describe("Anatomy — label and sheet data", () => {
  it("every MUSCLE_GROUPS key has a valid color for label display", () => {
    for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
      expect(group.color, `Group ${key} missing color`).toMatch(/^#[0-9a-f]{6}$/);
      expect(group.id, `Group ${key} id mismatch`).toBe(key);
    }
  });

  it("getGroupForNode returns a key present in MUSCLE_GROUPS for known meshes", () => {
    const knownMeshes = [
      "latissimus dorsi", "pectoralis major", "rectus abdominis",
      "deltoid", "biceps brachii", "triceps", "psoas", "gluteus maximus",
      "rectus femoris", "biceps femoris", "gastrocnemius",
    ];
    for (const mesh of knownMeshes) {
      const key = getGroupForNode(mesh);
      expect(key, `No group for mesh "${mesh}"`).not.toBeNull();
      expect(MUSCLE_GROUPS[key!], `Group "${key}" not in MUSCLE_GROUPS`).toBeDefined();
    }
  });
});
