import { JsonLd } from './JsonLd';

const BASE_URL = 'https://muscu-eps.fr';

export function HomeJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Tazieff EPS',
        description:
          'Application pédagogique de musculation pour l\'EPS au lycée',
        url: BASE_URL,
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
