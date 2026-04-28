import { JsonLd } from './JsonLd';
import type { ExerciseFrontmatter } from '@/lib/content/schema';
import { resolveEnv } from '@/lib/env';

const LEVEL_MAP: Record<string, string> = {
  debutant: 'Beginner',
  intermediaire: 'Intermediate',
  avance: 'Advanced',
};

interface ExerciseJsonLdProps {
  frontmatter: ExerciseFrontmatter;
  content: string;
  locale: string;
}

export function ExerciseJsonLd({ frontmatter, content, locale }: ExerciseJsonLdProps) {
  const { title, slug, muscles, equipment, level } = frontmatter;
  const baseUrl = resolveEnv().baseUrl.eleve;

  // Extract steps from markdown content: lines starting with "- " under an execution/steps heading
  const steps = extractSteps(content);

  const description = muscles?.length
    ? `${title} — ${muscles.join(', ')}`
    : title;

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    category: 'Musculation / EPS',
    inLanguage: locale,
    image: `${baseUrl}/images/exos/${slug}.webp`,
  };

  if (level && LEVEL_MAP[level]) {
    data.educationalLevel = LEVEL_MAP[level];
  }

  if (steps.length > 0) {
    data.step = steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    }));
  }

  if (equipment?.length) {
    data.supply = equipment.map((name) => ({
      '@type': 'HowToSupply',
      name,
    }));
  }

  return <JsonLd data={data} />;
}

function extractSteps(content: string): string[] {
  const lines = content.split('\n');
  let inExecutionSection = false;
  const steps: string[] = [];

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      inExecutionSection = /ex[eé]cution|steps|étapes/i.test(line);
      continue;
    }
    if (inExecutionSection && /^-\s+/.test(line)) {
      steps.push(line.replace(/^-\s+/, '').trim());
    }
  }

  // Fallback: split description into sentences if no execution section found
  if (steps.length === 0) {
    const firstParagraph = content
      .split('\n\n')
      .find((p) => p.trim() && !p.startsWith('#'));
    if (firstParagraph) {
      return firstParagraph
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
    }
  }

  return steps;
}
