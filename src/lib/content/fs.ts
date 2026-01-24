import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type { ZodIssue, ZodSchema } from "zod";
import {
  ExerciseFrontmatterSchema,
  SeanceFrontmatterSchema,
  type ExerciseFrontmatter,
  type SeanceFrontmatter,
} from "@/lib/content/schema";

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

function formatZodPath(pathSegments: Array<string | number>) {
  return pathSegments.reduce((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }
    return acc ? `${acc}.${segment}` : segment;
  }, "");
}

function formatZodError(filename: string, issues: ZodIssue[]) {
  const details = issues
    .map((issue) => {
      const cleanedPath = issue.path.map((segment) =>
        typeof segment === "symbol" ? segment.toString() : segment,
      ) as Array<string | number>;
      const field = formatZodPath(cleanedPath) || "frontmatter";
      return `- ${field}: ${issue.message}`;
    })
    .join("\n");

  return `Frontmatter invalide dans ${filename}.\n${details}`;
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

async function listMdxFiles(dir: string) {
  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
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
): Promise<MdxResult<T> | null> {
  const dir = getContentDir(type);
  const filePath = path.join(dir, `${slug}.mdx`);

  try {
    return await readMdxFile(filePath, schema);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function getAllExercises(): Promise<ExerciseFrontmatter[]> {
  const dir = getContentDir("exercices");
  const files = await listMdxFiles(dir);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file);
      const { frontmatter } = await readMdxFile(fullPath, ExerciseFrontmatterSchema);
      return frontmatter;
    }),
  );

  return items.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export async function getExercise(
  slug: string,
): Promise<MdxResult<ExerciseFrontmatter> | null> {
  return readBySlug("exercices", slug, ExerciseFrontmatterSchema);
}

export async function getAllSeances(): Promise<SeanceFrontmatter[]> {
  const dir = getContentDir("seances");
  const files = await listMdxFiles(dir);
  const items = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file);
      const { frontmatter } = await readMdxFile(fullPath, SeanceFrontmatterSchema);
      return frontmatter;
    }),
  );

  return items.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export async function getSeance(
  slug: string,
): Promise<MdxResult<SeanceFrontmatter> | null> {
  return readBySlug("seances", slug, SeanceFrontmatterSchema);
}

export const exercisesIndex = cache(async () => getAllExercises());
export const seancesIndex = cache(async () => getAllSeances());
