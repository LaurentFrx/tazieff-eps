import { NextResponse } from 'next/server';
import { getExercisesIndex } from '@/lib/exercices/getExercisesIndex';
import { fetchLiveExercises } from '@/lib/live/queries';

export async function GET() {
  try {
    const staticFr = await getExercisesIndex('fr');
    const liveFr = await fetchLiveExercises('fr').catch(() => []);
    return NextResponse.json({
      static: staticFr.length,
      live: liveFr.length,
      staticSlugs: staticFr.map(e => e.slug).sort(),
      liveSlugs: liveFr.map((e: Record<string, unknown>) => e.slug).sort(),
      liveDrafts: liveFr
        .filter((e: Record<string, unknown>) => e.status === 'draft')
        .map((e: Record<string, unknown>) => e.slug),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message });
  }
}
