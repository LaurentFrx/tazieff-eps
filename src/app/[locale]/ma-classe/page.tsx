// Sprint E1 — Page /ma-classe (vue élève d'inscription à une classe).
//
// Référence : GOUVERNANCE_EDITORIALE.md §2.4 (rôle student).

import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { MaClasseClient } from "./MaClasseClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("maClasse.title") };
}

export default async function MaClassePage() {
  return <MaClasseClient />;
}
