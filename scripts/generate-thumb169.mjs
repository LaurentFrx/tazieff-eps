/**
 * Generate thumb169-{slug}.webp (16:9, 640×360) for exercise thumbnails.
 *
 * Source priority:
 *   1. {slug}.webp  (full-size image — best quality)
 *   2. thumb-{slug}.webp  (square thumb — fallback)
 *
 * Portrait images (height > width × 1.2) are skipped when using the
 * full-size source; the square thumb is used as fallback instead.
 *
 * Usage: node scripts/generate-thumb169.mjs [--force]
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const EXOS_DIR = join(import.meta.dirname, "..", "public", "images", "exos");
const WIDTH = 640;
const HEIGHT = 360; // 16:9
const FORCE = process.argv.includes("--force");

async function main() {
  const files = await readdir(EXOS_DIR);

  // Collect all slugs from thumb-{slug}.webp files
  const slugs = files
    .filter((f) => f.startsWith("thumb-") && f.endsWith(".webp"))
    .map((f) => f.replace("thumb-", "").replace(".webp", ""));

  let fromFull = 0;
  let fromThumb = 0;
  let skipped = 0;
  let errors = 0;

  for (const slug of slugs) {
    const outputName = `thumb169-${slug}.webp`;
    const outputPath = join(EXOS_DIR, outputName);

    if (!FORCE && files.includes(outputName)) {
      skipped++;
      continue;
    }

    const fullSrc = join(EXOS_DIR, `${slug}.webp`);
    const thumbSrc = join(EXOS_DIR, `thumb-${slug}.webp`);
    let usedSource = "thumb";

    // Try full-size source first
    let inputPath = thumbSrc;
    if (files.includes(`${slug}.webp`)) {
      try {
        const meta = await sharp(fullSrc).metadata();
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;
        // Skip portrait images (height > width × 1.2)
        if (w > 0 && h <= w * 1.2) {
          inputPath = fullSrc;
          usedSource = "full";
        }
      } catch {
        // metadata failed, fall through to thumb
      }
    }

    try {
      await sharp(inputPath)
        .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
        .webp({ quality: 80 })
        .toFile(outputPath);

      if (usedSource === "full") {
        fromFull++;
        console.log(`  + ${outputName} (from ${slug}.webp)`);
      } else {
        fromThumb++;
        console.log(`  + ${outputName} (from thumb-${slug}.webp)`);
      }
    } catch (err) {
      errors++;
      console.error(`  ! ${slug}: ${err.message}`);
    }
  }

  console.log(
    `\nDone: ${fromFull} from full source, ${fromThumb} from thumb fallback, ${skipped} skipped (already existed), ${errors} errors`,
  );
}

main();
