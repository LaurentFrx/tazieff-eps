import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLearnPages, getLearnPage } from "@/lib/content/fs";
import { renderMdx } from "@/lib/mdx/render";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DetailHeader } from "@/components/DetailHeader";

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
  const lang = getServerLang();
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
  const lang = getServerLang();
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
      <Breadcrumbs
        items={[
          { label: t("nav.home.label"), href: "/" },
          { label: t("breadcrumbs.apprendre"), href: "/apprendre" },
          { label: fm.titre },
        ]}
      />
      <DetailHeader
        title={fm.titre}
        gradient="from-emerald-600 to-teal-500"
        backHref="/apprendre"
        backLabel={t("apprendre.backLabel")}
        badges={
          <>
            {fm.mots_cles.slice(0, 4).map((mot) => (
              <span key={mot} className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
                {mot}
              </span>
            ))}
          </>
        }
      >
        {fm.description ? (
          <p className="text-sm text-white/80 mt-1 max-w-[560px]">{fm.description}</p>
        ) : null}
      </DetailHeader>

      {(prev || next) && (
        <nav className="flex items-stretch gap-3">
          {prev ? (
            <Link
              href={`/apprendre/${prev.slug}`}
              className="flex-1 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors group"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 transition-transform group-hover:-translate-x-0.5">
                <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0">
                <span className="block text-xs text-emerald-600/70 dark:text-emerald-500/70">{t("apprendre.prev")}</span>
                <span className="block truncate">{prev.titre}</span>
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/apprendre/${next.slug}`}
              className="flex-1 flex items-center justify-end gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors text-right group"
            >
              <span className="min-w-0">
                <span className="block text-xs text-emerald-600/70 dark:text-emerald-500/70">{t("apprendre.next")}</span>
                <span className="block truncate">{next.titre}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 transition-transform group-hover:translate-x-0.5">
                <path d="M7.5 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      )}

      <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 shadow-sm p-5 md:p-6 flex flex-col gap-5">
        {mdxContent}
      </div>

      {(prev || next) && (
        <nav className="flex items-stretch gap-3">
          {prev ? (
            <Link
              href={`/apprendre/${prev.slug}`}
              className="flex-1 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors group"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 transition-transform group-hover:-translate-x-0.5">
                <path d="M12.5 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0">
                <span className="block text-xs text-emerald-600/70 dark:text-emerald-500/70">{t("apprendre.prev")}</span>
                <span className="block truncate">{prev.titre}</span>
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/apprendre/${next.slug}`}
              className="flex-1 flex items-center justify-end gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors text-right group"
            >
              <span className="min-w-0">
                <span className="block text-xs text-emerald-600/70 dark:text-emerald-500/70">{t("apprendre.next")}</span>
                <span className="block truncate">{next.titre}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 transition-transform group-hover:translate-x-0.5">
                <path d="M7.5 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      )}
    </section>
  );
}
