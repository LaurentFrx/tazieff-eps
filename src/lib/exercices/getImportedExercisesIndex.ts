import "server-only";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Difficulty, ExerciseFrontmatter } from "@/lib/content/schema";

type ImportedExerciseRawEntry = {
  code?: string;
  title?: string;
  level?: string;
  equipment?: string;
  muscles?: string;
  image?: string;
  thumb?: string;
  thumb169?: string;
  thumb169Src?: string;
  thumb916?: string;
  thumb9x16?: string;
  objective?: string;
  key_points?: string[];
  safety?: string[];
  regress?: string;
  progress?: string;
  dosage?: string;
  summary?: string;
  executionSteps?: string[];
  breathing?: string;
  tips?: string[];
  commonMistakes?: string[];
  difficulty?: string;
  musclesList?: string[];
  equipmentList?: string[];
};

export type ImportedExercise = ExerciseFrontmatter & {
  source: "imported";
  imageSrc: string;
  thumbSrc: string;
  thumb169Src?: string;
  thumb916Src?: string;
  thumbListSrc?: string;
  thumbListAspect?: "16/9" | "9/16" | "1/1";
  summary?: string;
  executionSteps?: string[];
  breathing?: string;
  tips?: string[];
  commonMistakes?: string[];
  safety?: string[];
  musclesList?: string[];
  equipmentList?: string[];
  difficulty?: string;
};

const IMPORT_ROOT = path.join(process.cwd(), "public", "import", "v2");
const IMPORT_DATA_FILE = path.join(IMPORT_ROOT, "data", "exercisesFromPdf.json");
const IMPORT_EXERCISES_DIR = path.join(IMPORT_ROOT, "exercises");
const DEFAULT_TAGS = ["imported"];
const DEFAULT_MUSCLES = ["imported"];
const DEFAULT_THEMES: ExerciseFrontmatter["themeCompatibility"] = [1, 2, 3];

function logDevWarning(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.warn(`[imported-exercises] ${message}`, error ?? "");
}

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function normalizeDifficulty(value?: string): Difficulty | undefined {
  const raw = normalizeText(value);
  if (!raw) {
    return undefined;
  }
  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("debut")) {
    return "debutant";
  }
  if (normalized.includes("inter")) {
    return "intermediaire";
  }
  if (normalized.includes("avan")) {
    return "avance";
  }
  return undefined;
}

function splitList(raw?: string) {
  const normalized = normalizeText(raw);
  if (!normalized) {
    return [];
  }
  const parts = normalized
    .split(/[,;|·]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function normalizeStringList(raw?: string[] | string) {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeText(item)).filter(Boolean);
  }
  return splitList(raw);
}

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeEquipment(raw?: string) {
  const items = splitList(raw);
  if (items.length === 0) {
    return undefined;
  }
  const filtered = items.filter((item) => {
    const comparable = normalizeComparable(item);
    return !comparable.includes("aucun") && !comparable.includes("sans materiel");
  });
  return filtered.length > 0 ? filtered : undefined;
}

function normalizeMuscles(raw?: string) {
  const items = splitList(raw);
  return items.length > 0 ? items : [...DEFAULT_MUSCLES];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSlug(code: string) {
  return slugify(code);
}

function resolveImageSrc(code: string, _rawImage?: string) {
  const slug = slugify(code);
  if (!slug) {
    return null;
  }
  return `/images/exos/${slug}.webp`;
}

function resolveAssetSrc(rawAsset?: string) {
  const asset = normalizeText(rawAsset);
  if (!asset) {
    return null;
  }
  if (asset.startsWith("/")) {
    return asset;
  }
  return `/${asset}`;
}

function normalizePublicUrl(rawPath?: string) {
  const normalized = normalizeText(rawPath);
  if (!normalized) {
    return undefined;
  }
  const withoutPublic = normalized.startsWith("public/")
    ? normalized.slice("public".length)
    : normalized;
  return withoutPublic.startsWith("/") ? withoutPublic : `/${withoutPublic}`;
}

function toPublicPath(imageSrc: string) {
  return path.join(process.cwd(), "public", imageSrc.replace(/^\/+/, ""));
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveExistingAsset(rawAsset?: string) {
  const asset = resolveAssetSrc(rawAsset);
  if (!asset) {
    return null;
  }
  if (await fileExists(toPublicPath(asset))) {
    return asset;
  }
  return null;
}

async function buildEntry(raw: ImportedExerciseRawEntry): Promise<ImportedExercise | null> {
  const code = normalizeText(raw.code);
  if (!code) {
    return null;
  }
  const imageSrc = resolveImageSrc(code, raw.image);
  if (!imageSrc) {
    return null;
  }
  if (!(await fileExists(toPublicPath(imageSrc)))) {
    return null;
  }
  const slug = toSlug(code);
  const thumbCandidate = `/images/exos/thumb-${slug}.webp`;
  const thumbSrc = (await fileExists(toPublicPath(thumbCandidate)))
    ? thumbCandidate
    : imageSrc;
  const thumb169Candidate = `/images/exos/thumb169-${slug}.webp`;
  const thumb169Src = (await fileExists(toPublicPath(thumb169Candidate)))
    ? thumb169Candidate
    : undefined;
  const thumb916Candidate = `/images/exos/thumb916-${slug}.webp`;
  const thumb916Src = (await fileExists(toPublicPath(thumb916Candidate)))
    ? thumb916Candidate
    : undefined;
  const thumbListSrc = thumb169Src ?? thumb916Src ?? thumbSrc ?? imageSrc;
  const thumbListAspect: "16/9" | "9/16" | "1/1" = thumb169Src
    ? "16/9"
    : thumb916Src
      ? "9/16"
      : "1/1";

  const title = normalizeText(raw.title) || code;
  const musclesList = normalizeStringList(raw.musclesList ?? raw.muscles);
  const equipmentList = normalizeStringList(raw.equipmentList ?? raw.equipment);
  const muscles =
    musclesList.length > 0 ? musclesList : normalizeMuscles(raw.muscles);
  const equipment =
    equipmentList.length > 0 ? equipmentList : normalizeEquipment(raw.equipment);
  const level = normalizeDifficulty(raw.level);
  const summary = normalizeText(raw.summary ?? raw.objective) || undefined;
  const executionSteps = normalizeStringList(
    raw.executionSteps ?? raw.key_points,
  );
  const breathing = normalizeText(raw.breathing) || undefined;
  const tips = normalizeStringList(raw.tips);
  const commonMistakes = normalizeStringList(raw.commonMistakes);
  const safety = normalizeStringList(raw.safety);
  const difficulty = normalizeText(raw.difficulty ?? raw.level) || undefined;

  return {
    title,
    slug,
    tags: [...DEFAULT_TAGS],
    level,
    themeCompatibility: [...DEFAULT_THEMES],
    muscles,
    equipment,
    media: imageSrc,
    source: "imported",
    imageSrc,
    thumbSrc,
    thumb169Src,
    thumb916Src,
    thumbListSrc,
    thumbListAspect,
    summary,
    executionSteps: executionSteps.length > 0 ? executionSteps : undefined,
    breathing,
    tips: tips.length > 0 ? tips : undefined,
    commonMistakes:
      commonMistakes.length > 0 ? commonMistakes : undefined,
    safety: safety.length > 0 ? safety : undefined,
    musclesList: musclesList.length > 0 ? musclesList : undefined,
    equipmentList: equipmentList.length > 0 ? equipmentList : undefined,
    difficulty,
  };
}

async function readJsonEntries() {
  try {
    const raw = await fs.readFile(IMPORT_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      logDevWarning("Unexpected JSON shape for imported exercises index.");
      return [];
    }
    const items = await Promise.all(
      parsed.map((entry) => buildEntry(entry as ImportedExerciseRawEntry)),
    );
    return items.filter((item): item is ImportedExercise => Boolean(item));
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError?.code === "ENOENT") {
      return [];
    }
    logDevWarning("Failed to read imported exercises JSON.", error);
    return [];
  }
}

async function readFilesystemEntries() {
  let seriesDirs: Dirent[] = [];
  try {
    seriesDirs = await fs.readdir(IMPORT_EXERCISES_DIR, { withFileTypes: true });
  } catch (error) {
    logDevWarning("Failed to read imported exercises exercises directory.", error);
    return [];
  }

  const items: ImportedExercise[] = [];
  for (const series of seriesDirs) {
    if (!series.isDirectory()) {
      continue;
    }
    const seriesName = series.name;
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(path.join(IMPORT_EXERCISES_DIR, seriesName), {
        withFileTypes: true,
      });
    } catch (error) {
      logDevWarning(`Failed to read imported exercises series ${seriesName}.`, error);
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".webp")) {
        continue;
      }
      const code = path.parse(entry.name).name;
      const built = await buildEntry({ code, title: code });
      if (built) {
        items.push(built);
      }
    }
  }

  return items;
}

function uniqueBySlug(items: ImportedExercise[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }
    seen.add(item.slug);
    return true;
  });
}

export const getImportedExercisesIndex = cache(async () => {
  const jsonItems = await readJsonEntries();
  const items = jsonItems.length > 0 ? jsonItems : await readFilesystemEntries();
  const unique = uniqueBySlug(items);
  return unique.sort((a, b) => a.title.localeCompare(b.title, "fr"));
});
