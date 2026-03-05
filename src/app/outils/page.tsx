import type { Metadata } from "next";
import Link from "next/link";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("outils.title") };
}

export default async function OutilsPage() {
  const lang = await getServerLang();
  const t = getServerT(lang);

  const tools = [
    {
      href: "/outils/ma-seance",
      title: t("outils.maSeance"),
      description: t("outils.maSeanceDesc"),
    },
    {
      href: "/outils/calculateur-rm",
      title: t("outils.calculateur"),
      description: t("outils.calculateurDesc"),
    },
    {
      href: "/outils/timer",
      title: t("outils.timer"),
      description: t("outils.timerDesc"),
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t("outils.title")}</h1>
      </header>

      <div className="card-grid">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card">
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
