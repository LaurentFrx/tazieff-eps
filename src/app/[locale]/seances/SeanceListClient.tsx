"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Chips } from "@/components/Chips";
import { SeanceCard } from "@/components/SeanceCard";
import type { Difficulty, SeanceFrontmatter } from "@/lib/content/schema";
import { useI18n } from "@/lib/i18n/I18nProvider";

type SeanceListClientProps = {
  seances: SeanceFrontmatter[];
};

const durationRanges = [
  { value: "all", labelKey: "filters.allDurations" },
  { value: "short", labelKey: "seances.duration.short" },
  { value: "medium", labelKey: "seances.duration.medium" },
  { value: "long", labelKey: "seances.duration.long" },
  { value: "extra", labelKey: "seances.duration.extra" },
] as const;

const levelKeys: Record<Difficulty, string> = {
  debutant: "difficulty.debutant",
  intermediaire: "difficulty.intermediaire",
  avance: "difficulty.avance",
};

export function SeanceListClient({ seances }: SeanceListClientProps) {
  const { t } = useI18n();
  const [durationFilter, setDurationFilter] = useState<(typeof durationRanges)[number]["value"]>(
    "all",
  );
  const [selectedLevels, setSelectedLevels] = useState<Difficulty[]>([]);

  const levels = useMemo(() => {
    const levelSet = new Set<Difficulty>();
    seances.forEach((seance) => {
      if (seance.level) {
        levelSet.add(seance.level);
      }
    });
    return Array.from(levelSet);
  }, [seances]);

  const filtered = useMemo(() => {
    return seances.filter((seance) => {
      if (durationFilter !== "all") {
        const duration = seance.durationMin;
        if (durationFilter === "short" && duration > 30) {
          return false;
        }
        if (durationFilter === "medium" && (duration <= 30 || duration > 45)) {
          return false;
        }
        if (durationFilter === "long" && (duration <= 45 || duration > 60)) {
          return false;
        }
        if (durationFilter === "extra" && duration <= 60) {
          return false;
        }
      }

      if (selectedLevels.length > 0) {
        if (!seance.level || !selectedLevels.includes(seance.level)) {
          return false;
        }
      }

      return true;
    });
  }, [durationFilter, seances, selectedLevels]);

  const toggleLevel = (level: Difficulty) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((item) => item !== level) : [...prev, level],
    );
  };

  return (
    <div className="stack-lg">
      <div className="filter-panel">
        <div className="chip-row">
          {durationRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              className={`chip${durationFilter === range.value ? " is-active" : ""}`}
              onClick={() => setDurationFilter(range.value)}
            >
              {t(range.labelKey)}
            </button>
          ))}
        </div>
        {levels.length > 0 ? (
          <Chips
            label={t("filters.level")}
            items={levels.map((level) => t(levelKeys[level]))}
            activeItems={selectedLevels.map((level) => t(levelKeys[level]))}
            onToggle={(label) => {
              const entry = Object.entries(levelKeys).find(([key]) => t(levelKeys[key as Difficulty]) === label);
              if (entry) {
                toggleLevel(entry[0] as Difficulty);
              }
            }}
            onClear={() => setSelectedLevels([])}
          />
        ) : null}
      </div>

      <p className="text-sm text-[color:var(--muted)]">
        {filtered.length} séance{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="card-grid">
        {filtered.length === 0 ? (
          <div className="card">
            <h2>{t("seances.emptyTitle")}</h2>
            <p>{t("seances.emptyHint")}</p>
          </div>
        ) : (
          filtered.map((seance) => (
            <Link key={seance.slug} href={`/seances/${seance.slug}`}>
              <article className="card">
                <SeanceCard seance={seance} />
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
