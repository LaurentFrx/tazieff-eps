---
name: i18n-routing
description: >
  Architecture d'internationalisation URL-based de Tazieff EPS.
  Utiliser cette skill dès qu'on mentionne i18n, traduction, locale,
  LocaleLink, route multilingue, préfixe /en/ ou /es/, strings
  hardcodées en français, ou toute modification touchant au routing
  par langue. Aussi quand on crée un nouveau composant contenant du
  texte visible par l'utilisateur, ou quand on ajoute une page qui
  doit exister en 3 langues.
---

# i18n URL-based routing — Tazieff EPS

## Architecture

Routing par URL, pas par cookie ni header Accept-Language :
- Français (défaut) : `/exercices/s1-01` (pas de préfixe)
- Anglais : `/en/exercices/s1-01`
- Espagnol : `/es/exercices/s1-01`

Le français est la langue par défaut et n'a PAS de préfixe `/fr/`.

## Structure fichiers Next.js

```
src/app/
├── (routes FR sans préfixe)
│   ├── exercices/
│   ├── methodes/
│   └── ...
├── [locale]/          ← layout dynamique pour EN/ES
│   ├── layout.tsx
│   ├── exercices/
│   ├── methodes/
│   └── ...
```

Le `[locale]` segment capture `en` ou `es` et le propage via le layout.

## LocaleLink — Composant obligatoire

TOUJOURS utiliser `LocaleLink` au lieu de `next/link` pour les liens
internes. Ce wrapper auto-prepend le préfixe locale.

```tsx
// CORRECT
import { LocaleLink } from '@/components/LocaleLink';
<LocaleLink href="/exercices/s1-01">Voir l'exercice</LocaleLink>

// INTERDIT — casse la navigation i18n
import Link from 'next/link';
<Link href="/exercices/s1-01">Voir l'exercice</Link>
```

`LocaleLink` a été déployé dans 15+ fichiers. Tout nouveau composant
avec des liens internes DOIT l'utiliser.

## SSG et locales

La migration SSG a été un gain majeur : ~479 pages statiques
(vs 164 SSR auparavant). Le routing URL-based a permis ce passage.

Pour les pages statiques, `generateStaticParams()` doit inclure
les 3 locales.

## Strings à traduire

Tout texte visible par l'utilisateur doit être traduit SAUF :
- `HomeFlyer.tsx` : intentionnellement FR-only (taglines marketing)
- `TYPE_DEFAULTS` : reporté à la phase mode enseignant

### Pattern de traduction

```tsx
// Dictionnaire dans le composant ou importé
const labels = {
  fr: { filter: "Filtrer", search: "Rechercher" },
  en: { filter: "Filter", search: "Search" },
  es: { filter: "Filtrar", search: "Buscar" },
};

// Usage
const t = labels[locale] ?? labels.fr;
return <button>{t.filter}</button>;
```

~100+ strings hardcodées FR ont été extraites sur 10 fichiers.
Si tu rencontres du texte français non traduit dans un composant,
le signaler.

## Conventions terminologie ES fitness

Les termes fitness en espagnol suivent le dictionnaire strict.
Voir la skill `mdx-trilingue` et son fichier
`references/dictionnaire-fitness-es.md` pour la liste complète.

## Checklist nouveau composant avec texte

1. Identifier toutes les strings visibles
2. Créer un objet `labels` avec les 3 langues
3. Récupérer la locale depuis le contexte/params
4. Utiliser `LocaleLink` pour tous les liens internes
5. Tester le rendu dans les 3 locales après build
