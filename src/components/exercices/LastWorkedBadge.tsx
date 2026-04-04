"use client";

import { useLastWorked } from "@/hooks/useLastWorked";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LastWorkedBadge({ muscleGroup }: { muscleGroup: string }) {
  const { daysAgo } = useLastWorked(muscleGroup);
  const { t } = useI18n();

  if (daysAgo === null) return null;

  let color: string;
  let text: string;

  if (daysAgo < 3) {
    color = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    text = t("exerciseDetail.lastWorked.recent");
  } else if (daysAgo <= 7) {
    color = "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    text = `${t("exerciseDetail.lastWorked.daysAgo").replace("{n}", String(daysAgo))}`;
  } else {
    color = "text-orange-400 bg-orange-400/10 border-orange-400/20";
    text = `${t("exerciseDetail.lastWorked.daysAgo").replace("{n}", String(daysAgo))} — ${t("exerciseDetail.lastWorked.timeToTrain")}`;
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${color}`}>
      <span>{text}</span>
    </div>
  );
}
