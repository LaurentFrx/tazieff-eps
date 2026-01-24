import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

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

function isImageFile(name) {
  const ext = path.extname(name).toLowerCase();
  return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inDir = args.in ?? process.env.IN_DIR;
  const outDir = args.out ?? process.env.OUT_DIR;
  const prefix = args.prefix ?? process.env.PREFIX ?? "figure";

  if (!inDir || !outDir) {
    console.error(
      "Usage: node tools/pdf/to-webp.mjs --in <dir> --out <dir> --prefix <slug>",
    );
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });

  const entries = await fs.readdir(inDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) {
    console.warn(`Aucune image trouvée dans ${inDir}`);
    return;
  }

  const manifest = [];
  let index = 1;
  for (const filename of files) {
    const inPath = path.join(inDir, filename);
    const outName = `${prefix}-fig-${String(index).padStart(3, "0")}.webp`;
    const outPath = path.join(outDir, outName);

    await sharp(inPath).webp({ quality: 82 }).toFile(outPath);

    manifest.push({
      file: outName,
      source: filename,
      index,
    });

    index += 1;
  }

  await fs.writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}

await main();
