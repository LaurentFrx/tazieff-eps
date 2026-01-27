import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

type PdfExercise = {
  code: string;
  title?: string;
  level?: string;
  equipment?: string;
  muscles?: string;
  objective?: string;
  anatomy?: string;
  key_points?: string[];
  safety?: string[];
  regress?: string;
  progress?: string;
  dosage?: string;
  image?: string;
};

type LegacyMapEntry = {
  legacyRef?: string;
  legacyTitle?: string;
};

const ROOT = process.cwd();
const FR_DIR = path.join(ROOT, "content", "exercices", "fr");
const EN_DIR = path.join(ROOT, "content", "exercices", "en");
const LEGACY_MAP_PATH = path.join(ROOT, "content", "exercices", "_legacy-map.json");

const SOURCE_PRIMARY =
  "C:/Users/wakaw/Documents/DEV/repos/eps-guide-app/exercisesFromPdf.json";
const SOURCE_FALLBACK =
  "C:/Users/wakaw/Documents/DEV/repos/eps-guide-app/scripts/out/exercisesFromPdf.json";

const PLACEHOLDER_FR = "À compléter";
const PLACEHOLDER_EN = "To complete";
const EN_NOTE = "(EN translation to refine)";

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeCode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = /^S\s*([1-5])\s*[-_\s]?\s*(\d{1,2})$/i.exec(trimmed);
  if (!match) return null;
  const session = match[1];
  const index = match[2].padStart(2, "0");
  return `S${session}-${index}`;
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isPlaceholderText(value: string) {
  const normalized = normalizeTitle(value);
  return (
    normalized === "a completer" ||
    normalized === "a completer." ||
    normalized === "contenu a completer" ||
    normalized === "to complete"
  );
}

function cleanText(value?: string) {
  if (!value) return "";
  const cleaned = cleanWhitespace(value);
  if (!cleaned || isPlaceholderText(cleaned)) return "";
  return cleaned;
}

function shouldDropListItem(value: string) {
  const normalized = normalizeTitle(value);
  return (
    normalized === "points cles" ||
    normalized === "points cles technique" ||
    normalized === "points cles techniques" ||
    normalized === "point cle" ||
    normalized === "technique" ||
    normalized === "securite" ||
    normalized === "securite." ||
    normalized === "safety" ||
    normalized === "key points"
  );
}

function mergeLineFragments(items: string[]) {
  const merged: string[] = [];
  for (const raw of items) {
    const value = raw.trim();
    if (!value) continue;
    if (merged.length === 0) {
      merged.push(value);
      continue;
    }
    const prev = merged[merged.length - 1];
    const prevTrim = prev.trim();
    const nextTrim = value.trim();
    const prevEndsWithPunct = /[.!?…]$/.test(prevTrim);
    const prevEndsWithColon = /:$/.test(prevTrim);
    const nextStartsLower = /^[a-zà-ÿ]/.test(nextTrim);
    if ((!prevEndsWithPunct && nextStartsLower) || prevEndsWithColon) {
      merged[merged.length - 1] = `${prevTrim} ${nextTrim}`;
      continue;
    }
    merged.push(nextTrim);
  }
  return merged;
}

function dedupe(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function cleanList(values?: string[]) {
  if (!values || values.length === 0) return [];
  const cleaned = values
    .map((value) => cleanText(value))
    .filter(Boolean)
    .filter((value) => !shouldDropListItem(value));
  const merged = mergeLineFragments(cleaned);
  return dedupe(merged);
}

function mergeMuscles(muscles?: string, anatomy?: string) {
  const cleanedMuscles = cleanText(muscles);
  const cleanedAnatomy = cleanText(anatomy);
  if (!cleanedMuscles && !cleanedAnatomy) return "";
  if (!cleanedMuscles) return cleanedAnatomy;
  if (!cleanedAnatomy) return cleanedMuscles;
  const a = normalizeTitle(cleanedMuscles);
  const b = normalizeTitle(cleanedAnatomy);
  if (a === b) return cleanedMuscles;
  return `${cleanedMuscles} / ${cleanedAnatomy}`;
}

function applyCase(source: string, replacement: string) {
  if (!source) return replacement;
  if (source.toUpperCase() === source) return replacement.toUpperCase();
  if (source[0].toUpperCase() === source[0]) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement.toLowerCase();
}

const TRANSLATIONS: Array<[RegExp, string]> = [
  [/\brenforcer\b/gi, "strengthen"],
  [/\bam[eé]liorer\b/gi, "improve"],
  [/\bstabilit[eé]\b/gi, "stability"],
  [/\btronc\b/gi, "core"],
  [/\bsangle abdominale\b/gi, "abdominal wall"],
  [/\bceinture abdominale\b/gi, "abdominal belt"],
  [/\bceinture scapulaire\b/gi, "shoulder girdle"],
  [/\brespiration\b/gi, "breathing"],
  [/\breguli[eè]re\b/gi, "steady"],
  [/\bcontinue\b/gi, "steady"],
  [/\bposition neutre\b/gi, "neutral position"],
  [/\bbassin neutre\b/gi, "neutral pelvis"],
  [/\bbassin\b/gi, "pelvis"],
  [/\bregard vers le sol\b/gi, "gaze toward the floor"],
  [/\bpas d'apn[eé]e prolong[eé]e\b/gi, "no prolonged breath-holding"],
  [/\bapn[eé]e\b/gi, "breath-holding"],
  [/\bcreuser le bas du dos\b/gi, "arching the lower back"],
  [/\bbas du dos\b/gi, "lower back"],
  [/\bgenoux au sol\b/gi, "knees on the floor"],
  [/\bappui mains\b/gi, "hands support"],
  [/\bdur[eé]e r[eé]duite\b/gi, "reduced duration"],
  [/\binstabilit[eé]\b/gi, "instability"],
  [/\bqualit[eé]\b/gi, "quality"],
  [/\brepos\b/gi, "rest"],
  [/\baucun\b/gi, "none"],
  [/\btapis de sol\b/gi, "exercise mat"],
  [/\btapis\b/gi, "mat"],
  [/\bfonction\b/gi, "function"],
  [/\bgainage\b/gi, "bracing"],
  [/\bcontrole\b/gi, "control"],
  [/\bexecution\b/gi, "execution"],
  [/\bdeltoides\b/gi, "deltoids"],
  [/\bpectoraux\b/gi, "pectorals"],
  [/\bgrand droit des abdominaux\b/gi, "rectus abdominis"],
  [/\babdominaux\b/gi, "abdominals"],
  [/\btransverse\b/gi, "transverse abdominis"],
  [/\bgrand fessier\b/gi, "gluteus maximus"],
  [/\bfessiers\b/gi, "glutes"],
  [/\bfessier\b/gi, "glute"],
  [/\bischio-?jambiers\b/gi, "hamstrings"],
  [/\bquadriceps\b/gi, "quadriceps"],
  [/\blombaires\b/gi, "lower back"],
  [/\btriceps\b/gi, "triceps"],
  [/\bbiceps\b/gi, "biceps"],
  [/\bmollets\b/gi, "calves"],
  [/\badducteurs\b/gi, "adductors"],
  [/\babducteurs\b/gi, "abductors"],
  [/\bextension\b/gi, "extension"],
  [/\bflexion\b/gi, "flexion"],
  [/\banterieure\b/gi, "anterior"],
  [/\bposterieur\b/gi, "posterior"],
];

function translateText(value: string) {
  let output = value;
  for (const [pattern, replacement] of TRANSLATIONS) {
    output = output.replace(pattern, (match) => applyCase(match, replacement));
  }
  return output;
}

function normalizeCompare(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

type BuildResult = {
  body: string;
  placeholders: number;
  translated: boolean;
  hadSource: boolean;
};

function buildFrBody(entry?: PdfExercise): BuildResult {
  const objective = cleanText(entry?.objective);
  const equipment = cleanText(entry?.equipment);
  const musclesInfo = mergeMuscles(entry?.muscles, entry?.anatomy);
  const keyPoints = cleanList(entry?.key_points);
  const safety = cleanList(entry?.safety);
  const regress = cleanText(entry?.regress);
  const progress = cleanText(entry?.progress);
  const dosage = cleanText(entry?.dosage);

  let placeholders = 0;
  const lines: string[] = [];

  lines.push("## Objectif");
  if (objective) {
    lines.push(objective);
  } else {
    lines.push(PLACEHOLDER_FR);
    placeholders += 1;
  }
  if (musclesInfo) {
    lines.push("");
    lines.push(`Muscles / fonction : ${musclesInfo}`);
  }
  lines.push("");

  lines.push("## Matériel");
  if (equipment) {
    lines.push(equipment);
  } else {
    lines.push(PLACEHOLDER_FR);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Mise en place");
  lines.push(PLACEHOLDER_FR);
  placeholders += 1;
  lines.push("");

  lines.push("## Exécution");
  lines.push(PLACEHOLDER_FR);
  placeholders += 1;
  lines.push("");

  lines.push("## Points clés");
  const pointBullets: string[] = [...keyPoints];
  if (dosage) {
    pointBullets.push(`Dosage recommandé : ${dosage}`);
  }
  if (pointBullets.length > 0) {
    for (const item of pointBullets) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push(`- ${PLACEHOLDER_FR}`);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Erreurs fréquentes");
  lines.push(`- ${PLACEHOLDER_FR}`);
  placeholders += 1;
  lines.push("");

  lines.push("## Variantes / Régressions");
  const variants: string[] = [];
  if (regress) variants.push(`Régression : ${regress}`);
  if (progress) variants.push(`Progression : ${progress}`);
  if (variants.length > 0) {
    for (const item of variants) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push(`- ${PLACEHOLDER_FR}`);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Sécurité");
  if (safety.length > 0) {
    for (const item of safety) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push(`- ${PLACEHOLDER_FR}`);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Repères par thème");
  lines.push(`- T1 (puissance): ${PLACEHOLDER_FR}`);
  lines.push(`- T2 (endurance de force): ${PLACEHOLDER_FR}`);
  lines.push(`- T3 (volume): ${PLACEHOLDER_FR}`);
  placeholders += 3;

  return {
    body: lines.join("\n").trimEnd() + "\n",
    placeholders,
    translated: true,
    hadSource: Boolean(entry),
  };
}

function translateList(values: string[]) {
  return values.map((value) => translateText(value));
}

function buildEnBody(entry?: PdfExercise): BuildResult {
  const objective = cleanText(entry?.objective);
  const equipment = cleanText(entry?.equipment);
  const musclesInfo = mergeMuscles(entry?.muscles, entry?.anatomy);
  const keyPoints = cleanList(entry?.key_points);
  const safety = cleanList(entry?.safety);
  const regress = cleanText(entry?.regress);
  const progress = cleanText(entry?.progress);
  const dosage = cleanText(entry?.dosage);

  let placeholders = 0;
  let translated = false;

  const translatedObjective = objective ? translateText(objective) : "";
  if (objective && normalizeCompare(translatedObjective) !== normalizeCompare(objective)) {
    translated = true;
  }

  const translatedEquipment = equipment ? translateText(equipment) : "";
  if (equipment && normalizeCompare(translatedEquipment) !== normalizeCompare(equipment)) {
    translated = true;
  }

  const translatedMuscles = musclesInfo ? translateText(musclesInfo) : "";
  if (musclesInfo && normalizeCompare(translatedMuscles) !== normalizeCompare(musclesInfo)) {
    translated = true;
  }

  const translatedKeyPoints = translateList(keyPoints);
  for (let i = 0; i < keyPoints.length; i += 1) {
    if (
      normalizeCompare(translatedKeyPoints[i] ?? "") !==
      normalizeCompare(keyPoints[i] ?? "")
    ) {
      translated = true;
      break;
    }
  }

  const translatedSafety = translateList(safety);
  for (let i = 0; i < safety.length; i += 1) {
    if (
      normalizeCompare(translatedSafety[i] ?? "") !==
      normalizeCompare(safety[i] ?? "")
    ) {
      translated = true;
      break;
    }
  }

  const translatedRegress = regress ? translateText(regress) : "";
  if (regress && normalizeCompare(translatedRegress) !== normalizeCompare(regress)) {
    translated = true;
  }

  const translatedProgress = progress ? translateText(progress) : "";
  if (progress && normalizeCompare(translatedProgress) !== normalizeCompare(progress)) {
    translated = true;
  }

  const translatedDosage = dosage ? translateText(dosage) : "";
  if (dosage && normalizeCompare(translatedDosage) !== normalizeCompare(dosage)) {
    translated = true;
  }

  const lines: string[] = [];

  lines.push("## Goal");
  if (translatedObjective) {
    lines.push(translatedObjective);
  } else {
    lines.push(PLACEHOLDER_EN);
    placeholders += 1;
  }
  if (translatedMuscles) {
    lines.push("");
    lines.push(`Muscles / function: ${translatedMuscles}`);
  }
  lines.push("");

  lines.push("## Equipment");
  if (translatedEquipment) {
    lines.push(translatedEquipment);
  } else {
    lines.push(PLACEHOLDER_EN);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Setup");
  lines.push(PLACEHOLDER_EN);
  placeholders += 1;
  lines.push("");

  lines.push("## Execution");
  lines.push(PLACEHOLDER_EN);
  placeholders += 1;
  lines.push("");

  lines.push("## Key points");
  const pointBullets: string[] = [...translatedKeyPoints];
  if (translatedDosage) {
    pointBullets.push(`Recommended dosage: ${translatedDosage}`);
  }
  if (pointBullets.length > 0) {
    for (const item of pointBullets) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push(`- ${PLACEHOLDER_EN}`);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Common mistakes");
  lines.push(`- ${PLACEHOLDER_EN}`);
  placeholders += 1;
  lines.push("");

  lines.push("## Variations / Regressions");
  const variants: string[] = [];
  if (translatedRegress) variants.push(`Regression: ${translatedRegress}`);
  if (translatedProgress) variants.push(`Progression: ${translatedProgress}`);
  if (variants.length > 0) {
    for (const item of variants) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push(`- ${PLACEHOLDER_EN}`);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Safety");
  if (translatedSafety.length > 0) {
    for (const item of translatedSafety) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push(`- ${PLACEHOLDER_EN}`);
    placeholders += 1;
  }
  lines.push("");

  lines.push("## Theme cues");
  lines.push(`- T1 (power): ${PLACEHOLDER_EN}`);
  lines.push(`- T2 (strength endurance): ${PLACEHOLDER_EN}`);
  lines.push(`- T3 (hypertrophy): ${PLACEHOLDER_EN}`);
  placeholders += 3;

  if (!translated && entry) {
    lines.push("");
    lines.push(EN_NOTE);
  }

  return {
    body: lines.join("\n").trimEnd() + "\n",
    placeholders,
    translated,
    hadSource: Boolean(entry),
  };
}

function extractFrontmatter(raw: string, filePath: string) {
  const match = raw.match(/^(?:\uFEFF|\s)*---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) {
    throw new Error(`Frontmatter block not found in ${filePath}`);
  }
  return match[0];
}

function buildBody(locale: "fr" | "en", entry?: PdfExercise) {
  if (locale === "fr") return buildFrBody(entry);
  return buildEnBody(entry);
}

async function updateMdxFile(
  dir: string,
  slug: string,
  entry: PdfExercise | undefined,
  locale: "fr" | "en",
) {
  const filePath = path.join(dir, `${slug}.mdx`);
  const raw = await fs.readFile(filePath, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const frontmatterBlock = extractFrontmatter(raw, filePath);
  matter(raw);

  const { body } = buildBody(locale, entry);
  const output =
    frontmatterBlock.replace(/\r?\n/g, eol) + body.replace(/\n/g, eol);

  if (output !== raw) {
    await fs.writeFile(filePath, output, "utf8");
  }
}

async function main() {
  const sourcePath = (await fileExists(SOURCE_PRIMARY))
    ? SOURCE_PRIMARY
    : SOURCE_FALLBACK;

  if (!(await fileExists(sourcePath))) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const raw = await fs.readFile(sourcePath, "utf8");
  const entries = JSON.parse(raw) as PdfExercise[];

  const byCode = new Map<string, PdfExercise>();
  const byTitle = new Map<string, PdfExercise>();

  for (const entry of entries) {
    const normalized = normalizeCode(entry.code);
    if (!normalized) continue;
    byCode.set(normalized, entry);
    const title = cleanText(entry.title ?? "");
    if (title) {
      const key = normalizeTitle(title);
      if (!byTitle.has(key)) {
        byTitle.set(key, entry);
      }
    }
  }

  const legacyMapRaw = await fs.readFile(LEGACY_MAP_PATH, "utf8");
  const legacyMap = JSON.parse(legacyMapRaw) as Record<string, LegacyMapEntry>;
  const slugs = Object.keys(legacyMap).sort((a, b) => a.localeCompare(b));

  const missing: string[] = [];

  for (const slug of slugs) {
    const normalizedSlug = normalizeSlug(slug);
    const code = normalizeCode(normalizedSlug.toUpperCase());
    let entry: PdfExercise | undefined = undefined;

    if (code) {
      entry = byCode.get(code);
    }

    if (!entry) {
      const legacyTitle = cleanText(legacyMap[slug]?.legacyTitle ?? "");
      if (legacyTitle) {
        entry = byTitle.get(normalizeTitle(legacyTitle));
      }
    }

    if (!entry && code) {
      entry = byCode.get(code);
    }

    if (!entry) {
      missing.push(slug);
    }
    await updateMdxFile(FR_DIR, slug, entry, "fr");
    await updateMdxFile(EN_DIR, slug, entry, "en");
  }

  console.log(`Source used: ${sourcePath}`);
  console.log(`Updated ${slugs.length} exercises (FR + EN).`);
  if (missing.length > 0) {
    console.log("Missing source entries:", missing.join(", "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
