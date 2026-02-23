import Link from "next/link";
import { getAllLearnPages } from "@/lib/content/fs";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export default async function ApprendrePage() {
  const lang = await getServerLang();
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
  ];

  return (
    <section className="page">
      <div className="card-grid">
        {staticCards.map((card) => (
          <Link key={card.href} href={card.href} className="card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>

      {learnPages.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-semibold text-[color:var(--ink)]">
            {t("apprendre.anatomieHeading")}
          </h2>
          <ul className="flex flex-col gap-2">
            {learnPages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/apprendre/${page.slug}`}
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
                  <span className="pill shrink-0 text-xs">
                    {t(`apprendre.niveaux.${page.niveau_minimum}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
