"use client";

import DifficultyPill from "@/components/DifficultyPill";
import type { SeanceFrontmatter } from "@/lib/content/schema";
import { useI18n } from "@/lib/i18n/I18nProvider";

type SeanceCardProps = {
  seance: SeanceFrontmatter;
};

export function SeanceCard({ seance }: SeanceCardProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill">
          {seance.durationMin} min · {seance.blocks.length} {t("seanceCard.blocks")}
        </span>
        {seance.level ? <DifficultyPill level={seance.level} /> : null}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{seance.title}</h2>
        <p className="text-sm text-[color:var(--muted)]">
          {seance.tags.join(" • ")}
        </p>
      </div>
    </div>
  );
}
