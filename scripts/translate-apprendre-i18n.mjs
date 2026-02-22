#!/usr/bin/env node
/**
 * Traduit les clés pages.apprendre.cards.* de FR → EN-US et ES via DeepL
 * puis met à jour messages.ts directement.
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

// Strings source (FR) — clé → texte
const SOURCE = {
  "parametres.title":       "Paramètres",
  "parametres.description": "Par thème",
  "techniques.title":       "Techniques d'entraînement",
  "techniques.description": "À compléter",
  "connaissances.title":       "Connaissances",
  "connaissances.description": "À compléter",
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

function buildCardsBlock(obj) {
  return [
    `        parametres: {`,
    `          title: ${JSON.stringify(obj["parametres.title"])},`,
    `          description: ${JSON.stringify(obj["parametres.description"])},`,
    `        },`,
    `        techniques: {`,
    `          title: ${JSON.stringify(obj["techniques.title"])},`,
    `          description: ${JSON.stringify(obj["techniques.description"])},`,
    `        },`,
    `        connaissances: {`,
    `          title: ${JSON.stringify(obj["connaissances.title"])},`,
    `          description: ${JSON.stringify(obj["connaissances.description"])},`,
    `        },`,
  ].join("\n");
}

// Remplace le bloc cards dans la section pages.apprendre d'un locale
function patchApprendreCards(src, localeMarker, newCardsBlock) {
  const localeIdx = src.indexOf(localeMarker);
  if (localeIdx === -1) throw new Error(`Locale marker not found: ${localeMarker}`);

  // Trouver "pages:" après le locale
  const pagesIdx = src.indexOf("    pages: {", localeIdx);
  if (pagesIdx === -1) throw new Error("pages: { not found");

  // Trouver "apprendre:" dans pages
  const apprendreIdx = src.indexOf("      apprendre: {", pagesIdx);
  if (apprendreIdx === -1) throw new Error("apprendre: { not found");

  // Trouver "cards: {" dans apprendre
  const cardsStart = src.indexOf("        cards: {", apprendreIdx);
  if (cardsStart === -1) throw new Error("cards: { not found in apprendre");

  // Trouver la fermeture du bloc cards (compter les accolades)
  let depth = 0;
  let i = cardsStart + "        cards: {".length;
  let cardsEnd = -1;
  while (i < src.length) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      if (depth === 0) { cardsEnd = i + 1; break; }
      depth--;
    }
    i++;
  }
  if (cardsEnd === -1) throw new Error("Could not find closing } for cards block");

  const replacement =
    `        cards: {\n` +
    newCardsBlock +
    `\n        }`;

  return src.slice(0, cardsStart) + replacement + src.slice(cardsEnd);
}

async function main() {
  const usage = await translator.getUsage();
  console.log(`📊 DeepL usage: ${usage.character.count} / ${usage.character.limit} chars`);

  const [enData, esData] = await Promise.all([
    translateAll("en-US"),
    translateAll("es"),
  ]);

  console.log("\n✅ Résultats EN:");
  console.table(enData);
  console.log("\n✅ Résultats ES:");
  console.table(esData);

  const messagesPath = "./src/lib/i18n/messages.ts";
  let src = await readFile(messagesPath, "utf8");

  src = patchApprendreCards(src, "  en: {", buildCardsBlock(enData));
  src = patchApprendreCards(src, "  es: {", buildCardsBlock(esData));

  await writeFile(messagesPath, src, "utf8");
  console.log("\n✅ messages.ts mis à jour (EN + ES).");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
