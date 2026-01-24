import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = value;
        i += 1;
      }
    }
  }
  return args;
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checker, [command], { stdio: "ignore" });
  return result.status === 0;
}

async function ensureFile(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`PDF introuvable: ${filePath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pdfPath = args.pdf ?? process.env.PDF_PATH;
  const outDir = args.out ?? process.env.OUT_DIR;
  const prefix = args.prefix ?? process.env.PREFIX ?? "document";

  if (!pdfPath || !outDir) {
    console.error(
      "Usage: node tools/pdf/extract-images.mjs --pdf <path> --out <dir> --prefix <slug>",
    );
    process.exit(1);
  }

  await ensureFile(pdfPath);
  await fs.mkdir(outDir, { recursive: true });

  if (commandExists("pdfimages")) {
    const outputBase = path.join(outDir, `${prefix}-raw`);
    const result = spawnSync(
      "pdfimages",
      ["-all", pdfPath, outputBase],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
    return;
  }

  if (commandExists("mutool")) {
    const result = spawnSync(
      "mutool",
      ["extract", "-o", outDir, pdfPath],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
    return;
  }

  console.error(
    "Aucun outil de extraction trouvé. Installez pdfimages (poppler-utils) ou mutool (mupdf-tools).\n" +
      "Exemples (WSL): sudo apt install poppler-utils || sudo apt install mupdf-tools",
  );
  process.exit(1);
}

await main();
