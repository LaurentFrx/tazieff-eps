import type { Metadata } from "next";
import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { GrilleBac } from "./GrilleBac";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("parcours.grille.title") };
}

export default async function EpreuveBacPage() {
  const lang = await getServerLang();
  const t = getServerT(lang);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("parcours.grille.eyebrow")}</p>
        <h1>{t("parcours.grille.title")}</h1>
        <p className="lede">{t("parcours.grille.lede")}</p>
      </header>

      <GrilleBac />

      <Link href="/parcours-bac" className="eyebrow hover:text-[color:var(--accent)]">
        {t("parcours.backLabel")}
      </Link>
    </section>
  );
}
