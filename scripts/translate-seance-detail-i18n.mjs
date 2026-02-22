#!/usr/bin/env node
/**
 * Valide / génère les traductions seanceDetail.* FR → EN-US et ES via DeepL.
 * Affiche les résultats pour comparaison, puis patche messages.ts.
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

const SOURCE = {
  notFound:         "Séance introuvable",
  eyebrow:          "Séances",
  terrainMode:      "Mode terrain",
  rundown:          "Déroulé",
  unnamedExercise:  "Exercice à renseigner",
  sets:             "séries",
  rest:             "repos",
};

const keys  = Object.keys(SOURCE);
const texts = Object.values(SOURCE);

async function translateAll(targetLang) {
  console.log(`\n🌐 Traduction → ${targetLang}…`);
  const results = await Promise.all(
    texts.map((text) => translator.translateText(text, "fr", targetLang))
  );
  const out = {};
  keys.forEach((key, i) => { out[key] = results[i].text; });
  return out;
}

// Règle permanente : "entraînement/s'entraîner" → "entrenamiento/entrenar" jamais "formación/formar"
function applyPermanentFixes(obj, lang) {
  if (lang !== "es") return obj;
  const fixed = { ...obj };
  for (const [k, v] of Object.entries(fixed)) {
    fixed[k] = v
      .replace(/\bformación\b/gi, "entrenamiento")
      .replace(/\bformación\b/gi, "entrenamiento")
      .replace(/\bformar(se)?\b/gi, (_, se) => `entrenar${se ?? ""}`);
  }
  return fixed;
}

function buildBlock(obj, lang) {
  const o = applyPermanentFixes(obj, lang);
  return [
    `    seanceDetail: {`,
    `      notFound: ${JSON.stringify(o.notFound)},`,
    `      eyebrow: ${JSON.stringify(o.eyebrow)},`,
    `      terrainMode: ${JSON.stringify(o.terrainMode)},`,
    `      rundown: ${JSON.stringify(o.rundown)},`,
    `      unnamedExercise: ${JSON.stringify(o.unnamedExercise)},`,
    `      sets: ${JSON.stringify(o.sets)},`,
    `      rest: ${JSON.stringify(o.rest)},`,
    `    },`,
  ].join("\n");
}

function patchLocaleSeanceDetail(src, localeMarker, newBlock) {
  const localeIdx = src.indexOf(localeMarker);
  if (localeIdx === -1) throw new Error(`Marker not found: ${localeMarker}`);

  const blockStart = src.indexOf("    seanceDetail: {", localeIdx);
  if (blockStart === -1) throw new Error(`seanceDetail not found after ${localeMarker}`);

  let depth = 0;
  let i = blockStart + "    seanceDetail: {".length;
  let blockEnd = -1;
  while (i < src.length) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      if (depth === 0) { blockEnd = i + 1; break; }
      depth--;
    }
    i++;
  }
  if (blockEnd === -1) throw new Error("Could not find closing } for seanceDetail");

  return src.slice(0, blockStart) + newBlock + src.slice(blockEnd);
}

async function main() {
  const usage = await translator.getUsage();
  console.log(`📊 DeepL usage: ${usage.character.count} / ${usage.character.limit} chars`);

  const [enData, esData] = await Promise.all([
    translateAll("en-US"),
    translateAll("es"),
  ]);

  const esFixed = applyPermanentFixes(esData, "es");

  console.log("\n✅ Résultats EN:");
  console.table(enData);
  console.log("\n✅ Résultats ES (après corrections permanentes):");
  console.table(esFixed);

  const messagesPath = "./src/lib/i18n/messages.ts";
  let src = await readFile(messagesPath, "utf8");

  src = patchLocaleSeanceDetail(src, "  en: {", buildBlock(enData, "en"));
  src = patchLocaleSeanceDetail(src, "  es: {", buildBlock(esFixed, "es"));

  await writeFile(messagesPath, src, "utf8");
  console.log("\n✅ messages.ts mis à jour (EN + ES).");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
