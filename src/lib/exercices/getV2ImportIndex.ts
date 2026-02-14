import "server-only";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Difficulty, ExerciseFrontmatter } from "@/lib/content/schema";

type V2ImportRawEntry = {
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

export type V2ImportExercise = ExerciseFrontmatter & {
  source: "v2";
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

const V2_IMPORT_ROOT = path.join(process.cwd(), "public", "import", "v2");
const V2_DATA_FILE = path.join(V2_IMPORT_ROOT, "data", "exercisesFromPdf.json");
const V2_EXERCISES_DIR = path.join(V2_IMPORT_ROOT, "exercises");
const DEFAULT_TAGS = ["import-v2"];
const DEFAULT_MUSCLES = ["import-v2"];
const DEFAULT_THEMES: ExerciseFrontmatter["themeCompatibility"] = [1, 2, 3];

function logDevWarning(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.warn(`[v2-import] ${message}`, error ?? "");
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
  return `v2-${slugify(code)}`;
}

function resolveImageSrc(code: string, rawImage?: string) {
  const image = normalizeText(rawImage);
  if (image) {
    if (image.startsWith("/import/v2/")) {
      return image;
    }
    if (image.startsWith("import/v2/")) {
      return `/${image}`;
    }
    if (image.startsWith("/exercises/")) {
      return `/import/v2${image}`;
    }
  }

  const series = normalizeText(code.split("-")[0]).toUpperCase();
  if (!series) {
    return null;
  }
  return `/import/v2/exercises/${series}/${code}.webp`;
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

async function buildEntry(raw: V2ImportRawEntry): Promise<V2ImportExercise | null> {
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
  const thumbSrc = (await resolveExistingAsset(raw.thumb)) ?? imageSrc;
  const thumb169Src = normalizePublicUrl(raw.thumb169 ?? raw.thumb169Src);
  const thumb916Src = normalizePublicUrl(raw.thumb916 ?? raw.thumb9x16);
  const thumbListSrc = thumb169Src ?? thumb916Src ?? thumbSrc ?? imageSrc;
  const thumbListAspect = thumbListSrc.includes("thumb169-")
    ? "16/9"
    : thumbListSrc.includes("thumb916-")
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
    source: "v2",
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
    const raw = await fs.readFile(V2_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      logDevWarning("Unexpected JSON shape for v2 import index.");
      return [];
    }
    const items = await Promise.all(
      parsed.map((entry) => buildEntry(entry as V2ImportRawEntry)),
    );
    return items.filter((item): item is V2ImportExercise => Boolean(item));
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError?.code === "ENOENT") {
      return [];
    }
    logDevWarning("Failed to read v2 import JSON.", error);
    return [];
  }
}

async function readFilesystemEntries() {
  let seriesDirs: Dirent[] = [];
  try {
    seriesDirs = await fs.readdir(V2_EXERCISES_DIR, { withFileTypes: true });
  } catch (error) {
    logDevWarning("Failed to read v2 import exercises directory.", error);
    return [];
  }

  const items: V2ImportExercise[] = [];
  for (const series of seriesDirs) {
    if (!series.isDirectory()) {
      continue;
    }
    const seriesName = series.name;
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(path.join(V2_EXERCISES_DIR, seriesName), {
        withFileTypes: true,
      });
    } catch (error) {
      logDevWarning(`Failed to read v2 import series ${seriesName}.`, error);
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".webp")) {
        continue;
      }
      const code = path.parse(entry.name).name;
      const imageSrc = `/import/v2/exercises/${seriesName}/${entry.name}`;
      const built = await buildEntry({ code, title: code, image: imageSrc });
      if (built) {
        items.push(built);
      }
    }
  }

  return items;
}

function uniqueBySlug(items: V2ImportExercise[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }
    seen.add(item.slug);
    return true;
  });
}

export const getV2ImportIndex = cache(async () => {
  const jsonItems = await readJsonEntries();
  const items = jsonItems.length > 0 ? jsonItems : await readFilesystemEntries();
  const unique = uniqueBySlug(items);
  return unique.sort((a, b) => a.title.localeCompare(b.title, "fr"));
});
