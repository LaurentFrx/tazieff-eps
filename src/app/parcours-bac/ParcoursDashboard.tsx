"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { NIVEAUX, getCheckedCount, getTotalItems, type Niveau } from "./data";

export function ParcoursDashboard() {
  const { t } = useI18n();
  const [counts, setCounts] = useState<Record<Niveau, number>>({
    seconde: 0,
    premiere: 0,
    terminale: 0,
  });

  useEffect(() => {
    setCounts({
      seconde: getCheckedCount("seconde"),
      premiere: getCheckedCount("premiere"),
      terminale: getCheckedCount("terminale"),
    });
  }, []);

  return (
    <div className="card-grid">
      {NIVEAUX.map((niveau) => {
        const total = getTotalItems(niveau.key);
        const checked = counts[niveau.key];
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

        return (
          <Link
            key={niveau.key}
            href={`/parcours-bac/${niveau.key}`}
            className="card parcours-card"
          >
            <span className="eyebrow">{t(niveau.subtitleKey)}</span>
            <h2>{t(`parcours.niveaux.${niveau.key}`)}</h2>
            <p className="text-sm">{t(niveau.summaryKey)}</p>

            <div className="parcours-progress">
              <div className="parcours-progress-bar">
                <div
                  className="parcours-progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="parcours-progress-label">
                {checked}/{total} — {pct}%
              </span>
            </div>
          </Link>
        );
      })}

      <Link
        href="/parcours-bac/epreuve-bac"
        className="card parcours-card parcours-card--grille"
      >
        <span className="eyebrow">{t("parcours.grille.eyebrow")}</span>
        <h2>{t("parcours.grille.title")}</h2>
        <p className="text-sm">{t("parcours.grille.subtitle")}</p>
      </Link>
    </div>
  );
}
