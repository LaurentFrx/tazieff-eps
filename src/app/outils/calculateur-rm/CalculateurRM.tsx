"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const RM_TABLE = [
  { pct: 100, reps: 1, zone: "force_max" },
  { pct: 90, reps: 4, zone: "force" },
  { pct: 85, reps: 6, zone: "force" },
  { pct: 80, reps: 8, zone: "volume" },
  { pct: 75, reps: 10, zone: "volume" },
  { pct: 70, reps: 12, zone: "volume" },
  { pct: 65, reps: 15, zone: "endurance" },
  { pct: 60, reps: 20, zone: "endurance" },
  { pct: 50, reps: 25, zone: "endurance_legere" },
  { pct: 30, reps: 0, zone: "puissance_vitesse" },
] as const;

function epley(charge: number, reps: number): number {
  if (reps === 1) return charge;
  return Math.round(charge * (1 + reps / 30));
}

function brzycki(charge: number, reps: number): number {
  if (reps === 1) return charge;
  if (reps >= 37) return Math.round(charge * 37);
  return Math.round(charge * (36 / (37 - reps)));
}

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
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
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
              placeholder="ex: 60"
              className="rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-xl font-bold text-[color:var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
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
              placeholder="ex: 10"
              className="rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-xl font-bold text-[color:var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </label>
        </div>

        {/* Results — Epley + Brzycki */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--accent-soft)] px-4 py-3">
            <span className="text-sm font-semibold text-[color:var(--muted)]">
              {t("apprendre.calculateur.resultLabel")} (Epley)
            </span>
            <span className="text-3xl font-bold text-[color:var(--accent)]">
              {rm1Epley !== null ? `${rm1Epley} kg` : t("apprendre.calculateur.placeholder")}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[color:var(--accent-soft)] px-4 py-2">
            <span className="text-sm font-semibold text-[color:var(--muted)]">
              {t("apprendre.calculateur.resultLabel")} (Brzycki)
            </span>
            <span className="text-2xl font-bold text-[color:var(--accent)]">
              {rm1Brzycki !== null ? `${rm1Brzycki} kg` : t("apprendre.calculateur.placeholder")}
            </span>
          </div>
        </div>

        <p className="text-right text-xs text-[color:var(--muted)]">
          {t("apprendre.calculateur.formulaNote")}
        </p>
      </div>

      {rm1 !== null ? (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
            {t("apprendre.calculateur.tableHeading")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)]">
                  <th className="pb-2 text-left text-xs font-semibold text-[color:var(--muted)]">
                    {t("apprendre.calculateur.percentCol")}
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold text-[color:var(--muted)]">
                    {t("apprendre.calculateur.weightCol")}
                  </th>
                  <th className="hidden pb-2 text-left text-xs font-semibold text-[color:var(--muted)] sm:table-cell">
                    {t("outils.rm.zoneCol")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {RM_TABLE.map(({ pct, reps: approxReps, zone }) => {
                  const weight = Math.round(((rm1 * pct) / 100) * 2) / 2;
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
                      <td className="py-2.5 text-right font-bold text-[color:var(--accent)]">
                        {weight} kg
                      </td>
                      <td className="hidden py-2.5 text-xs text-[color:var(--muted)] sm:table-cell">
                        {zoneLabels[zone]}
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
