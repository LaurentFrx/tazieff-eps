import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CalculateurRM } from "./CalculateurRM";
import type { Lang } from "@/lib/i18n/messages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = await getServerLang(locale as Lang);
  const t = getServerT(lang);
  return { title: t("apprendre.calculateur.title") };
}

export default function CalculateurRMPage() {
  return <CalculateurRM />;
}
