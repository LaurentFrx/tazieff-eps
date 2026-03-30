import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Clock, Dumbbell, BookOpen } from "lucide-react";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SectionHero } from "@/components/SectionHero";
import { IlluDashboard } from "@/components/illustrations";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("outils.title") };
}

export default async function OutilsPage({ params }: Props) {
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
            href={tool.href}
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
