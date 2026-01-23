import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMdxBySlug } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";

type SeancePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: SeancePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getMdxBySlug("seances", slug);

  if (!result) {
    return { title: "Séance introuvable" };
  }

  return { title: result.frontmatter.title };
}

export default async function SeancePage({ params }: SeancePageProps) {
  const { slug } = await params;
  const result = await getMdxBySlug("seances", slug);

  if (!result) {
    notFound();
  }

  const { frontmatter, content } = result;
  const mdxContent = await renderMdx(content);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Séances</p>
        <h1>{frontmatter.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-[color:var(--muted)]">
          {frontmatter.durationMin ? (
            <span>{frontmatter.durationMin} min</span>
          ) : null}
          {frontmatter.level ? <span>{frontmatter.level}</span> : null}
        </div>
        {frontmatter.tags && frontmatter.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {frontmatter.tags.map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{mdxContent}</div>
      {frontmatter.exercises && frontmatter.exercises.length > 0 ? (
        <div className="card">
          <h2>Exercices liés</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {frontmatter.exercises.map((exercise) => (
              <Link key={exercise} href={`/exos/${exercise}`} className="pill">
                {exercise}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
