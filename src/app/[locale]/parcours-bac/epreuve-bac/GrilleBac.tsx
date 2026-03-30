"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { GRILLE_BAC } from "../data";

export function GrilleBac() {
  const { t } = useI18n();
  const total = GRILLE_BAC.reduce((s, c) => s + c.points, 0);

  return (
    <div className="stack-lg">
      <div className="parcours-grille-total">
        <span className="parcours-grille-total-label">
          {t("parcours.grille.totalLabel")}
        </span>
        <span className="parcours-grille-total-value">
          {total} {t("parcours.grille.points")}
        </span>
      </div>

      <div className="card-grid">
        {GRILLE_BAC.map((comp) => {
          const pct = Math.round((comp.points / total) * 100);
          return (
            <article key={comp.titleKey} className="card parcours-grille-card">
              <div className="parcours-grille-header">
                <h2>{t(comp.titleKey)}</h2>
                <span className="parcours-grille-points">
                  {comp.points} pts
                </span>
              </div>

              <div className="parcours-grille-bar-wrap">
                <div
                  className="parcours-grille-bar"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-sm">{t(comp.descriptionKey)}</p>

              {comp.links.length > 0 && (
                <div className="parcours-grille-links">
                  {comp.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="parcours-grille-link"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
