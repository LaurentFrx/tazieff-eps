#!/usr/bin/env node

/**
 * Script de traduction automatique des exercices MDX
 * Traduit tous les fichiers .fr.mdx en .en.mdx et .es.mdx via DeepL API
 */

import * as deepl from "deepl-node";
import matter from "gray-matter";
import { readdir, readFile, writeFile, access } from "fs/promises";
import { join, basename } from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

// Configuration
const EXERCISES_DIR = "./content/exercices";
const SOURCE_LANG = "fr";
const TARGET_LANGS = ["en-US", "es"];

// Helper pour attendre
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Vérifier la clé API
const API_KEY = process.env.DEEPL_API_KEY;
if (!API_KEY) {
  console.error("❌ Erreur: DEEPL_API_KEY manquante dans .env.local");
  console.error("Ajoutez: DEEPL_API_KEY=votre-clé-ici");
  process.exit(1);
}

// Initialiser le client DeepL
const translator = new deepl.Translator(API_KEY);

/**
 * Traduit le frontmatter YAML
 */
function translateFrontmatter(fm, translations) {
  return {
    ...fm,
    title: translations.title,
    // Le reste reste identique (slug, level, equipment, etc.)
  };
}

/**
 * Traduit le contenu Markdown
 */
function translateContent(content, translations) {
  return translations.content;
}

/**
 * Traduit un exercice vers une langue cible
 */
async function translateExercise(filePath, targetLang) {
  const fileName = basename(filePath);
  const slug = fileName.replace(".fr.mdx", "");

  // Vérifier si le fichier existe déjà
  const targetFile = join(EXERCISES_DIR, `${slug}.${targetLang}.mdx`);
  try {
    await access(targetFile);
    return targetFile; // Fichier existe, skip
  } catch {
    // Fichier n'existe pas, continuer
  }

  // Lire le fichier source
  const source = await readFile(filePath, "utf-8");
  const { data: frontmatter, content } = matter(source);

  // Traduire le titre et le contenu
  const [titleResult, contentResult] = await Promise.all([
    translator.translateText(frontmatter.title, SOURCE_LANG, targetLang),
    translator.translateText(content, SOURCE_LANG, targetLang),
  ]);

  // Reconstruire le fichier traduit
  const translatedFrontmatter = translateFrontmatter(frontmatter, {
    title: titleResult.text,
  });

  const translatedContent = translateContent(content, {
    content: contentResult.text,
  });

  const output = matter.stringify(translatedContent, translatedFrontmatter);

  // Écrire le fichier traduit (targetFile déjà déclaré ligne 61)
  await writeFile(targetFile, output, "utf-8");

  return targetFile;
}

/**
 * Script principal
 */
async function main() {
  console.log("🌍 Traduction des exercices MDX\n");

  // Lister tous les fichiers .fr.mdx
  const files = await readdir(EXERCISES_DIR);
  const frFiles = files
    .filter((f) => f.endsWith(".fr.mdx"))
    .map((f) => join(EXERCISES_DIR, f));

  console.log(`📁 ${frFiles.length} exercices français trouvés\n`);

  // Traduire chaque fichier
  let completed = 0;
  const total = frFiles.length * TARGET_LANGS.length;

  for (const filePath of frFiles) {
    const fileName = basename(filePath);

    for (const targetLang of TARGET_LANGS) {
      try {
        await translateExercise(filePath, targetLang);
        completed++;
        console.log(
          `✓ [${completed}/${total}] ${fileName} → ${targetLang.toUpperCase()}`,
        );
        // Attendre 2 secondes entre chaque traduction (rate limit)
        await sleep(2000);
      } catch (error) {
        console.error(
          `✗ Erreur sur ${fileName} → ${targetLang}:`,
          error.message,
        );
      }
    }
  }

  console.log(
    `\n✅ Traduction terminée: ${completed}/${total} fichiers générés`,
  );
  console.log(`\n📊 Statistiques DeepL:`);

  // Afficher l'usage DeepL
  try {
    const usage = await translator.getUsage();
    if (usage.anyLimitReached()) {
      console.log("⚠️  Limite DeepL atteinte!");
    }
    if (usage.character) {
      const percent = (
        (usage.character.count / usage.character.limit) *
        100
      ).toFixed(1);
      console.log(
        `   Caractères: ${usage.character.count.toLocaleString()} / ${usage.character.limit.toLocaleString()} (${percent}%)`,
      );
    }
  } catch (error) {
    console.log("   (Impossible de récupérer les stats)");
  }
}

// Exécuter
main().catch((error) => {
  console.error("\n❌ Erreur fatale:", error);
  process.exit(1);
});
