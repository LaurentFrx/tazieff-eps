"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { NIVEAUX, getCheckedCount, getTotalItems, type Niveau } from "./data";
import { useReveal } from "@/hooks/useReveal";

function AnimatedProgressBar({ pct }: { pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="parcours-progress-bar">
      <div
        className="parcours-progress-fill"
        style={{
          width: visible ? `${pct}%` : "0%",
          transition: "width 1s ease-out",
        }}
      />
    </div>
  );
}

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

  const revealRefs = [
    useReveal(0),
    useReveal(120),
    useReveal(240),
    useReveal(360),
  ];

  return (
    <div className="card-grid">
      {NIVEAUX.map((niveau, i) => {
        const total = getTotalItems(niveau.key);
        const checked = counts[niveau.key];
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

        return (
          <div key={niveau.key} ref={revealRefs[i] as React.RefObject<HTMLDivElement>}>
            <Link
              href={`/parcours-bac/${niveau.key}`}
              className="card tap-feedback parcours-card"
            >
              <span className="eyebrow">{t(niveau.subtitleKey)}</span>
              <h2>{t(`parcours.niveaux.${niveau.key}`)}</h2>
              <p className="text-sm">{t(niveau.summaryKey)}</p>

              <div className="parcours-progress">
                <AnimatedProgressBar pct={pct} />
                <span className="parcours-progress-label">
                  {checked}/{total} — {pct}%
                </span>
              </div>
            </Link>
          </div>
        );
      })}

      <div ref={revealRefs[3] as React.RefObject<HTMLDivElement>}>
        <Link
          href="/parcours-bac/epreuve-bac"
          className="card tap-feedback parcours-card parcours-card--grille"
        >
          <span className="eyebrow">{t("parcours.grille.eyebrow")}</span>
          <h2>{t("parcours.grille.title")}</h2>
          <p className="text-sm">{t("parcours.grille.subtitle")}</p>
        </Link>
      </div>
    </div>
  );
}
