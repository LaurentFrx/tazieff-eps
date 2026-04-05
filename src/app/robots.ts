import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth', '/callback', '/reglages', '/onboarding', '/_next/'],
      },
    ],
    host: 'https://muscu-eps.fr',
    sitemap: 'https://muscu-eps.fr/sitemap.xml',
  };
}
