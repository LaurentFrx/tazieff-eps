export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SharedSession } from "./SharedSession";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const t = getServerT(lang);
  return { title: t("enseignant.sharedTitle") };
}

export default function SharedSessionPage() {
  return <SharedSession />;
}
