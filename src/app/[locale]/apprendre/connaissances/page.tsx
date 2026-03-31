import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ConnaissancesContent } from "@/components/learn/ConnaissancesContent";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));
  return { title: `${t("pages.apprendre.cards.connaissances.title")} \u2014 Apprendre \u2014 Tazieff EPS` };
}

export default async function ConnaissancesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("apprendre.eyebrow")}</p>
        <h1>{t("pages.apprendre.cards.connaissances.title")}</h1>
        <p className="lede">{t("pages.apprendre.cards.connaissances.description")}</p>
      </header>

      <ConnaissancesContent />
    </section>
  );
}
