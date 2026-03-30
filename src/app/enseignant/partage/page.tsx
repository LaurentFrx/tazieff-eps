import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { SharedSession } from "./SharedSession";

export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLang();
  const t = getServerT(lang);
  return { title: t("enseignant.sharedTitle") };
}

export default function SharedSessionPage() {
  return <SharedSession />;
}
