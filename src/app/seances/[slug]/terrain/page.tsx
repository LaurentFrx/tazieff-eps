import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { exercisesIndex, getSeance } from "@/lib/content/fs";
import { TerrainClient } from "@/app/seances/[slug]/terrain/TerrainClient";
import type { Lang } from "@/lib/i18n/messages";

type TerrainPageProps = {
  params: Promise<{ slug: string }>;
};

const LANG_COOKIE = "eps_lang";

function getInitialLang(value?: string): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

export default async function TerrainPage({ params }: TerrainPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
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
