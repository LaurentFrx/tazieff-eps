import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const FR_DIR = path.join(ROOT, "content", "exercices", "fr");
const EN_DIR = path.join(ROOT, "content", "exercices", "en");

const REQUIRED_FIELDS = ["title", "slug", "sessionId"] as const;

type Frontmatter = Record<string, unknown> & {
  media?: { hero?: string };
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

async function readFrontmatter(filePath: string): Promise<Frontmatter> {
  const raw = await fs.readFile(filePath, "utf8");
  const { data } = matter(raw);
  return data as Frontmatter;
}

async function checkFrontmatter(dir: string, filename: string, errors: string[]) {
  const filePath = path.join(dir, filename);
  const slug = toSlug(filename);
  const data = await readFrontmatter(filePath);

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

  if (missingEn.length > 0) {
    errors.push(`Slugs FR sans EN: ${missingEn.join(", ")}`);
  }
  if (missingFr.length > 0) {
    errors.push(`Slugs EN sans FR: ${missingFr.join(", ")}`);
  }

  for (const file of frFiles) {
    await checkFrontmatter(FR_DIR, file, errors);
  }

  for (const file of enFiles) {
    await checkFrontmatter(EN_DIR, file, errors);
  }

  console.log(`FR: ${frFiles.length} fichiers`);
  console.log(`EN: ${enFiles.length} fichiers`);

  if (errors.length > 0) {
    console.error("check-exercices: erreurs détectées\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log("check-exercices: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});