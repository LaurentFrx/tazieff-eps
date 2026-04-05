import type { Metadata } from "next";
import { getAllLearnPages } from "@/lib/content/fs";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SectionHero } from "@/components/SectionHero";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IlluBook } from "@/components/illustrations";
import { LocaleLink as Link } from "@/components/LocaleLink";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));
  return { title: t("meta.apprendreTitle"), description: t("meta.apprendreDesc") };
}

export default async function ApprendrePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  const learnPages = await getAllLearnPages(lang);

  const bySlug = new Map(learnPages.map((p) => [p.slug, p]));

  const ORDERED_SLUGS = [
    "muscles",
    "rm-rir-rpe",
    "securite",
    "contractions",
    "glossaire",
    "programmes-hebdomadaires",
    "nutrition",
    "sante-prevention",
  ];

  type CardItem = { href: string; title: string; description: string };
  const allCards: CardItem[] = [
    { href: "/apprendre/parametres", title: t("pages.apprendre.cards.parametres.title"), description: t("pages.apprendre.cards.parametres.description") },
    ...ORDERED_SLUGS.slice(0, 4).map((slug) => {
      const p = bySlug.get(slug);
      return { href: `/apprendre/${slug}`, title: p?.titre ?? slug, description: p?.description ?? "" };
    }),
    { href: "/apprendre/techniques", title: t("pages.apprendre.cards.techniques.title"), description: t("pages.apprendre.cards.techniques.description") },
    { href: "/apprendre/connaissances", title: t("pages.apprendre.cards.connaissances.title"), description: t("pages.apprendre.cards.connaissances.description") },
    ...ORDERED_SLUGS.slice(4).map((slug) => {
      const p = bySlug.get(slug);
      return { href: `/apprendre/${slug}`, title: p?.titre ?? slug, description: p?.description ?? "" };
    }),
    { href: "/apprendre/anatomie", title: t("pages.apprendre.cards.anatomie.title"), description: t("pages.apprendre.cards.anatomie.description") },
  ];

  return (
    <section className="page">
      <Breadcrumbs items={[{ label: t("nav.home.label"), href: "/" }, { label: t("pages.home.apprendreLabel") }]} />
      <SectionHero
        title={t("pages.home.apprendreLabel")}
        count={allCards.length}
        subtitle={t("pages.home.heroApprendreSub")}
        gradient="from-green-500 to-emerald-400"
        illustration={<IlluBook />}
      />
      <div className="card-grid">
        {allCards.map((card) => (
          <Link key={card.href} href={card.href} className="card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
