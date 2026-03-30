import Link from "next/link";
import { getAllLearnPages } from "@/lib/content/fs";

const lp = (path: string, locale: string) => locale === "fr" ? path : `/${locale}${path}`;
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SectionHero } from "@/components/SectionHero";
import { IlluBook } from "@/components/illustrations";

export default async function ApprendrePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  const learnPages = await getAllLearnPages(lang);

  const staticCards = [
    {
      href: "/apprendre/parametres",
      title: t("pages.apprendre.cards.parametres.title"),
      description: t("pages.apprendre.cards.parametres.description"),
    },
    {
      href: "/apprendre/techniques",
      title: t("pages.apprendre.cards.techniques.title"),
      description: t("pages.apprendre.cards.techniques.description"),
    },
    {
      href: "/apprendre/connaissances",
      title: t("pages.apprendre.cards.connaissances.title"),
      description: t("pages.apprendre.cards.connaissances.description"),
    },
{
      href: "/apprendre/anatomie",
      title: t("pages.apprendre.cards.anatomie.title"),
      description: t("pages.apprendre.cards.anatomie.description"),
    },
  ];

  return (
    <section className="page">
      <SectionHero
        title={t("pages.home.apprendreLabel")}
        count={learnPages.length + staticCards.length}
        subtitle={t("pages.home.heroApprendreSub")}
        gradient="from-green-500 to-emerald-400"
        illustration={<IlluBook />}
      />
      <div className="card-grid">
        {staticCards.map((card) => (
          <Link key={card.href} href={lp(card.href, locale)} className="card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>

      {learnPages.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-semibold text-[color:var(--ink)]">
            {t("apprendre.learnPagesHeading")}
          </h2>
          <ul className="flex flex-col gap-2">
            {learnPages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={lp(`/apprendre/${page.slug}`, locale)}
                  className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-[color:var(--accent)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      {page.titre}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--muted)]">
                      {page.description}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
