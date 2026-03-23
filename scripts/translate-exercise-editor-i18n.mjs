#!/usr/bin/env node
/**
 * Traduit les nouvelles clés exerciseEditor.* de FR → EN-US et ES via DeepL
 * puis met à jour messages.ts (EN + ES uniquement — FR déjà en place).
 */

import * as deepl from "deepl-node";
import { readFile, writeFile } from "fs/promises";
import { config } from "dotenv";
config({ path: ".env.local" });

const API_KEY = process.env.DEEPL_API_KEY;
if (!API_KEY) {
  console.error("❌ DEEPL_API_KEY manquante dans .env.local");
  process.exit(1);
}

const translator = new deepl.Translator(API_KEY);

// Règle permanente ES : "entraîne*" → "entrena*", jamais "forma*"
function applyPermanentFixes(obj, lang) {
  if (lang !== "es") return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      v
        .replace(/\bformación\b/gi, "entrenamiento")
        .replace(/\bformarse\b/gi, "entrenarse")
        .replace(/\bformar(se)?\b/gi, (_, se) => `entrenar${se ?? ""}`),
    ])
  );
}

const SOURCE = {
  imageLoadFailed:   "Impossible de charger l'image.",
  canvasUnavailable: "Canvas indisponible.",
  previewUnavailable:"Aperçu indisponible",
  retry:             "Réessayer",
  untitledSection:   "Section sans titre",
  blockAddedIn:      "✅ Bloc ajouté dans",
  uploading:         "Upload en cours...",
  invalidFormat:     "Format invalide. Utilisez JPEG, PNG ou WEBP.",
  imagePending:      "Image en attente.",
  urlMissing:        "URL manquante.",
  fixSheet:          "Corriger la fiche",
  rememberToSave:    "Pense à Enregistrer",
  savedVersion:      "Version enregistrée",
  activeVersion:     "Version active",
  categories:        "Catégories",
  categoriesDesc:    "Niveau, type, groupes musculaires et thèmes Bac.",
  levelLabel:        "Niveau",
  levelPlaceholder:  "Choisir un niveau…",
  typeLabel:         "Type",
  selectedSingular:  "sélectionné",
  selectedPlural:    "sélectionnés",
  addNoSection:      "Ajoutez d'abord une section.",
};

const keys  = Object.keys(SOURCE);
const texts = Object.values(SOURCE);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateAll(targetLang) {
  console.log(`\n🌐 Traduction → ${targetLang}…`);
  const results = [];
  for (const text of texts) {
    const res = await translator.translateText(text, "fr", targetLang);
    results.push(res);
    await sleep(300);
  }
  return Object.fromEntries(keys.map((k, i) => [k, results[i].text]));
}

function buildNewKeysBlock(obj) {
  return keys.map((k) => `      ${k}: ${JSON.stringify(obj[k])},`).join("\n");
}

// Insère les nouvelles clés juste avant teacherPanel dans un locale
function patchExerciseEditor(src, localeMarker, newBlock) {
  const localeIdx = src.indexOf(localeMarker);
  if (localeIdx === -1) throw new Error(`Marker not found: ${localeMarker}`);

  const teacherPanelIdx = src.indexOf('      teacherPanel:', localeIdx);
  if (teacherPanelIdx === -1) throw new Error(`teacherPanel not found after ${localeMarker}`);

  return (
    src.slice(0, teacherPanelIdx) +
    newBlock + "\n" +
    src.slice(teacherPanelIdx)
  );
}

async function main() {
  const usage = await translator.getUsage();
  console.log(`📊 DeepL usage: ${usage.character.count} / ${usage.character.limit} chars`);

  const enRaw = await translateAll("en-US");
  await sleep(1000);
  const esRaw = await translateAll("es");

  const enData = enRaw; // no fixes needed for EN
  const esData = applyPermanentFixes(esRaw, "es");

  console.log("\n✅ Résultats EN:");
  console.table(enData);
  console.log("\n✅ Résultats ES (après corrections permanentes):");
  console.table(esData);

  const messagesPath = "./src/lib/i18n/messages.ts";
  let src = await readFile(messagesPath, "utf8");

  src = patchExerciseEditor(src, "  en: {", buildNewKeysBlock(enData));
  src = patchExerciseEditor(src, "  es: {", buildNewKeysBlock(esData));

  await writeFile(messagesPath, src, "utf8");
  console.log("\n✅ messages.ts mis à jour (EN + ES).");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
