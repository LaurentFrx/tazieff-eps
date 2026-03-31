import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Clock, Dumbbell, BookOpen } from "lucide-react";
import { getServerLang, getServerT } from "@/lib/i18n/server";

const lp = (path: string, locale: string) => locale === "fr" ? path : `/${locale}${path}`;
import { SectionHero } from "@/components/SectionHero";
import { IlluDashboard } from "@/components/illustrations";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("meta.outilsTitle"), description: t("meta.outilsDesc") };
}

export default async function OutilsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);

  const tools = [
    {
      href: "/outils/ma-seance",
      title: t("outils.maSeance"),
      description: t("outils.maSeanceDesc"),
      Icon: Dumbbell,
      accent: "#fb923c",
    },
    {
      href: "/outils/calculateur-rm",
      title: t("outils.calculateur"),
      description: t("outils.calculateurDesc"),
      Icon: Calculator,
      accent: "#60a5fa",
    },
    {
      href: "/outils/timer",
      title: t("outils.timer"),
      description: t("outils.timerDesc"),
      Icon: Clock,
      accent: "#34d399",
    },
    {
      href: "/outils/carnet",
      title: t("outils.carnet"),
      description: t("outils.carnetDesc"),
      Icon: BookOpen,
      accent: "#c084fc",
    },
  ];

  return (
    <section className="page">
      <SectionHero
        title={t("outils.title")}
        subtitle={t("pages.home.heroOutilsSub")}
        gradient="from-pink-500 to-rose-500"
        illustration={<IlluDashboard />}
      />

      <div className="card-grid">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={lp(tool.href, locale)}
            className="tool-card"
            style={{ "--tool-accent": tool.accent } as React.CSSProperties}
          >
            <div className="tool-card-icon">
              <tool.Icon size={28} />
            </div>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
