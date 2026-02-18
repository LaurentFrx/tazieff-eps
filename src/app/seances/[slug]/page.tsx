import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import DifficultyPill from "@/components/DifficultyPill";
import { exercisesIndex, getSeance } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { SeanceDownloadButton } from "@/app/seances/[slug]/SeanceDownloadButton";
import type { Lang } from "@/lib/i18n/messages";

type SeancePageProps = {
  params: Promise<{ slug: string }>;
};

const LANG_COOKIE = "eps_lang";

function getInitialLang(value?: string): Lang {
  if (value === "en" || value === "es") return value;
  return "fr";
}

export async function generateMetadata({
  params,
}: SeancePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const result = await getSeance(slug, locale);

  if (!result) {
    return { title: "Séance introuvable" };
  }

  return { title: result.frontmatter.title };
}

export default async function SeancePage({ params }: SeancePageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = getInitialLang(cookieStore.get(LANG_COOKIE)?.value);
  const result = await getSeance(slug, locale);

  if (!result) {
    notFound();
  }

  const { frontmatter, content } = result;
  const mdxContent = await renderMdx(content);
  const exercises = await exercisesIndex(locale);
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.slug, exercise]));
  const exerciseSlugs = frontmatter.blocks.map((block) => block.exoSlug);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Séances</p>
        <h1>{frontmatter.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">{frontmatter.durationMin} min</span>
          {frontmatter.level ? <DifficultyPill level={frontmatter.level} /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {frontmatter.tags.map((tag) => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>
        <Link href={`/seances/${frontmatter.slug}/terrain`} className="primary-button">
          Mode terrain
        </Link>
        <SeanceDownloadButton exerciseSlugs={exerciseSlugs} />
      </header>

      <div className="card">
        <h2>Déroulé</h2>
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
                    {muscleLabel ?? "Exercice à renseigner"}
                  </p>
                </div>
                <div className="block-stats">
                  {block.sets ? <span>{block.sets} séries</span> : null}
                  {repsLabel ? <span>{repsLabel}</span> : null}
                  {block.restSec ? <span>{block.restSec}s repos</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">{mdxContent}</div>
    </section>
  );
}
