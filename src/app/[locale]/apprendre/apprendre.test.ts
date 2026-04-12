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
} from "@/app/[locale]/apprendre/anatomie/anatomy-data";

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

/* ── Anatomy data (8 unified muscle groups) ─────────────────────────── */

describe("Anatomy data — MUSCLE_GROUPS", () => {
  const groupKeys = Object.keys(MUSCLE_GROUPS);

  it("defines exactly 8 muscle groups", () => {
    expect(groupKeys).toHaveLength(8);
  });

  it("each group has id, color, keywords", () => {
    for (const key of groupKeys) {
      const group = MUSCLE_GROUPS[key];
      expect(group.id).toBe(key);
      expect(group.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(group.keywords.length).toBeGreaterThan(0);
    }
  });

  it("expected groups are present", () => {
    const expected = [
      "pectoraux", "dorsaux", "epaules", "bras",
      "abdominaux", "cuisses", "fessiers", "mollets",
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
    expect(getFrenchName("rectus abdominis")).toBe("Droit de l'abdomen");
    expect(getFrenchName("soleus")).toBe("Soléaire");
  });

  it("getSide returns G for .l, D for .r", () => {
    expect(getSide("muscle.l")).toBe("G");
    expect(getSide("muscle.r")).toBe("D");
    expect(getSide("midline_muscle")).toBe("");
  });

  it("getGroupForNode finds correct group", () => {
    expect(getGroupForNode("latissimus_dorsi")).toBe("dorsaux");
    expect(getGroupForNode("pectoralis_major")).toBe("pectoraux");
    expect(getGroupForNode("biceps brachii")).toBe("bras");
    expect(getGroupForNode("gluteus_maximus")).toBe("fessiers");
    expect(getGroupForNode("unknown_bone")).toBeNull();
  });

  it("matchesGroup matches exercise muscle tags", () => {
    const dorsaux = MUSCLE_GROUPS.dorsaux;
    expect(matchesGroup(dorsaux, "Grand dorsal")).toBe(true);
    expect(matchesGroup(dorsaux, "Trapèze supérieur")).toBe(true);
    expect(matchesGroup(dorsaux, "Biceps brachial")).toBe(false);

    const cuisses = MUSCLE_GROUPS.cuisses;
    expect(matchesGroup(cuisses, "Quadriceps")).toBe(true);
    expect(matchesGroup(cuisses, "Mollets")).toBe(false);
  });
});

/* ── Anatomy — exercise matching per group ───────────────────────── */

describe("Anatomy — exercise matching coverage", () => {
  it("matchesGroup correctly matches typical exercise tags to groups", () => {
    const typicalTags: Record<string, string> = {
      dorsaux: "Grand dorsal",
      pectoraux: "Pectoraux",
      abdominaux: "Abdominaux",
      epaules: "Deltoides",
      bras: "Biceps brachial",
      fessiers: "Grand fessier",
      cuisses: "Quadriceps",
      mollets: "Mollets",
    };
    for (const [key, tag] of Object.entries(typicalTags)) {
      const group = MUSCLE_GROUPS[key];
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

  it("getFrenchName covers key muscle display names", () => {
    const keyDisplayNames = [
      "Grand pectoral", "Grand dorsal", "Deltoïde moyen",
      "Biceps brachial", "Triceps brachial",
      "Droit de l'abdomen", "Oblique externe",
      "Grand glutéal", "Moyen glutéal",
      "Gastrocnémiens", "Soléaire",
    ];
    const frNameValues = Object.values(MUSCLE_FR_NAMES);
    for (const name of keyDisplayNames) {
      expect(
        frNameValues.includes(name),
        `Display name "${name}" not found in MUSCLE_FR_NAMES values`,
      ).toBe(true);
    }
  });
});

/* ── Anatomy — label + sheet data contracts ─────────────────────── */

describe("Anatomy — label and sheet data", () => {
  it("every MUSCLE_GROUPS key has a valid color for label display", () => {
    for (const [key, group] of Object.entries(MUSCLE_GROUPS)) {
      expect(group.color, `Group ${key} missing color`).toMatch(/^#[0-9a-fA-F]{6}$/);
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
