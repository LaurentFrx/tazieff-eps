"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { epley, brzycki } from "@/lib/rm";
import { LearnWarning } from "@/components/learn/LearnWarning";

/* ─── Zone data (NSCA Training Load Chart) ─── */

interface ZoneInfo {
  zone: string;
  reps: string;
  color: string;
  colorDark: string;
}

const ZONE_MAP: Record<number, ZoneInfo> = {
  100: { zone: "force_max", reps: "~1 rep", color: "#f87171", colorDark: "#ef4444" },
  95: { zone: "force", reps: "~2 reps", color: "#f87171", colorDark: "#ef4444" },
  90: { zone: "force", reps: "~4 reps", color: "#f87171", colorDark: "#ef4444" },
  85: { zone: "force", reps: "~6 reps", color: "#f87171", colorDark: "#ef4444" },
  80: { zone: "volume", reps: "~8 reps", color: "#60a5fa", colorDark: "#3b82f6" },
  75: { zone: "volume", reps: "~10 reps", color: "#60a5fa", colorDark: "#3b82f6" },
  70: { zone: "volume", reps: "~12 reps", color: "#60a5fa", colorDark: "#3b82f6" },
  65: { zone: "endurance", reps: "~15 reps", color: "#4ade80", colorDark: "#22c55e" },
  60: { zone: "endurance", reps: "~20 reps", color: "#4ade80", colorDark: "#22c55e" },
  55: { zone: "endurance", reps: "~22 reps", color: "#4ade80", colorDark: "#22c55e" },
  50: { zone: "endurance_legere", reps: "~25 reps", color: "#fb923c", colorDark: "#f97316" },
  45: { zone: "endurance_legere", reps: "~28 reps", color: "#fb923c", colorDark: "#f97316" },
  40: { zone: "puissance_vitesse", reps: "explosif", color: "#a78bfa", colorDark: "#7c3aed" },
  35: { zone: "puissance_vitesse", reps: "explosif", color: "#a78bfa", colorDark: "#7c3aed" },
  30: { zone: "puissance_vitesse", reps: "explosif", color: "#a78bfa", colorDark: "#7c3aed" },
};

const ZONE_LABELS: Record<string, string> = {
  force_max: "outils.rm.zoneForceMax",
  force: "outils.rm.zoneForce",
  volume: "outils.rm.zoneVolume",
  endurance: "outils.rm.zoneEndurance",
  endurance_legere: "outils.rm.zoneEnduranceLegere",
  puissance_vitesse: "outils.rm.zonePuissanceVitesse",
};

/* Slider tick labels for zone slider */
const ZONE_TICKS = [
  { pct: 30, label: "30%", color: "#a78bfa" },
  { pct: 55, label: "55", color: "#4ade80" },
  { pct: 70, label: "70", color: "#60a5fa" },
  { pct: 85, label: "85", color: "#f87171" },
  { pct: 100, label: "100%", color: "#f87171" },
];

/* ─── Helpers ─── */

function sliderGradient(pct: number, min: number, max: number, leftColor: string, rightColor: string) {
  const ratio = ((pct - min) / (max - min)) * 100;
  return `linear-gradient(to right, ${leftColor} 0%, ${leftColor} ${ratio}%, ${rightColor} ${ratio}%, ${rightColor} 100%)`;
}

function compute1RM(charge: number, reps: number): { avg: number; ep: number; br: number } {
  if (reps === 1) return { avg: charge, ep: charge, br: charge };
  const ep = epley(charge, reps);
  const br = reps >= 37 ? ep : brzycki(charge, reps);
  const avg = Math.round((ep + br) / 2);
  return { avg, ep, br };
}

/* ─── Zone Card ─── */

function ZoneCard({
  pct,
  rm1,
  variant,
  borderRadius,
  t,
}: {
  pct: number;
  rm1: number;
  variant: "active" | "context";
  borderRadius: string;
  t: (k: string) => string;
}) {
  const z = ZONE_MAP[pct];
  if (!z) return null;
  const weight = Math.round((rm1 * pct) / 100);
  const label = t(ZONE_LABELS[z.zone]);
  const isActive = variant === "active";
  const dotSize = isActive ? 8 : 6;
  const labelSize = isActive ? "text-[15px]" : "text-[13px]";
  const weightSize = isActive ? "text-[28px]" : "text-[20px]";

  return (
    <div
      style={{
        background: isActive ? `rgba(${hexToRgb(z.color)}, 0.06)` : "transparent",
        border: `1px solid rgba(${hexToRgb(z.color)}, ${isActive ? 0.2 : 0.12})`,
        borderLeft: `3px solid ${z.colorDark}`,
        borderRadius,
        padding: isActive ? "16px 14px" : "12px 14px",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="shrink-0 rounded-full"
            style={{ width: dotSize, height: dotSize, background: z.colorDark }}
          />
          <div className="min-w-0">
            <div className={`${labelSize} font-medium text-zinc-800 dark:text-zinc-100 truncate`}>
              {label}
            </div>
            <div className="text-[11px] text-zinc-500">{z.reps}</div>
          </div>
        </div>
        <div className="text-right shrink-0 pl-3">
          <div className="font-mono text-[14px] font-medium" style={{ color: z.color }}>
            {pct}%
          </div>
          <div className={`font-mono ${weightSize} font-medium`} style={{ color: z.color }}>
            {weight}
            <span className="text-[13px] text-zinc-500 ml-0.5">kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

/* ─── Main Component ─── */

export function CalculateurRM() {
  const { t } = useI18n();
  const [charge, setCharge] = useState(60);
  const [reps, setReps] = useState(10);
  const [zonePct, setZonePct] = useState(70);

  const { avg, ep, br } = useMemo(() => compute1RM(charge, reps), [charge, reps]);

  const abovePct = zonePct > 30 ? zonePct - 5 : null;
  const belowPct = zonePct < 100 ? zonePct + 5 : null;

  const activeZone = ZONE_MAP[zonePct];

  /* Border-radius logic */
  const aboveRadius = "0 14px 0 0";
  const belowRadius = "0 0 14px 0";
  let middleRadius = "0";
  if (!abovePct) middleRadius = "0 14px 0 0";
  if (!belowPct) middleRadius = "0 0 14px 0";

  return (
    <section className="page">
      {/* Header */}
      <header className="page-header">
        <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("outils.backLabel")}
        </Link>
        <h1>{t("apprendre.calculateur.title")}</h1>
      </header>

      {/* Section 1 — Sliders d'entrée */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-6"
        style={{
          background: "rgba(0,229,255,0.04)",
          border: "1px solid rgba(0,229,255,0.08)",
        }}
      >
        {/* Charge slider */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {t("apprendre.calculateur.chargeLabel")}
            </span>
            <span className="font-mono text-[28px] font-medium text-cyan-400">
              {charge}
              <span className="text-[14px] text-zinc-500 ml-1">kg</span>
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={200}
            step={1}
            value={charge}
            onChange={(e) => setCharge(Number(e.target.value))}
            className="rm-slider w-full"
            style={{
              background: sliderGradient(charge, 5, 200, "rgba(0,229,255,0.35)", "rgba(255,255,255,0.06)"),
            }}
          />
          <div className="flex justify-between text-[11px] text-zinc-700 mt-0.5">
            <span>5 kg</span>
            <span>200 kg</span>
          </div>
        </div>

        {/* Reps slider */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {t("apprendre.calculateur.repsLabel")}
            </span>
            <span className="font-mono text-[28px] font-medium text-pink-500">
              {reps}
              <span className="text-[14px] text-zinc-500 ml-1">rep{reps > 1 ? "s" : ""}</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="rm-slider w-full"
            style={{
              background: sliderGradient(reps, 1, 30, "rgba(255,0,110,0.35)", "rgba(255,255,255,0.06)"),
            }}
          />
          <div className="flex justify-between text-[11px] text-zinc-700 mt-0.5">
            <span>1 rep</span>
            <span>30 reps</span>
          </div>
        </div>
      </div>

      {/* Section 2 — Résultat 1RM */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="text-[11px] text-zinc-500 tracking-widest font-medium uppercase mb-1">
          {t("apprendre.calculateur.resultLabel")}
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-mono text-[52px] font-medium text-zinc-800 dark:text-zinc-100 leading-none">
            {avg}
          </span>
          <span className="text-[18px] text-zinc-500">kg</span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <div>
            <div className="text-[11px] text-zinc-500">Epley</div>
            <div className="text-[14px] font-mono font-medium text-zinc-600 dark:text-zinc-400">{ep} kg</div>
          </div>
          <div className="w-px h-7 bg-zinc-300 dark:bg-zinc-700" />
          <div>
            <div className="text-[11px] text-zinc-500">Brzycki</div>
            <div className="text-[14px] font-mono font-medium text-zinc-600 dark:text-zinc-400">{br} kg</div>
          </div>
        </div>
      </div>

      {/* Section 3 — Zones de travail */}
      <div className="flex flex-col gap-0">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          {t("apprendre.calculateur.tableHeading")}
        </h2>

        {/* Above card */}
        {abovePct !== null && (
          <ZoneCard pct={abovePct} rm1={avg} variant="context" borderRadius={aboveRadius} t={t} />
        )}

        {/* Active card + zone slider */}
        <div
          style={{
            background: activeZone ? `rgba(${hexToRgb(activeZone.color)}, 0.06)` : undefined,
            border: activeZone ? `1px solid rgba(${hexToRgb(activeZone.color)}, 0.2)` : undefined,
            borderLeft: activeZone ? `3px solid ${activeZone.colorDark}` : undefined,
            borderRadius: middleRadius,
            padding: "16px 14px",
          }}
        >
          {activeZone && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="shrink-0 rounded-full"
                    style={{ width: 8, height: 8, background: activeZone.colorDark }}
                  />
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {t(ZONE_LABELS[activeZone.zone])}
                    </div>
                    <div className="text-[11px] text-zinc-500">{activeZone.reps}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <div className="font-mono text-[14px] font-medium" style={{ color: activeZone.color }}>
                    {zonePct}%
                  </div>
                  <div className="font-mono text-[28px] font-medium" style={{ color: activeZone.color }}>
                    {Math.round((avg * zonePct) / 100)}
                    <span className="text-[13px] text-zinc-500 ml-0.5">kg</span>
                  </div>
                </div>
              </div>

              {/* Zone slider inside active card */}
              <div className="mt-4">
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={5}
                  value={zonePct}
                  onChange={(e) => setZonePct(Number(e.target.value))}
                  className="rm-slider w-full"
                  style={{
                    background: sliderGradient(
                      zonePct,
                      30,
                      100,
                      `rgba(${hexToRgb(activeZone.color)}, 0.35)`,
                      "rgba(255,255,255,0.06)",
                    ),
                  }}
                />
                {/* Tick labels */}
                <div className="relative h-4 mt-0.5">
                  {ZONE_TICKS.map((tick) => {
                    const pos = ((tick.pct - 30) / 70) * 100;
                    return (
                      <span
                        key={tick.pct}
                        className="absolute text-[10px] font-medium -translate-x-1/2"
                        style={{ left: `${pos}%`, color: tick.color }}
                      >
                        {tick.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Below card */}
        {belowPct !== null && (
          <ZoneCard pct={belowPct} rm1={avg} variant="context" borderRadius={belowRadius} t={t} />
        )}
      </div>

      {/* Section 4 — Warning sécurité */}
      <LearnWarning>
        Le 1RM est une estimation. Ne tente jamais un vrai max sans pareur et sans maîtriser la technique.
      </LearnWarning>

      {/* Section 5 — Chips de liens */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/apprendre/rm-rir-rpe"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          style={{
            background: "rgba(0,229,255,0.08)",
            border: "1px solid rgba(0,229,255,0.15)",
            color: "#00e5ff",
          }}
        >
          RM, RIR et RPE →
        </Link>
        <Link
          href="/apprendre/connaissances"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          style={{
            background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.15)",
            color: "#a78bfa",
          }}
        >
          Connaissances →
        </Link>
      </div>
    </section>
  );
}
