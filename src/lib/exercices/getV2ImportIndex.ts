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
  video?: string;
  thumb?: string;
  thumb169?: string;
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
  thumb169Src: string;
  videoSrc?: string;
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

const VIDEO_EXTENSIONS = new Set([".webm", ".mp4", ".mov", ".m4v", ".ogv", ".ogg"]);

function defaultImageSrc(code: string) {
  const series = normalizeText(code.split("-")[0]).toUpperCase();
  if (!series) {
    return null;
  }
  return `/import/v2/exercises/${series}/${code}.webp`;
}

function normalizeAssetSrc(rawAsset?: string) {
  const asset = normalizeText(rawAsset);
  if (!asset) {
    return null;
  }
  if (/^[a-z]+:\/\//i.test(asset) || asset.startsWith("data:") || asset.startsWith("//")) {
    return asset;
  }
  if (asset.startsWith("/import/v2/")) {
    return asset;
  }
  if (asset.startsWith("import/v2/")) {
    return `/${asset}`;
  }
  if (asset.startsWith("/exercises/")) {
    return `/import/v2${asset}`;
  }
  if (asset.startsWith("exercises/")) {
    return `/import/v2/${asset}`;
  }
  if (asset.startsWith("/")) {
    return asset;
  }
  return `/${asset}`;
}

function stripQueryAndHash(src: string) {
  const queryIndex = src.indexOf("?");
  const hashIndex = src.indexOf("#");
  const cutIndex = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (cutIndex === undefined) {
    return src;
  }
  return src.slice(0, cutIndex);
}

function isVideoAsset(src: string) {
  const ext = path.extname(stripQueryAndHash(src)).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
}

function toPublicPath(assetSrc: string) {
  return path.join(process.cwd(), "public", assetSrc.replace(/^\/+/, ""));
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assetExists(assetSrc: string) {
  if (!assetSrc.startsWith("/")) {
    return true;
  }
  return fileExists(toPublicPath(assetSrc));
}

async function firstExisting(candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (await assetExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function buildEntry(raw: V2ImportRawEntry): Promise<V2ImportExercise | null> {
  const code = normalizeText(raw.code);
  if (!code) {
    return null;
  }

  let imageCandidate = normalizeAssetSrc(raw.image);
  let videoCandidate = normalizeAssetSrc(raw.video);
  const thumbCandidate = normalizeAssetSrc(raw.thumb);
  const thumb169Candidate = normalizeAssetSrc(raw.thumb169);
  const defaultImage = defaultImageSrc(code);

  // Backward compatibility: an old `image` value can be a direct video URL.
  if (!videoCandidate && imageCandidate && isVideoAsset(imageCandidate)) {
    videoCandidate = imageCandidate;
    imageCandidate = null;
  }

  const thumb169Src = await firstExisting([
    thumb169Candidate,
    thumbCandidate,
    imageCandidate,
    defaultImage,
  ]);
  const imageSrc = await firstExisting([
    imageCandidate,
    thumb169Src,
    thumbCandidate,
    defaultImage,
  ]);
  const thumbSrc = await firstExisting([
    thumbCandidate,
    thumb169Candidate,
    imageSrc,
    defaultImage,
  ]);
  const videoSrc = await firstExisting([videoCandidate]);

  const resolvedImageSrc = imageSrc ?? thumb169Src ?? thumbSrc;
  const resolvedThumbSrc = thumbSrc ?? thumb169Src ?? resolvedImageSrc;
  const resolvedThumb169Src = thumb169Src ?? thumbSrc ?? resolvedImageSrc;
  const mediaSrc = resolvedThumbSrc ?? resolvedThumb169Src ?? resolvedImageSrc;

  if (!resolvedImageSrc || !resolvedThumbSrc || !resolvedThumb169Src || !mediaSrc) {
    return null;
  }

  const title = normalizeText(raw.title) || code;
  const slug = toSlug(code);
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
    media: mediaSrc,
    source: "v2",
    imageSrc: resolvedImageSrc,
    thumbSrc: resolvedThumbSrc,
    thumb169Src: resolvedThumb169Src,
    videoSrc: videoSrc ?? undefined,
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
