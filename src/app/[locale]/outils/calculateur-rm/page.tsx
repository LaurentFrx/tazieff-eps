import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CalculateurRM } from "./CalculateurRM";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("apprendre.calculateur.title") };
}

export default function CalculateurRMPage() {
  return <CalculateurRM />;
}
