/**
 * Generate thumb169-{slug}.webp (16:9) from thumb-{slug}.webp (square).
 * Skips files where thumb169 already exists.
 * Usage: node scripts/generate-thumb169.mjs
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const EXOS_DIR = join(import.meta.dirname, "..", "public", "images", "exos");
const WIDTH = 640;
const HEIGHT = 360; // 16:9

async function main() {
  const files = await readdir(EXOS_DIR);
  const thumbFiles = files.filter(
    (f) => f.startsWith("thumb-") && f.endsWith(".webp"),
  );

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of thumbFiles) {
    const slug = file.replace("thumb-", "").replace(".webp", "");
    const outputName = `thumb169-${slug}.webp`;

    if (files.includes(outputName)) {
      skipped++;
      continue;
    }

    const inputPath = join(EXOS_DIR, file);
    const outputPath = join(EXOS_DIR, outputName);

    try {
      await sharp(inputPath)
        .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
        .webp({ quality: 80 })
        .toFile(outputPath);
      generated++;
      console.log(`  + ${outputName}`);
    } catch (err) {
      errors++;
      console.error(`  ! ${file}: ${err.message}`);
    }
  }

  console.log(
    `\nDone: ${generated} generated, ${skipped} already existed, ${errors} errors`,
  );
}

main();
