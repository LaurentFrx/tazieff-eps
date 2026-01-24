import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DifficultyPill from "@/components/DifficultyPill";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { getExercise } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";

type ExercicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ExercicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getExercise(slug);

  if (!result) {
    return { title: "Exercice introuvable" };
  }

  return { title: result.frontmatter.title };
}

export default async function ExercicePage({ params }: ExercicePageProps) {
  const { slug } = await params;
  const result = await getExercise(slug);

  if (!result) {
    notFound();
  }

  const { frontmatter, content } = result;
  const mdxContent = await renderMdx(content);
  const difficulty = frontmatter.level ?? "intermediaire";

  return (
    <section className="page overflow-x-hidden">
      <header className="page-header">
        <p className="eyebrow">Exercices</p>
        <h1>{frontmatter.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyPill level={difficulty} />
          {frontmatter.muscles.map((muscle) => (
            <span key={muscle} className="pill">
              {muscle}
            </span>
          ))}
        </div>
        {frontmatter.media ? (
          <div className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw]">
            <div className="relative h-[100svh] w-full overflow-hidden">
              <Image
                src={frontmatter.media}
                alt={frontmatter.title}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        ) : null}
        <div className="meta-row">
          <FavoriteToggle slug={frontmatter.slug} />
          <span className="meta-text">
            Thèmes compatibles: {frontmatter.themeCompatibility.join(", ")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {frontmatter.tags.map((tag) => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>
        {frontmatter.equipment && frontmatter.equipment.length > 0 ? (
          <div className="text-sm text-[color:var(--muted)]">
            Matériel: {frontmatter.equipment.join(", ")}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">Sans matériel spécifique.</div>
        )}
      </header>
      <div className="flex flex-col gap-4">{mdxContent}</div>
    </section>
  );
}
