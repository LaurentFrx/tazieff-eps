import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { ZodSchema } from "zod";
import { formatZodError } from "@/lib/content/zodHelpers";
import {
  BacFrontmatterSchema,
  ExerciseFrontmatterSchema,
  LearnFrontmatterSchema,
  MethodeFrontmatterSchema,
  SeanceFrontmatterSchema,
  type BacFrontmatter,
  type ExerciseFrontmatter,
  type LearnFrontmatter,
  type MethodeFrontmatter,
  type SeanceFrontmatter,
} from "@/lib/content/schema";
import type { Lang } from "@/lib/i18n/messages";

type ContentType = "exercices" | "seances";

type MdxResult<T> = {
  frontmatter: T;
  content: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content");
const CONTENT_DIRS: Record<ContentType, string> = {
  exercices: "exercices",
  seances: "seances",
};

function getContentDir(type: ContentType) {
  return path.join(CONTENT_ROOT, CONTENT_DIRS[type]);
}


function normalizeFrontmatter(
  data: Record<string, unknown>,
  filename: string,
): Record<string, unknown> {
  const slug =
    typeof data.slug === "string" && data.slug.trim().length > 0
      ? data.slug
      : path.basename(filename, ".mdx");
  const title =
    typeof data.title === "string" && data.title.trim().length > 0
      ? data.title
      : slug;

  return {
    ...data,
    slug,
    title,
  };
}

function parseFrontmatter<T>(
  schema: ZodSchema<T>,
  rawData: Record<string, unknown>,
  filename: string,
): T {
  const normalized = normalizeFrontmatter(rawData, filename);
  const result = schema.safeParse(normalized);

  if (!result.success) {
    throw new Error(formatZodError(filename, result.error.issues));
  }

  return result.data;
}

async function listMdxFiles(dir: string, lang?: Lang) {
  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const suffix = lang ? `.${lang}.mdx` : ".mdx";
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => entry.name);
}

async function readMdxFile<T>(
  filePath: string,
  schema: ZodSchema<T>,
): Promise<MdxResult<T>> {
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  const filename = path.relative(process.cwd(), filePath);

  return {
    frontmatter: parseFrontmatter(schema, data as Record<string, unknown>, filename),
    content,
  };
}

async function readBySlug<T>(
  type: ContentType,
  slug: string,
  schema: ZodSchema<T>,
  lang: Lang = "fr",
): Promise<MdxResult<T> | null> {
  const dir = getContentDir(type);
  const localizedPath = path.join(dir, `${slug}.${lang}.mdx`);

  try {
    return await readMdxFile(localizedPath, schema);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      // Fallback to French if localized file doesn't exist
      if (lang !== "fr") {
        const fallbackPath = path.join(dir, `${slug}.fr.mdx`);
        try {
          return await readMdxFile(fallbackPath, schema);
        } catch (fallbackError) {
          const fallbackNodeError = fallbackError as NodeJS.ErrnoException;
          if (fallbackNodeError.code === "ENOENT") {
            return null;
          }
          throw fallbackError;
        }
      }
      return null;
    }
    throw error;
  }
}

export const getAllExercises = cache(async (lang: Lang = "fr"): Promise<ExerciseFrontmatter[]> => {
  const dir = getContentDir("exercices");
  const files = await listMdxFiles(dir, lang);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file);
      const { frontmatter } = await readMdxFile(fullPath, ExerciseFrontmatterSchema);
      return frontmatter;
    }),
  );

  return items.sort((a, b) => a.title.localeCompare(b.title, lang));
});

export const getExercise = cache(async (
  slug: string,
  lang: Lang = "fr",
): Promise<MdxResult<ExerciseFrontmatter> | null> => {
  const direct = await readBySlug("exercices", slug, ExerciseFrontmatterSchema, lang);
  if (direct) {
    return direct;
  }

  const dir = getContentDir("exercices");
  const files = await listMdxFiles(dir, lang);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const result = await readMdxFile(fullPath, ExerciseFrontmatterSchema);
    if (result.frontmatter.slug === slug) {
      return result;
    }
  }

  return null;
});

export const getAllSeances = cache(async (lang: Lang = "fr"): Promise<SeanceFrontmatter[]> => {
  const dir = getContentDir("seances");
  const files = await listMdxFiles(dir, lang);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file);
      const { frontmatter } = await readMdxFile(fullPath, SeanceFrontmatterSchema);
      return frontmatter;
    }),
  );

  return items.sort((a, b) => a.title.localeCompare(b.title, lang));
});

export const getSeance = cache(async (
  slug: string,
  lang: Lang = "fr",
): Promise<MdxResult<SeanceFrontmatter> | null> => {
  return readBySlug("seances", slug, SeanceFrontmatterSchema, lang);
});

export const exercisesIndex = getAllExercises;
export const seancesIndex = getAllSeances;

const METHODS_DIR = path.join(CONTENT_ROOT, "methodes");

export const getAllMethodes = cache(async (lang: Lang = "fr"): Promise<MethodeFrontmatter[]> => {
  const files = await listMdxFiles(METHODS_DIR, lang);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(METHODS_DIR, file);
      const { frontmatter } = await readMdxFile(fullPath, MethodeFrontmatterSchema);
      return frontmatter;
    }),
  );
  return items.sort((a, b) => {
    if (a.ordre !== undefined && b.ordre !== undefined) return a.ordre - b.ordre;
    if (a.ordre !== undefined) return -1;
    if (b.ordre !== undefined) return 1;
    return a.titre.localeCompare(b.titre, lang);
  });
});

type MethodeMdxResult = {
  frontmatter: MethodeFrontmatter;
  content: string;
};

export const getMethode = cache(async (slug: string, lang: Lang = "fr"): Promise<MethodeMdxResult | null> => {
  const localizedPath = path.join(METHODS_DIR, `${slug}.${lang}.mdx`);
  try {
    return await readMdxFile(localizedPath, MethodeFrontmatterSchema);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      if (lang !== "fr") {
        const fallbackPath = path.join(METHODS_DIR, `${slug}.fr.mdx`);
        try {
          return await readMdxFile(fallbackPath, MethodeFrontmatterSchema);
        } catch (fallbackError) {
          const fallbackNodeError = fallbackError as NodeJS.ErrnoException;
          if (fallbackNodeError.code === "ENOENT") {
            return null;
          }
          throw fallbackError;
        }
      }
      return null;
    }
    throw error;
  }
});

export async function getMethodesForExercice(exerciceSlug: string, lang: Lang = "fr"): Promise<MethodeFrontmatter[]> {
  const all = await getAllMethodes(lang);
  return all.filter((m) => m.exercices_compatibles.includes(exerciceSlug));
}

// ─── Learn pages (content/learn/{slug}.{lang}.mdx) ───────────────────────────

const LEARN_DIR = path.join(CONTENT_ROOT, "learn");

export const getAllLearnPages = cache(async (lang: Lang = "fr"): Promise<LearnFrontmatter[]> => {
  const files = await listMdxFiles(LEARN_DIR, lang);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(LEARN_DIR, file);
      const { frontmatter } = await readMdxFile(fullPath, LearnFrontmatterSchema);
      return frontmatter;
    }),
  );
  return items.sort((a, b) => a.ordre - b.ordre);
});

type LearnMdxResult = {
  frontmatter: LearnFrontmatter;
  content: string;
};

export const getLearnPage = cache(async (
  slug: string,
  lang: Lang = "fr",
): Promise<LearnMdxResult | null> => {
  const localizedPath = path.join(LEARN_DIR, `${slug}.${lang}.mdx`);
  try {
    return await readMdxFile(localizedPath, LearnFrontmatterSchema);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      if (lang !== "fr") {
        const fallbackPath = path.join(LEARN_DIR, `${slug}.fr.mdx`);
        try {
          return await readMdxFile(fallbackPath, LearnFrontmatterSchema);
        } catch {
          return null;
        }
      }
      return null;
    }
    throw error;
  }
});

// ─── BAC pages (content/bac/{slug}.{lang}.mdx) ───────────────────────────────

const BAC_DIR = path.join(CONTENT_ROOT, "bac");

export const getAllBacPages = cache(async (lang: Lang = "fr"): Promise<BacFrontmatter[]> => {
  const files = await listMdxFiles(BAC_DIR, lang);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(BAC_DIR, file);
      const { frontmatter } = await readMdxFile(fullPath, BacFrontmatterSchema);
      return frontmatter;
    }),
  );
  return items.sort((a, b) => a.ordre - b.ordre);
});

type BacMdxResult = {
  frontmatter: BacFrontmatter;
  content: string;
};

export const getBacPage = cache(async (
  slug: string,
  lang: Lang = "fr",
): Promise<BacMdxResult | null> => {
  const localizedPath = path.join(BAC_DIR, `${slug}.${lang}.mdx`);
  try {
    return await readMdxFile(localizedPath, BacFrontmatterSchema);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      if (lang !== "fr") {
        const fallbackPath = path.join(BAC_DIR, `${slug}.fr.mdx`);
        try {
          return await readMdxFile(fallbackPath, BacFrontmatterSchema);
        } catch {
          return null;
        }
      }
      return null;
    }
    throw error;
  }
});
