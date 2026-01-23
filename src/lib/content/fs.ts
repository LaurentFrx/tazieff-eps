import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ContentType = "seances" | "exos";

type BaseFrontmatter = {
  title: string;
  slug: string;
};

export type Difficulty = "debutant" | "intermediaire" | "avance";

export type SeanceFrontmatter = BaseFrontmatter & {
  durationMin?: number;
  level?: string;
  tags?: string[];
  exercises?: string[];
};

export type ExerciceFrontmatter = BaseFrontmatter & {
  muscles?: string[];
  equipment?: string[];
  image?: string;
  difficulty?: Difficulty;
};

type FrontmatterMap = {
  seances: SeanceFrontmatter;
  exos: ExerciceFrontmatter;
};

type MdxResult<T extends ContentType> = {
  frontmatter: FrontmatterMap[T];
  content: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content");
const CONTENT_DIRS: Record<ContentType, string> = {
  seances: "seances",
  exos: "exercices",
};

function getContentDir(type: ContentType) {
  return path.join(CONTENT_ROOT, CONTENT_DIRS[type]);
}

function normalizeFrontmatter<T extends ContentType>(
  type: T,
  data: Record<string, unknown>,
  filename: string,
): FrontmatterMap[T] {
  const slug =
    typeof data.slug === "string" && data.slug.trim().length > 0
      ? data.slug
      : path.basename(filename, ".mdx");
  const title =
    typeof data.title === "string" && data.title.trim().length > 0
      ? data.title
      : slug;

  const normalized: Record<string, unknown> = {
    ...data,
    slug,
    title,
  };

  if (type === "exos") {
    const difficulty =
      data.difficulty === "debutant" ||
      data.difficulty === "intermediaire" ||
      data.difficulty === "avance"
        ? data.difficulty
        : "intermediaire";

    normalized.difficulty = difficulty;
  }

  return {
    ...normalized,
  } as FrontmatterMap[T];
}

export async function listMdx<T extends ContentType>(
  type: T,
): Promise<FrontmatterMap[T][]> {
  const dir = getContentDir(type);

  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"));

  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file.name);
      const raw = await fs.readFile(fullPath, "utf8");
      const { data } = matter(raw);
      return normalizeFrontmatter(type, data as Record<string, unknown>, file.name);
    }),
  );

  return items.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export async function getMdxBySlug<T extends ContentType>(
  type: T,
  slug: string,
): Promise<MdxResult<T> | null> {
  const dir = getContentDir(type);
  const filePath = path.join(dir, `${slug}.mdx`);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const { data, content } = matter(raw);

  return {
    frontmatter: normalizeFrontmatter(type, data as Record<string, unknown>, `${slug}.mdx`),
    content,
  };
}
