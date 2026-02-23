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
  const result = await getLearnPage(slug, "fr");
  if (!result) return { title: "Contenu introuvable" };
  return { title: result.frontmatter.titre };
}

export default async function LearnSlugPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getLearnPage(slug, lang);

  if (!result) notFound();

  const { frontmatter: fm, content } = result;
  const mdxContent = await renderMdx(content);

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
    </section>
  );
}
