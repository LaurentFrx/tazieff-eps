import { JsonLd } from './JsonLd';
import { resolveEnv } from '@/lib/env';

export function HomeJsonLd() {
  // Sprint A1 — URL dérivée de resolveEnv() pour suivre l'env courant.
  const baseUrl = resolveEnv().baseUrl.eleve;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Tazieff EPS',
        description:
          'Application pédagogique de musculation pour l\'EPS au lycée',
        url: baseUrl,
        educationalLevel: 'Lycée (Seconde, Première, Terminale)',
        knowsAbout: [
          'Musculation',
          'EPS',
          'Éducation physique',
          'BAC EPS',
          'CA5',
        ],
      }}
    />
  );
}
