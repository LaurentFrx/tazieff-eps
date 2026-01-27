import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const FR_DIR = path.join(ROOT, "content", "exercices", "fr");
const EN_DIR = path.join(ROOT, "content", "exercices", "en");

const REQUIRED_FIELDS = ["title", "slug", "sessionId"] as const;
const MIN_BODY_LENGTH = 200;
const MIN_SECTIONS = 4;
const MIN_NON_PLACEHOLDER = 30;
const PLACEHOLDER_RE = /À compléter|To complete/g;

type Frontmatter = Record<string, unknown> & {
  media?: { hero?: string };
  source?: { legacyRef?: string };
};

type MdxResult = {
  data: Frontmatter;
  content: string;
};

async function listMdxFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function toSlug(filename: string) {
  return path.basename(filename, ".mdx");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function readMdx(filePath: string): Promise<MdxResult> {
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  return { data: data as Frontmatter, content };
}

async function checkFrontmatter(
  dir: string,
  filename: string,
  errors: string[],
  legacyMap?: Map<string, string>,
  incomplete?: string[],
) {
  const filePath = path.join(dir, filename);
  const slug = toSlug(filename);
  const { data, content } = await readMdx(filePath);

  REQUIRED_FIELDS.forEach((field) => {
    if (!isNonEmptyString(data[field])) {
      errors.push(`[${slug}] champ requis manquant: ${field}`);
    }
  });

  if (isNonEmptyString(data.slug) && data.slug !== slug) {
    errors.push(`[${slug}] slug différent du nom de fichier: ${data.slug}`);
  }

  const hero = data.media?.hero;
  if (!isNonEmptyString(hero)) {
    errors.push(`[${slug}] media.hero manquant ou vide`);
  }

  const legacyRef = data.source?.legacyRef;
  if (!isNonEmptyString(legacyRef)) {
    errors.push(`[${slug}] source.legacyRef manquant ou vide`);
  } else if (legacyMap) {
    legacyMap.set(slug, legacyRef);
  }

  const body = content.trim();
  if (body.length < MIN_BODY_LENGTH) {
    errors.push(`[${slug}] contenu trop court (${body.length})`);
  }

  const sectionCount = (body.match(/^##\s+/gm) || []).length;
  if (sectionCount < MIN_SECTIONS) {
    errors.push(`[${slug}] sections insuffisantes (${sectionCount})`);
  }

  const placeholderHits = body.match(PLACEHOLDER_RE) ?? [];
  if (placeholderHits.length > 0 && incomplete) {
    incomplete.push(`${slug} (${placeholderHits.length})`);
  }

  const nonPlaceholder = body
    .replace(/^##.*$/gm, "")
    .replace(PLACEHOLDER_RE, "")
    .replace(/[-*]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (nonPlaceholder.length < MIN_NON_PLACEHOLDER) {
    errors.push(`[${slug}] contenu réel insuffisant (${nonPlaceholder.length})`);
  }
}

async function main() {
  const [frFiles, enFiles] = await Promise.all([
    listMdxFiles(FR_DIR),
    listMdxFiles(EN_DIR),
  ]);

  const frSlugs = new Set(frFiles.map(toSlug));
  const enSlugs = new Set(enFiles.map(toSlug));

  const missingEn = Array.from(frSlugs).filter((slug) => !enSlugs.has(slug));
  const missingFr = Array.from(enSlugs).filter((slug) => !frSlugs.has(slug));

  const errors: string[] = [];
  const frLegacyRefs = new Map<string, string>();
  const enLegacyRefs = new Map<string, string>();
  const incompleteFr: string[] = [];
  const incompleteEn: string[] = [];

  if (missingEn.length > 0) {
    errors.push(`Slugs FR sans EN: ${missingEn.join(", ")}`);
  }
  if (missingFr.length > 0) {
    errors.push(`Slugs EN sans FR: ${missingFr.join(", ")}`);
  }

  for (const file of frFiles) {
    await checkFrontmatter(FR_DIR, file, errors, frLegacyRefs, incompleteFr);
  }

  for (const file of enFiles) {
    await checkFrontmatter(EN_DIR, file, errors, enLegacyRefs, incompleteEn);
  }

  for (const slug of frSlugs) {
    if (!enSlugs.has(slug)) continue;
    const frRef = frLegacyRefs.get(slug);
    const enRef = enLegacyRefs.get(slug);
    if (frRef && enRef && frRef !== enRef) {
      errors.push(`[${slug}] legacyRef FR/EN différent: ${frRef} vs ${enRef}`);
    }
  }

  console.log(`FR: ${frFiles.length} fichiers`);
  console.log(`EN: ${enFiles.length} fichiers`);

  if (errors.length > 0) {
    console.error("check-exercices: erreurs détectées\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log("check-exercices: ok");
  if (incompleteFr.length > 0) {
    console.log(`FR incomplets (${incompleteFr.length}): ${incompleteFr.join(", ")}`);
  }
  if (incompleteEn.length > 0) {
    console.log(`EN incomplets (${incompleteEn.length}): ${incompleteEn.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
