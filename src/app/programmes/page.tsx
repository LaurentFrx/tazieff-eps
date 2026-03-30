import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { ProgrammesList } from "./ProgrammesList";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("programmes.title") };
}

export default async function ProgrammesPage() {
  return <ProgrammesList />;
}
