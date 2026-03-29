import type { Metadata } from "next";
import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ParcoursDashboard } from "./ParcoursDashboard";
import { SectionHero } from "@/components/SectionHero";
import { IlluTrophy } from "@/components/illustrations";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("parcours.title") };
}

export default async function ParcoursBacPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
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

      <Link href="/bac" className="eyebrow hover:text-[color:var(--accent)]">
        {t("parcours.backLabel")}
      </Link>
    </section>
  );
}
