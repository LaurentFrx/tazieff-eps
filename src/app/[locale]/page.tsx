import type { Metadata } from "next";
import { MaSeanceClient } from "./MaSeanceClient";
import { getExercisesIndex } from "@/lib/exercices/getExercisesIndex";
import { getServerLang, getServerT } from "@/lib/i18n/server";
import type { LiveExerciseListItem } from "@/lib/live/types";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerT(getServerLang(locale));
  return { title: t("meta.homeTitle"), description: t("meta.homeDesc") };
}

/* ── Session definitions (S1-S6, matching exercise slug prefixes) ─── */

export type SessionDef = {
  id: string;
  titleKey: string;
  prefix: string;
  color: string;
  icon: string;
  level: "debutant" | "intermediaire" | "avance";
};

const SESSIONS: SessionDef[] = [
  { id: "s1", titleKey: "S1 — Gainage fondamental",       prefix: "s1-", color: "#f97316", icon: "🔥", level: "debutant" },
  { id: "s2", titleKey: "S2 — Cardio et gainage dynamique", prefix: "s2-", color: "#ef4444", icon: "💨", level: "debutant" },
  { id: "s3", titleKey: "S3 — Haut du corps haltères",     prefix: "s3-", color: "#3b82f6", icon: "💪", level: "intermediaire" },
  { id: "s4", titleKey: "S4 — Bas du corps",               prefix: "s4-", color: "#22c55e", icon: "🦵", level: "intermediaire" },
  { id: "s5", titleKey: "S5 — Fonctionnel",                prefix: "s5-", color: "#a855f7", icon: "⚡", level: "avance" },
  { id: "s6", titleKey: "S6 — Étirements",                 prefix: "s6-", color: "#ec4899", icon: "🧘", level: "debutant" },
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const lang = getServerLang(locale);
  const exercises = await getExercisesIndex(lang);

  // Group exercises by session prefix
  const sessionExercises: Record<string, LiveExerciseListItem[]> = {};
  for (const s of SESSIONS) {
    sessionExercises[s.id] = exercises
      .filter((ex) => ex.slug.startsWith(s.prefix))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }

  return (
    <MaSeanceClient
      sessions={SESSIONS}
      sessionExercises={sessionExercises}
    />
  );
}
