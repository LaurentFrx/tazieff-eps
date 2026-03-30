import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { GrilleBac } from "./GrilleBac";
import { DetailHeader } from "@/components/DetailHeader";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("parcours.grille.title") };
}

export default async function EpreuveBacPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);

  return (
    <section className="page">
      <DetailHeader
        title={t("parcours.grille.title")}
        gradient="from-violet-600 to-purple-500"
        backHref="/parcours-bac"
        backLabel={t("parcours.title")}
        badges={
          <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
            {t("parcours.grille.eyebrow")}
          </span>
        }
      >
        <p className="text-sm text-white/80 mt-1">{t("parcours.grille.lede")}</p>
      </DetailHeader>

      <GrilleBac />
    </section>
  );
}
