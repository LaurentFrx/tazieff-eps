import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ParcoursDashboard } from "./ParcoursDashboard";
import { SectionHero } from "@/components/SectionHero";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IlluTrophy } from "@/components/illustrations";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("meta.parcoursBacTitle"), description: t("meta.parcoursBacDesc") };
}

export default async function ParcoursBacPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);

  return (
    <section className="page">
      <Breadcrumbs items={[{ label: t("nav.home.label"), href: "/" }, { label: t("pages.home.bacLabel") }]} />
      <SectionHero
        title={t("parcours.title")}
        count={4}
        subtitle={t("pages.home.heroBacSub")}
        gradient="from-violet-600 to-fuchsia-500"
        illustration={<IlluTrophy />}
      />

      <ParcoursDashboard />
    </section>
  );
}
