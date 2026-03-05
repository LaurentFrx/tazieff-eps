import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLearnPages, getLearnPage } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { getServerLang, getServerT } from "@/lib/i18n/server";

type LearnPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const pages = await getAllLearnPages("fr");
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: LearnPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getLearnPage(slug, lang);
  if (!result) return { title: t("apprendre.notFound") };
  const { titre, description } = result.frontmatter;
  const desc = description || titre;
  return {
    title: titre,
    description: desc,
    openGraph: { title: titre, description: desc },
  };
}

export default async function LearnSlugPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getLearnPage(slug, lang);

  if (!result) notFound();

  const { frontmatter: fm, content } = result;
  const mdxContent = await renderMdx(content);

  const allPages = await getAllLearnPages(lang);
  const currentIndex = allPages.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const next =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  return (
    <section className="page">
      <header className="page-header">
        <Link
          href="/apprendre"
          className="eyebrow hover:text-[color:var(--accent)]"
        >
          ← {t("apprendre.backLabel")}
        </Link>
        <h1>{fm.titre}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">
            {t(`apprendre.niveaux.${fm.niveau_minimum}`)}
          </span>
          {fm.mots_cles.slice(0, 4).map((mot) => (
            <span key={mot} className="pill">
              {mot}
            </span>
          ))}
        </div>
        <p className="lede">{fm.description}</p>
      </header>

      <div className="flex flex-col gap-4">{mdxContent}</div>

      {(prev || next) && (
        <nav className="mt-8 flex items-center justify-between gap-4 border-t border-[color:var(--border)] pt-6">
          {prev ? (
            <Link
              href={`/apprendre/${prev.slug}`}
              className="text-sm font-medium text-[color:var(--accent)] hover:underline"
            >
              {t("apprendre.prev")}
              <span className="block text-xs font-normal text-[color:var(--muted)]">
                {prev.titre}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/apprendre/${next.slug}`}
              className="text-right text-sm font-medium text-[color:var(--accent)] hover:underline"
            >
              {t("apprendre.next")}
              <span className="block text-xs font-normal text-[color:var(--muted)]">
                {next.titre}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}
