#!/usr/bin/env node
/**
 * Traduit les clés pages.home.* de FR → EN-US et ES via DeepL
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

// Strings source (FR) — ordre important, clés associées
const SOURCE = {
  title: "LA MUSCULATION",
  themesHeading: "Les 3 thèmes au choix :",
  theme1Alt: "Endurance de force",
  theme2Alt: "Gain de volume",
  theme3Alt: "Gain de puissance",
  projectsHeading: "Les projets spécifiques :",
  project1: "DÉTENTE VERTICALE",
  project2: "VITESSE et AGILITÉ en SPORTS COLLECTIFS",
  knowledgeHeading: "Connaissances pour s'entraîner",
  knowledge1: "LES MUSCLES ET LEUR FONCTIONNEMENT",
  knowledge2: "MÉTHODES D'ENTRAÎNEMENT",
  knowledge3: "RM/RIR/RPE",
  safetyPrinciples: "PRINCIPES SÉCURITAIRES",
  skills: "Compétences attendues au lycée (démarche spiralaire).",
  evaluation: "Évaluation",
  eval2nde: "Évaluation en 2nde",
  eval1ere: "Évaluation en 1ère",
  evalTerminale: "Évaluation en Terminale",
};

const keys = Object.keys(SOURCE);
const texts = Object.values(SOURCE);

async function translateAll(targetLang) {
  console.log(`\n🌐 Traduction → ${targetLang}…`);
  const results = await Promise.all(
    texts.map((text) => translator.translateText(text, "fr", targetLang))
  );
  const out = {};
  keys.forEach((key, i) => {
    out[key] = results[i].text;
  });
  return out;
}

function buildHomeBlock(obj) {
  return [
    `        title: ${JSON.stringify(obj.title)},`,
    `        themesHeading: ${JSON.stringify(obj.themesHeading)},`,
    `        theme1Alt: ${JSON.stringify(obj.theme1Alt)},`,
    `        theme2Alt: ${JSON.stringify(obj.theme2Alt)},`,
    `        theme3Alt: ${JSON.stringify(obj.theme3Alt)},`,
    `        projectsHeading: ${JSON.stringify(obj.projectsHeading)},`,
    `        project1: ${JSON.stringify(obj.project1)},`,
    `        project2: ${JSON.stringify(obj.project2)},`,
    `        knowledgeHeading: ${JSON.stringify(obj.knowledgeHeading)},`,
    `        knowledge1: ${JSON.stringify(obj.knowledge1)},`,
    `        knowledge2: ${JSON.stringify(obj.knowledge2)},`,
    `        knowledge3: ${JSON.stringify(obj.knowledge3)},`,
    `        safetyPrinciples: ${JSON.stringify(obj.safetyPrinciples)},`,
    `        skills: ${JSON.stringify(obj.skills)},`,
    `        evaluation: ${JSON.stringify(obj.evaluation)},`,
    `        eval2nde: ${JSON.stringify(obj.eval2nde)},`,
    `        eval1ere: ${JSON.stringify(obj.eval1ere)},`,
    `        evalTerminale: ${JSON.stringify(obj.evalTerminale)},`,
  ].join("\n");
}

// Remplace le bloc home d'un locale dans le texte source du fichier TS
function patchLocale(src, localeMarker, newBlock) {
  // Regex: trouve "home: {" après le marqueur de locale, et remplace jusqu'au "}" fermant
  // On cherche le pattern: (dans la section du locale) home: {\n...\n      },
  const homeBlockRe =
    /(\bpages:\s*\{[^}]*?\bhome:\s*\{)([\s\S]*?)(\s*\},\s*\n\s*exos:)/;

  // On va travailler section par section en découpant sur les locales
  // Trouver la position du locale
  const localeIdx = src.indexOf(localeMarker);
  if (localeIdx === -1) throw new Error(`Locale marker not found: ${localeMarker}`);

  // Trouver "home: {" après le locale
  const homeStart = src.indexOf("      home: {", localeIdx);
  if (homeStart === -1) throw new Error(`home: { not found after ${localeMarker}`);

  // Trouver la fermeture "      }," du bloc home
  // On compte les accolades
  let depth = 0;
  let i = homeStart + "      home: {".length;
  let homeEnd = -1;
  while (i < src.length) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      if (depth === 0) {
        homeEnd = i + 1; // inclut le "}"
        break;
      }
      depth--;
    }
    i++;
  }
  if (homeEnd === -1) throw new Error("Could not find closing } for home block");

  const replacement =
    `      home: {\n` +
    newBlock +
    `\n      }`;

  return src.slice(0, homeStart) + replacement + src.slice(homeEnd);
}

async function main() {
  const usage = await translator.getUsage();
  console.log(
    `📊 DeepL usage: ${usage.character.count} / ${usage.character.limit} chars`
  );

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

  // Patch EN
  src = patchLocale(src, "  en: {", buildHomeBlock(enData));
  // Patch ES
  src = patchLocale(src, "  es: {", buildHomeBlock(esData));

  await writeFile(messagesPath, src, "utf8");
  console.log("\n✅ messages.ts mis à jour.");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
