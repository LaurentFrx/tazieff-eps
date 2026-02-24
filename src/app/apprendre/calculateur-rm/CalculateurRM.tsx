"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const RM_TABLE = [
  { pct: 95, reps: 2 },
  { pct: 90, reps: 4 },
  { pct: 85, reps: 6 },
  { pct: 80, reps: 8 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
  { pct: 65, reps: 15 },
  { pct: 60, reps: 20 },
  { pct: 50, reps: 25 },
] as const;

function epley(charge: number, reps: number): number {
  if (reps === 1) return charge;
  return Math.round(charge * (1 + reps / 30));
}

export function CalculateurRM() {
  const { t } = useI18n();
  const [charge, setCharge] = useState("");
  const [reps, setReps] = useState("");

  const chargeNum = parseFloat(charge);
  const repsNum = parseInt(reps, 10);
  const rm1 =
    chargeNum > 0 && repsNum > 0 && repsNum <= 30
      ? epley(chargeNum, repsNum)
      : null;

  return (
    <section className="page">
      <header className="page-header">
        <Link
          href="/apprendre"
          className="eyebrow hover:text-[color:var(--accent)]"
        >
          ← {t("apprendre.backLabel")}
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

        <div className="flex items-center justify-between rounded-lg bg-[color:var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-semibold text-[color:var(--muted)]">
            {t("apprendre.calculateur.resultLabel")}
          </span>
          <span className="text-3xl font-bold text-[color:var(--accent)]">
            {rm1 !== null ? `${rm1} kg` : t("apprendre.calculateur.placeholder")}
          </span>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="pb-2 text-left text-xs font-semibold text-[color:var(--muted)]">
                  {t("apprendre.calculateur.percentCol")}
                </th>
                <th className="pb-2 text-center text-xs font-semibold text-[color:var(--muted)]">
                  {t("apprendre.calculateur.repsCol")}
                </th>
                <th className="pb-2 text-right text-xs font-semibold text-[color:var(--muted)]">
                  {t("apprendre.calculateur.weightCol")}
                </th>
              </tr>
            </thead>
            <tbody>
              {RM_TABLE.map(({ pct, reps: approxReps }) => {
                const weight = Math.round(((rm1 * pct) / 100) * 2) / 2;
                return (
                  <tr
                    key={pct}
                    className="border-b border-[color:var(--border)] last:border-0"
                  >
                    <td className="py-2.5 font-semibold text-[color:var(--ink)]">
                      {pct}%
                    </td>
                    <td className="py-2.5 text-center text-[color:var(--muted)]">
                      ~{approxReps}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[color:var(--accent)]">
                      {weight} kg
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
