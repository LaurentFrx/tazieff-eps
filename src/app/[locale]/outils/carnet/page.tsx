import type { Metadata } from "next";
import { getAllMethodes } from "@/lib/content/fs";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { Carnet } from "./Carnet";
import { BackButton } from "@/components/BackButton";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("carnet.title") };
}

export default async function CarnetPage({ params }: Props) {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  const [allMethodes, allExercices] = await Promise.all([
    getAllMethodes(lang),
    getExercisesIndex(lang),
  ]);

  const methodeNames = allMethodes.map((m) => ({ slug: m.slug, titre: m.titre }));
  const exerciceNames = allExercices.map((e) => ({
    slug: e.slug,
    title: e.title,
    themeCompatibility: e.themeCompatibility,
    session: e.slug.split("-")[0].toUpperCase(),
  }));

  return (
    <section className="page">
      <BackButton href="/outils" label={t("outils.backLabel")} />
      <header className="page-header">
        <p className="eyebrow">{t("outils.title")}</p>
        <h1>{t("carnet.title")}</h1>
        <p className="lede">{t("carnet.lede")}</p>
      </header>
      <Carnet methodeNames={methodeNames} exerciceNames={exerciceNames} />
    </section>
  );
}
