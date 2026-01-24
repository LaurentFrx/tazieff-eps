import { notFound } from "next/navigation";
import { exercisesIndex, getSeance } from "@/lib/content/fs";
import { TerrainClient } from "@/app/seances/[slug]/terrain/TerrainClient";

type TerrainPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TerrainPage({ params }: TerrainPageProps) {
  const { slug } = await params;
  const seance = await getSeance(slug);

  if (!seance) {
    notFound();
  }

  const exercises = await exercisesIndex();
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
