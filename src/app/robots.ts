import type { MetadataRoute } from 'next';
import { resolveEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  // Sprint A1 — host/sitemap dérivés de resolveEnv() pour suivre l'env courant.
  const base = resolveEnv().baseUrl.eleve;
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth', '/callback', '/reglages', '/onboarding', '/_next/'],
      },
    ],
    host: base,
    sitemap: `${base}/sitemap.xml`,
  };
}
