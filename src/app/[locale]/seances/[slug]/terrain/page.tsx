import { notFound } from "next/navigation";
import { exercisesIndex, getSeance } from "@/lib/content/fs";
import { TerrainClient } from "@/app/[locale]/seances/[slug]/terrain/TerrainClient";
import type { Lang } from "@/lib/i18n/messages";
import { getServerLang } from "@/lib/i18n/server";

type TerrainPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function TerrainPage({ params }: TerrainPageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = await getServerLang(localeParam as Lang);
  const seance = await getSeance(slug, locale);

  if (!seance) {
    notFound();
  }

  const exercises = await exercisesIndex(locale);
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.slug, exercise]));
  const blocks = seance.frontmatter.blocks.map((block) => {
    const exercise = exerciseMap.get(block.exoSlug);
    return {
      exoSlug: block.exoSlug,
      title: exercise?.title ?? block.exoSlug,
      muscles: exercise?.muscles ?? [],
      tags: exercise?.tags ?? [],
      sets: block.sets,
      reps: block.reps,
      restSec: block.restSec,
    };
  });

  return (
    <TerrainClient
      seanceSlug={seance.frontmatter.slug}
      seanceTitle={seance.frontmatter.title}
      blocks={blocks}
    />
  );
}
