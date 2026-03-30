import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ProgrammesList } from "./ProgrammesList";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("programmes.title") };
}

export default async function ProgrammesPage() {
  return <ProgrammesList />;
}
