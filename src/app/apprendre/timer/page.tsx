import type { Metadata } from "next";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import { Timer } from "./Timer";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const t = getServerT(lang);
  return { title: t("apprendre.timer.title") };
}

export default function TimerPage() {
  return <Timer />;
}
