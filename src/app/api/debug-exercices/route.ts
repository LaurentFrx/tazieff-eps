import { NextResponse } from 'next/server';
import fs from 'fs';
import { readdir } from 'node:fs/promises';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'content/exercices');

  // Method 1: sync
  const syncFiles = fs.readdirSync(dir).filter(f => f.endsWith('.fr.mdx')).sort();

  // Method 2: async (same as getAllExercises uses)
  const asyncFiles = (await readdir(dir)).filter(f => f.endsWith('.fr.mdx')).sort();

  // Diff
  const onlySync = syncFiles.filter(f => !asyncFiles.includes(f));
  const onlyAsync = asyncFiles.filter(f => !syncFiles.includes(f));

  return NextResponse.json({
    syncCount: syncFiles.length,
    asyncCount: asyncFiles.length,
    identical: syncFiles.length === asyncFiles.length && onlySync.length === 0,
    onlyInSync: onlySync,
    onlyInAsync: onlyAsync,
    asyncSlugs: asyncFiles.map(f => f.replace('.fr.mdx', '')),
  });
}
