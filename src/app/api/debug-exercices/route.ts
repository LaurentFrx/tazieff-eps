import { NextResponse } from 'next/server';
import { readdir, readFile } from 'node:fs/promises';
import path from 'path';
import matter from 'gray-matter';

// Force no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const dir = path.join(process.cwd(), 'content/exercices');
  const files = (await readdir(dir)).filter(f => f.endsWith('.fr.mdx')).sort();

  // Parse each file manually (bypass React cache + getExercisesIndex)
  const results: string[] = [];
  const errors: { file: string; error: string }[] = [];
  for (const file of files) {
    try {
      const content = await readFile(path.join(dir, file), 'utf8');
      const { data } = matter(content);
      results.push(data.slug);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ file, error: message });
    }
  }

  return NextResponse.json({
    filesOnDisk: files.length,
    parsedOK: results.length,
    errors,
    slugs: results.sort(),
    hasS6: results.filter(s => s.startsWith('s6-')),
    hasDeletedDupes: results.filter(s => ['s1-001','s5-02-burpees','squat-goblet'].includes(s)),
  });
}
