"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { epley, brzycki, RM_TABLE } from "@/lib/rm";

const ZONE_COLORS: Record<string, string> = {
  force_max: "#ef4444",
  force: "#fb923c",
  volume: "#60a5fa",
  endurance: "#34d399",
  endurance_legere: "#2dd4bf",
  puissance_vitesse: "#c084fc",
};

export function CalculateurRM() {
  const { t } = useI18n();
  const [charge, setCharge] = useState("");
  const [reps, setReps] = useState("");

  const chargeNum = parseFloat(charge);
  const repsNum = parseInt(reps, 10);
  const valid = chargeNum > 0 && repsNum > 0 && repsNum <= 30;
  const rm1Epley = valid ? epley(chargeNum, repsNum) : null;
  const rm1Brzycki = valid ? brzycki(chargeNum, repsNum) : null;
  const rm1 = rm1Epley;

  const zoneLabels: Record<string, string> = {
    force_max: t("outils.rm.zoneForceMax"),
    force: t("outils.rm.zoneForce"),
    volume: t("outils.rm.zoneVolume"),
    endurance: t("outils.rm.zoneEndurance"),
    endurance_legere: t("outils.rm.zoneEnduranceLegere"),
    puissance_vitesse: t("outils.rm.zonePuissanceVitesse"),
  };

  return (
    <section className="page">
      <header className="page-header">
        <Link
          href="/outils"
          className="eyebrow hover:text-[color:var(--accent)]"
        >
          ← {t("outils.backLabel")}
        </Link>
        <h1>{t("apprendre.calculateur.title")}</h1>
      </header>

      <div className="card flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
              {t("apprendre.calculateur.chargeLabel")}
            </span>
            <input
              type="number"
              min="1"
              max="500"
              step="0.5"
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
              inputMode="decimal"
              placeholder={t("apprendre.calculateur.chargePlaceholder")}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-2)] px-4 py-3 text-2xl font-black tabular-nums text-[color:var(--ink)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
              {t("apprendre.calculateur.repsLabel")}
            </span>
            <input
              type="number"
              min="1"
              max="30"
              step="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              inputMode="numeric"
              placeholder={t("apprendre.calculateur.repsPlaceholder")}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-2)] px-4 py-3 text-2xl font-black tabular-nums text-[color:var(--ink)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </label>
        </div>

        {/* Main result — Epley */}
        <div
          className="tool-result"
          style={{ "--tool-accent": "#ff7a59" } as React.CSSProperties}
        >
          <span className="tool-result-label">
            {t("apprendre.calculateur.resultLabel")} (Epley)
          </span>
          <span className="tool-result-value">
            {rm1Epley !== null ? rm1Epley : "—"}
          </span>
          {rm1Epley !== null && (
            <span className="tool-result-unit">kg</span>
          )}
        </div>

        {/* Secondary result — Brzycki */}
        <div className="flex items-center justify-between rounded-xl bg-[color:var(--accent-soft)] px-4 py-3">
          <span className="text-xs font-semibold text-[color:var(--muted)]">
            {t("apprendre.calculateur.resultLabel")} (Brzycki)
          </span>
          <span className="text-2xl font-bold tabular-nums text-[color:var(--accent)]">
            {rm1Brzycki !== null ? `${rm1Brzycki} kg` : "—"}
          </span>
        </div>

        <p className="text-right text-xs text-[color:var(--muted)]">
          {t("apprendre.calculateur.formulaNote")}
        </p>
      </div>

      {rm1 !== null ? (
        <div className="card">
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
            {t("apprendre.calculateur.tableHeading")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                    {t("apprendre.calculateur.percentCol")}
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                    {t("apprendre.calculateur.weightCol")}
                  </th>
                  <th className="hidden pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted)] sm:table-cell">
                    {t("outils.rm.zoneCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {RM_TABLE.map(({ pct, reps: approxReps, zone }) => {
                  const weight = Math.round(((rm1 * pct) / 100) * 2) / 2;
                  const zoneColor = ZONE_COLORS[zone] || "var(--muted)";
                  return (
                    <tr
                      key={pct}
                      className="border-b border-[color:var(--border)] last:border-0"
                    >
                      <td className="py-2.5 font-semibold text-[color:var(--ink)]">
                        {pct}%
                        {approxReps > 0 && (
                          <span className="ml-1 text-xs font-normal text-[color:var(--muted)]">
                            (~{approxReps} reps)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-lg font-black tabular-nums" style={{ color: zoneColor }}>
                        {weight} kg
                      </td>
                      <td className="hidden py-2.5 text-xs sm:table-cell">
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{ color: zoneColor }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: zoneColor }}
                          />
                          {zoneLabels[zone]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Link
        href="/apprendre/rm-rir-rpe"
        className="card flex items-center justify-center py-3 text-sm font-semibold text-[color:var(--accent)] transition-colors hover:border-[color:var(--accent)]"
      >
        {t("outils.rm.learnLink")}
      </Link>
    </section>
  );
}
