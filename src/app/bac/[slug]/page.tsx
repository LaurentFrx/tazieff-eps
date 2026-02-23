import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBacPages, getBacPage } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { getServerLang, getServerT } from "@/lib/i18n/server";

type BacSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const pages = await getAllBacPages("fr");
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: BacSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getBacPage(slug, lang);
  if (!result) return { title: t("bac.notFound") };
  return { title: result.frontmatter.titre };
}

export default async function BacSlugPage({ params }: BacSlugPageProps) {
  const { slug } = await params;
  const lang = await getServerLang();
  const t = getServerT(lang);
  const result = await getBacPage(slug, lang);

  if (!result) notFound();

  const { frontmatter: fm, content } = result;
  const mdxContent = await renderMdx(content);

  return (
    <section className="page">
      <header className="page-header">
        <Link
          href="/bac"
          className="eyebrow hover:text-[color:var(--accent)]"
        >
          ← {t("bac.backLabel")}
        </Link>
        <h1>{fm.titre}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">
            {t(`bac.niveaux.${fm.niveau_minimum}`)}
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
