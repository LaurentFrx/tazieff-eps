import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { NIVEAUX, type Niveau } from "../data";
import { NiveauChecklist } from "./NiveauChecklist";
import { DetailHeader } from "@/components/DetailHeader";
import type { Lang } from "@/lib/i18n/messages";
import { ALL_LOCALES } from "@/lib/i18n/locale-params";

const VALID_NIVEAUX: Niveau[] = ["seconde", "premiere", "terminale"];

type Props = { params: Promise<{ locale: string; niveau: string }> };

export async function generateStaticParams() {
  return ALL_LOCALES.flatMap((locale) =>
    VALID_NIVEAUX.map((niveau) => ({ locale, niveau })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, niveau } = await params;
  if (!VALID_NIVEAUX.includes(niveau as Niveau)) return {};
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return {
    title: `${t("parcours.title")} — ${t(`parcours.niveaux.${niveau as Niveau}`)}`,
  };
}

export default async function NiveauPage({ params }: Props) {
  const { locale, niveau } = await params;
  if (!VALID_NIVEAUX.includes(niveau as Niveau)) notFound();

  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  const data = NIVEAUX.find((n) => n.key === niveau)!;

  return (
    <section className="page">
      <DetailHeader
        title={t(`parcours.niveaux.${niveau as Niveau}`)}
        gradient="from-violet-600 to-purple-500"
        backHref="/parcours-bac"
        backLabel={t("parcours.title")}
        badges={
          <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
            {t(data.subtitleKey)}
          </span>
        }
      >
        <p className="text-sm text-white/80 mt-1">{t(data.summaryKey)}</p>
      </DetailHeader>

      <NiveauChecklist niveau={niveau as Niveau} />
    </section>
  );
}
