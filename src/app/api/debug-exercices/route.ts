import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'content/exercices');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.fr.mdx'));
    const slugs = files.map(f => f.replace('.fr.mdx', '')).sort();
    return NextResponse.json({
      total: slugs.length,
      s6: slugs.filter(s => s.startsWith('s6-')),
      all: slugs,
      cwd: process.cwd(),
      dirExists: fs.existsSync(dir),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, cwd: process.cwd() });
  }
}
