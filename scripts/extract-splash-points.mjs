#!/usr/bin/env node
/**
 * extract-splash-points.mjs
 *
 * Parse silhouette_fixed.glb (binary glTF), extract all mesh vertex positions,
 * project to 2D (X, Y — front view, ignore Z), normalize to [0,1],
 * downsample to ~700 points, and save as public/data/splash-points.json.
 *
 * Zero external dependencies — reads GLB binary format directly.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GLB_PATH = join(__dirname, "..", "public", "models", "silhouette_fixed.glb");
const OUT_PATH = join(__dirname, "..", "public", "data", "splash-points.json");
const TARGET_POINTS = 700;

// ── GLB parser ──────────────────────────────────────────────────────

function parseGlb(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Header: magic(4) + version(4) + length(4)
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546c67) throw new Error("Not a valid GLB file");

  let offset = 12;
  let jsonChunk = null;
  let binChunk = null;

  while (offset < buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkData = buffer.subarray(offset + 8, offset + 8 + chunkLength);

    if (chunkType === 0x4e4f534a) {
      // JSON chunk
      jsonChunk = JSON.parse(new TextDecoder().decode(chunkData));
    } else if (chunkType === 0x004e4942) {
      // BIN chunk
      binChunk = chunkData;
    }

    offset += 8 + chunkLength;
  }

  if (!jsonChunk || !binChunk) throw new Error("Missing JSON or BIN chunk in GLB");
  return { json: jsonChunk, bin: binChunk };
}

// ── Extract positions from all meshes ───────────────────────────────

function extractPositions(json, bin) {
  const positions = [];

  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const posAccessorIdx = primitive.attributes?.POSITION;
      if (posAccessorIdx === undefined) continue;

      const accessor = json.accessors[posAccessorIdx];
      if (accessor.type !== "VEC3") continue;

      const bufferView = json.bufferViews[accessor.bufferView];
      const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
      const count = accessor.count;

      // Component type 5126 = FLOAT (4 bytes)
      if (accessor.componentType !== 5126) {
        console.warn(`Skipping accessor with componentType ${accessor.componentType}`);
        continue;
      }

      const stride = bufferView.byteStride || 12; // 3 floats * 4 bytes
      const dataView = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);

      for (let i = 0; i < count; i++) {
        const base = byteOffset + i * stride;
        const x = dataView.getFloat32(base, true);
        const y = dataView.getFloat32(base + 4, true);
        // z = dataView.getFloat32(base + 8, true); // ignored for front view
        positions.push([x, y]);
      }
    }
  }

  return positions;
}

// ── Normalize to [0, 1] ─────────────────────────────────────────────

function normalize(points) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return points.map(([x, y]) => [
    (x - minX) / rangeX,
    // Invert Y so 0 = top (head), 1 = bottom (feet)
    1 - (y - minY) / rangeY,
  ]);
}

// ── Downsample via uniform random sampling ──────────────────────────

function downsample(points, target) {
  if (points.length <= target) return points;

  // Fisher-Yates shuffle then take first `target`
  const arr = [...points];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, target);
}

// ── Main ────────────────────────────────────────────────────────────

console.log(`Reading GLB: ${GLB_PATH}`);
const buffer = readFileSync(GLB_PATH);
const { json, bin } = parseGlb(buffer);

console.log(`Meshes found: ${json.meshes?.length || 0}`);
const rawPositions = extractPositions(json, bin);
console.log(`Total vertices extracted: ${rawPositions.length}`);

// Deduplicate (some vertices are shared across triangles)
const seen = new Set();
const unique = [];
for (const [x, y] of rawPositions) {
  const key = `${x.toFixed(5)},${y.toFixed(5)}`;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push([x, y]);
  }
}
console.log(`Unique 2D points: ${unique.length}`);

const normalized = normalize(unique);
const sampled = downsample(normalized, TARGET_POINTS);

// Round to 3 decimals
const output = sampled.map(([x, y]) => [
  Math.round(x * 1000) / 1000,
  Math.round(y * 1000) / 1000,
]);

// Sort by Y then X for visual consistency
output.sort((a, b) => a[1] - b[1] || a[0] - b[0]);

writeFileSync(OUT_PATH, JSON.stringify(output));

const fileSize = readFileSync(OUT_PATH).byteLength;
const xValues = output.map(p => p[0]);
const yValues = output.map(p => p[1]);

console.log(`\nResult:`);
console.log(`  Points: ${output.length}`);
console.log(`  File size: ${(fileSize / 1024).toFixed(1)} KB`);
console.log(`  X range: ${Math.min(...xValues).toFixed(3)} — ${Math.max(...xValues).toFixed(3)}`);
console.log(`  Y range: ${Math.min(...yValues).toFixed(3)} — ${Math.max(...yValues).toFixed(3)}`);
console.log(`  Saved to: ${OUT_PATH}`);
