import type { MetadataRoute } from 'next';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = 'https://muscu-eps.fr';
const LOCALES = ['fr', 'en', 'es'] as const;

function localizedUrl(path: string, locale: string): string {
  const prefix = locale === 'fr' ? '' : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

function getSlugs(dir: string): { slug: string; lastModified: Date }[] {
  try {
    const files = readdirSync(dir);
    const frFiles = files.filter((f) => f.endsWith('.fr.mdx'));
    return frFiles.map((f) => {
      const slug = f.replace('.fr.mdx', '');
      const mtime = statSync(join(dir, f)).mtime;
      return { slug, lastModified: mtime };
    });
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const contentDir = join(process.cwd(), 'content');

  // --- Static pages ---
  const staticPages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'monthly' },
    { path: '/exercices', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/methodes', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/apprendre', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/apprendre/anatomie', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/parcours-bac', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/parcours-bac/epreuve-bac', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/outils', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/outils/calculateur-rm', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/programmes', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/seances', priority: 0.8, changeFrequency: 'weekly' },
  ];

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(page.path, locale),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  // --- Exercise pages ---
  const exerciseSlugs = getSlugs(join(contentDir, 'exercices'));
  for (const { slug, lastModified } of exerciseSlugs) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(`/exercices/${slug}`, locale),
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // --- Method pages ---
  const methodSlugs = getSlugs(join(contentDir, 'methodes'));
  for (const { slug, lastModified } of methodSlugs) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(`/methodes/${slug}`, locale),
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // --- Learn pages ---
  const learnSlugs = getSlugs(join(contentDir, 'learn'));
  for (const { slug, lastModified } of learnSlugs) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(`/apprendre/${slug}`, locale),
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  return entries;
}
