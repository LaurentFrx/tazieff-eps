/**
 * Convert exercisesFromPdf.json → content/exercices/{slug}.mdx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const INPUT = path.join(ROOT, "public/import/v2/data/exercisesFromPdf.json");
const OUTPUT_DIR = path.join(ROOT, "content/exercices");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugFromCode(code) {
  return code.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function mapLevel(raw) {
  const normalized = (raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (normalized === "debutant") return "debutant";
  if (normalized === "avance") return "avance";
  return "intermediaire";
}

function cleanMuscle(muscle) {
  // Remove "Fonction: ..." suffix
  return muscle.replace(/\s*Fonction:.*$/i, "").trim();
}

function cleanMusclesList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(cleanMuscle)
    .filter((m) => m.length > 0 && m.toLowerCase() !== "fonction");
}

function cleanEquipmentList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((e) => e.trim()).filter(Boolean);
}

/** Generate tags based on exercise title, muscles, and code section */
function generateTags(exercise) {
  const tags = new Set();
  const title = (exercise.title ?? "").toLowerCase();
  const code = exercise.code ?? "";
  const section = code.split("-")[0]?.toUpperCase();

  // Section-based tags
  const sectionTags = {
    S1: "gainage",
    S2: "dynamique",
    S3: "renforcement",
    S4: "mobilite",
    S5: "etirement",
  };
  if (sectionTags[section]) tags.add(sectionTags[section]);

  // Title-based keyword tags
  const keywords = {
    planche: "gainage",
    gainage: "gainage",
    superman: "gainage",
    crunch: "abdominaux",
    squat: "jambes",
    fente: "jambes",
    lunge: "jambes",
    pompe: "haut du corps",
    "push-up": "haut du corps",
    burpee: "cardio",
    mountain: "cardio",
    jumping: "cardio",
    tirage: "dos",
    rowing: "dos",
    curl: "bras",
    dips: "haut du corps",
    etirement: "etirement",
    stretch: "etirement",
    mobilite: "mobilite",
    chaise: "jambes",
    "hip thrust": "fessiers",
    pont: "fessiers",
    mollet: "jambes",
    elevation: "epaules",
    oiseau: "dos",
    deadlift: "dos",
    soulevé: "dos",
  };

  for (const [kw, tag] of Object.entries(keywords)) {
    if (title.includes(kw)) tags.add(tag);
  }

  // Ensure at least one tag
  if (tags.size === 0) tags.add("fondamentaux");

  return [...tags];
}

function yamlArray(arr) {
  return "[" + arr.map((v) => JSON.stringify(v)).join(", ") + "]";
}

/** Join safety array fragments into coherent sentences */
function joinSafetyFragments(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  // Join fragments, then split on sentence boundaries
  const raw = arr.join(" ").replace(/\s+/g, " ").trim();
  return raw;
}

function bulletList(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .filter((item) => {
      const cleaned = item.trim().toLowerCase();
      return cleaned.length > 0 && cleaned !== "points cles";
    })
    .map((item) => `- ${item.trim()}`)
    .join("\n");
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const exercises = JSON.parse(fs.readFileSync(INPUT, "utf8"));
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let created = 0;
let skipped = 0;

for (const exercise of exercises) {
  const slug = slugFromCode(exercise.code);
  const outPath = path.join(OUTPUT_DIR, `${slug}.mdx`);

  // Skip if file already exists
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP ${slug}.mdx (already exists)`);
    skipped++;
    continue;
  }

  const level = mapLevel(exercise.level || exercise.difficulty);
  const muscles = cleanMusclesList(exercise.musclesList);
  const equipment = cleanEquipmentList(exercise.equipmentList);
  const tags = generateTags(exercise);
  const title = capitalize(
    (exercise.title ?? slug).toLowerCase().replace(/\s+/g, " ").trim()
  );

  // Build frontmatter
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `slug: ${JSON.stringify(slug)}`,
    `level: ${JSON.stringify(level)}`,
  ];
  if (equipment.length > 0) {
    frontmatter.push(`equipment: ${yamlArray(equipment)}`);
  }
  frontmatter.push(`muscles: ${yamlArray(muscles.length > 0 ? muscles : ["corps entier"])}`);
  frontmatter.push(`tags: ${yamlArray(tags)}`);
  frontmatter.push(`media: "/images/exos/${slug}.webp"`);
  frontmatter.push("themeCompatibility: [1, 2, 3]");
  frontmatter.push("---");

  // Build content
  const sections = [];

  // Summary
  if (exercise.summary) {
    const summary = exercise.summary
      .replace(/\s+/g, " ")
      .trim();
    sections.push(`## Résumé\n${summary}`);
  }

  // Execution steps
  const execSteps = bulletList(exercise.executionSteps);
  if (execSteps) {
    sections.push(`## Exécution\n${execSteps}`);
  }

  // Breathing
  if (exercise.breathing) {
    sections.push(`## Respiration\n${capitalize(exercise.breathing.trim())}`);
  }

  // Tips (already includes regress + progress from JSON extraction)
  const tipsBullets = bulletList(Array.isArray(exercise.tips) ? exercise.tips : []);
  if (tipsBullets) {
    sections.push(`## Conseils\n${tipsBullets}`);
  }

  // Dosage
  if (exercise.dosage) {
    sections.push(`## Dosage\n${exercise.dosage.trim()}`);
  }

  // Safety
  const safetyText = joinSafetyFragments(exercise.safety);
  if (safetyText) {
    sections.push(`## Sécurité\n${safetyText}`);
  }

  const content = frontmatter.join("\n") + "\n\n" + sections.join("\n\n") + "\n";

  fs.writeFileSync(outPath, content, "utf8");
  console.log(`  CREATE ${slug}.mdx`);
  created++;
}

console.log(`\nDone: ${created} created, ${skipped} skipped (already exist).`);
