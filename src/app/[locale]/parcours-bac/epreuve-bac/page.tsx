import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { GrilleBac } from "./GrilleBac";
import { DetailHeader } from "@/components/DetailHeader";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("parcours.grille.title") };
}

export default async function EpreuveBacPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
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
