import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));
  return { title: t("meta.reglagesTitle"), description: t("meta.reglagesDesc") };
}

export default function ReglagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
