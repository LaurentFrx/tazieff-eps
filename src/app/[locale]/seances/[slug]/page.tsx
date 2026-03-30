import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DifficultyPill from "@/components/DifficultyPill";
import { exercisesIndex, getSeance } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { SeanceDownloadButton } from "@/app/[locale]/seances/[slug]/SeanceDownloadButton";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { DetailHeader } from "@/components/DetailHeader";

type SeancePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: SeancePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  const result = await getSeance(slug, lang);

  if (!result) {
    return { title: t("seanceDetail.notFound") };
  }

  const title = result.frontmatter.title;
  return {
    title,
    openGraph: { title },
  };
}

export default async function SeancePage({ params }: SeancePageProps) {
  const { locale, slug } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  const result = await getSeance(slug, lang);

  if (!result) {
    notFound();
  }

  const { frontmatter, content } = result;
  const mdxContent = await renderMdx(content);
  const exercises = await exercisesIndex(lang);
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.slug, exercise]));
  const exerciseSlugs = frontmatter.blocks.map((block) => block.exoSlug);

  return (
    <section className="page">
      <DetailHeader
        title={frontmatter.title}
        gradient="from-orange-500 to-amber-400"
        backHref="/seances"
        backLabel={t("seanceDetail.backLabel")}
        badges={
          <>
            <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
              {frontmatter.durationMin} min
            </span>
            {frontmatter.level ? <DifficultyPill level={frontmatter.level} /> : null}
            {frontmatter.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
                {tag}
              </span>
            ))}
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Link href={`/seances/${frontmatter.slug}/terrain`} className="primary-button">
          {t("seanceDetail.terrainMode")}
        </Link>
        <SeanceDownloadButton exerciseSlugs={exerciseSlugs} />
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5">
        <h2 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-100">{t("seanceDetail.rundown")}</h2>
        <div className="stack-md">
          {frontmatter.blocks.map((block, index) => {
            const exercise = exerciseMap.get(block.exoSlug);
            const repsLabel =
              typeof block.reps === "number" ? `${block.reps} reps` : block.reps;
            const muscleLabel = exercise?.muscles?.slice(0, 3).join(" • ");
            return (
              <div key={`${block.exoSlug}-${index}`} className="block-row">
                <div>
                  <Link href={`/exercices/${block.exoSlug}`} className="block-title">
                    {exercise?.title ?? block.exoSlug}
                  </Link>
                  <p className="block-meta">
                    {muscleLabel ?? t("seanceDetail.unnamedExercise")}
                  </p>
                </div>
                <div className="block-stats">
                  {block.sets ? <span>{block.sets} {t("seanceDetail.sets")}</span> : null}
                  {repsLabel ? <span>{repsLabel}</span> : null}
                  {block.restSec ? <span>{block.restSec}s {t("seanceDetail.rest")}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {content ? (
        <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5 md:p-6 flex flex-col gap-5">
          {mdxContent}
        </div>
      ) : null}
    </section>
  );
}
