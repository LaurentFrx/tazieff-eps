import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DifficultyBadge from "@/components/DifficultyBadge";
import { getMdxBySlug } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";

type ExoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ExoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getMdxBySlug("exos", slug);

  if (!result) {
    return { title: "Exercice introuvable" };
  }

  return { title: result.frontmatter.title };
}

export default async function ExoPage({ params }: ExoPageProps) {
  const { slug } = await params;
  const result = await getMdxBySlug("exos", slug);

  if (!result) {
    notFound();
  }

  const { frontmatter, content } = result;
  const mdxContent = await renderMdx(content);
  const difficulty = frontmatter.difficulty ?? "intermediaire";

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Exos</p>
        <h1>{frontmatter.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={difficulty} />
          {frontmatter.muscles?.map((muscle) => (
            <span key={muscle} className="pill">
              {muscle}
            </span>
          ))}
        </div>
        {frontmatter.equipment && frontmatter.equipment.length > 0 ? (
          <div className="text-sm text-[color:var(--muted)]">
            Matériel: {frontmatter.equipment.join(", ")}
          </div>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{mdxContent}</div>
    </section>
  );
}
