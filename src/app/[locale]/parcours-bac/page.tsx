import type { Metadata } from "next";
import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";

const lp = (path: string, locale: string) => locale === "fr" ? path : `/${locale}${path}`;
import { ParcoursDashboard } from "./ParcoursDashboard";
import { SectionHero } from "@/components/SectionHero";
import { IlluTrophy } from "@/components/illustrations";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("parcours.title") };
}

export default async function ParcoursBacPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);

  return (
    <section className="page">
      <SectionHero
        title={t("parcours.title")}
        subtitle={t("pages.home.heroBacSub")}
        gradient="from-violet-600 to-fuchsia-500"
        illustration={<IlluTrophy />}
      />

      <ParcoursDashboard />

      <Link href={lp("/bac", locale)} className="eyebrow hover:text-[color:var(--accent)]">
        {t("parcours.backLabel")}
      </Link>
    </section>
  );
}
