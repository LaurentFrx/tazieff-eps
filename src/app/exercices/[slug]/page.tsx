import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DifficultyPill from "@/components/DifficultyPill";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { HeroMedia } from "@/components/media/HeroMedia";
import { getExercise } from "@/lib/content/fs";
import { getCurrentLang } from "@/lib/i18n/server";
import { renderMdx } from "@/lib/mdx/render";

type ExercicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getCurrentLang();
  const result = await getExercise(slug, lang);

  if (!result) {
    return { title: lang === "en" ? "Exercise not found" : "Exercice introuvable" };
  }

  return { title: result.frontmatter.title };
}

export default async function ExercicePage({ params }: ExercicePageProps) {
  const { slug } = await params;
  const lang = await getCurrentLang();
  const result = await getExercise(slug, lang);

  if (!result) {
    notFound();
  }

  const { frontmatter, content } = result;
  const mdxContent = await renderMdx(content);
  const difficulty = frontmatter.level ?? "intermediaire";
  const heroImage = frontmatter.media?.hero;
  const muscles = Array.from(
    new Set([
      ...frontmatter.musclesPrimary,
      ...(frontmatter.musclesSecondary ?? []),
    ]),
  );
  const copy =
    lang === "en"
      ? {
          eyebrow: "Exercises",
          themes: "Compatible themes",
          equipmentLabel: "Equipment",
          equipmentNone: "No specific equipment.",
        }
      : {
          eyebrow: "Exercices",
          themes: "Thèmes compatibles",
          equipmentLabel: "Matériel",
          equipmentNone: "Sans matériel spécifique.",
        };

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{frontmatter.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyPill level={difficulty} />
          {muscles.map((muscle, index) => (
            <span key={`${muscle}-${index}`} className="pill">
              {muscle}
            </span>
          ))}
        </div>
        {heroImage ? (
          <HeroMedia
            src={heroImage}
            alt={frontmatter.title}
            width={1200}
            height={675}
            priority
          />
        ) : null}
        <div className="meta-row">
          <FavoriteToggle slug={frontmatter.slug} />
          <span className="meta-text">
            {copy.themes}: {frontmatter.themes.map((theme) => theme.toUpperCase()).join(", ")}
          </span>
        </div>
        {frontmatter.equipment && frontmatter.equipment.length > 0 ? (
          <div className="text-sm text-[color:var(--muted)]">
            {copy.equipmentLabel}: {frontmatter.equipment.join(", ")}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">{copy.equipmentNone}</div>
        )}
      </header>
      <div className="flex flex-col gap-4">{mdxContent}</div>
    </section>
  );
}
