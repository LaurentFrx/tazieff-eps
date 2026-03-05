import type { Metadata } from "next";
import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ParcoursDashboard } from "./ParcoursDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("parcours.title") };
}

export default async function ParcoursBacPage() {
  const lang = await getServerLang();
  const t = getServerT(lang);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("parcours.eyebrow")}</p>
        <h1>{t("parcours.title")}</h1>
        <p className="lede">{t("parcours.lede")}</p>
      </header>

      <ParcoursDashboard />

      <Link href="/bac" className="eyebrow hover:text-[color:var(--accent)]">
        {t("parcours.backLabel")}
      </Link>
    </section>
  );
}
