import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { NIVEAUX, type Niveau } from "../data";
import { NiveauChecklist } from "./NiveauChecklist";
import { BackButton } from "@/components/BackButton";

const VALID_NIVEAUX: Niveau[] = ["seconde", "premiere", "terminale"];

type Props = { params: Promise<{ niveau: string }> };

export async function generateStaticParams() {
  return VALID_NIVEAUX.map((niveau) => ({ niveau }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niveau } = await params;
  if (!VALID_NIVEAUX.includes(niveau as Niveau)) return {};
  const lang = await getServerLang();
  const t = getServerT(lang);
  return {
    title: `${t("parcours.title")} — ${t(`parcours.niveaux.${niveau as Niveau}`)}`,
  };
}

export default async function NiveauPage({ params }: Props) {
  const { niveau } = await params;
  if (!VALID_NIVEAUX.includes(niveau as Niveau)) notFound();

  const lang = await getServerLang();
  const t = getServerT(lang);
  const data = NIVEAUX.find((n) => n.key === niveau)!;

  return (
    <section className="page">
      <BackButton href="/parcours-bac" label={t("parcours.title")} />
      <header className="page-header">
        <p className="eyebrow">{t(data.subtitleKey)}</p>
        <h1>{t(`parcours.niveaux.${niveau as Niveau}`)}</h1>
        <p className="lede">{t(data.summaryKey)}</p>
      </header>

      <NiveauChecklist niveau={niveau as Niveau} />

      <Link href="/parcours-bac" className="eyebrow hover:text-[color:var(--accent)]">
        {t("parcours.backLabel")}
      </Link>
    </section>
  );
}
