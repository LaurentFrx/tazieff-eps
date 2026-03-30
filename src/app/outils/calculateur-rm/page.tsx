import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { CalculateurRM } from "./CalculateurRM";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("apprendre.calculateur.title") };
}

export default function CalculateurRMPage() {
  return <CalculateurRM />;
}
