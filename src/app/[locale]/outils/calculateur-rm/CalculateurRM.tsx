"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { epley, brzycki } from "@/lib/rm";
import { LearnWarning } from "@/components/learn/LearnWarning";

/* ─── Zone data (NSCA Training Load Chart) ─── */

const ZONE_ROWS = [
  { pct: 100, reps: "~1 rep",   zone: "force_max",         color: "#f87171" },
  { pct: 95,  reps: "~2 reps",  zone: "force",             color: "#f87171" },
  { pct: 90,  reps: "~4 reps",  zone: "force",             color: "#f87171" },
  { pct: 85,  reps: "~6 reps",  zone: "force",             color: "#f87171" },
  { pct: 80,  reps: "~8 reps",  zone: "volume",            color: "#60a5fa" },
  { pct: 75,  reps: "~10 reps", zone: "volume",            color: "#60a5fa" },
  { pct: 70,  reps: "~12 reps", zone: "volume",            color: "#60a5fa" },
  { pct: 65,  reps: "~15 reps", zone: "endurance",         color: "#4ade80" },
  { pct: 60,  reps: "~20 reps", zone: "endurance",         color: "#4ade80" },
  { pct: 55,  reps: "~22 reps", zone: "endurance",         color: "#4ade80" },
  { pct: 50,  reps: "~25 reps", zone: "endurance_legere",  color: "#fb923c" },
  { pct: 45,  reps: "~28 reps", zone: "endurance_legere",  color: "#fb923c" },
  { pct: 40,  reps: "explosif", zone: "puissance_vitesse", color: "#a78bfa" },
  { pct: 35,  reps: "explosif", zone: "puissance_vitesse", color: "#a78bfa" },
  { pct: 30,  reps: "explosif", zone: "puissance_vitesse", color: "#a78bfa" },
] as const;

const ZONE_I18N: Record<string, string> = {
  force_max: "outils.rm.zoneForceMax",
  force: "outils.rm.zoneForce",
  volume: "outils.rm.zoneVolume",
  endurance: "outils.rm.zoneEndurance",
  endurance_legere: "outils.rm.zoneEnduranceLegere",
  puissance_vitesse: "outils.rm.zonePuissanceVitesse",
};

const ROW_H = 70;
const PICKER_H = ROW_H * 3; // 210px — 3 lignes visibles
const INIT_IDX = 7; // 65% — zone pertinente pour un débutant

/* ─── Helpers ─── */

function sliderBg(val: number, min: number, max: number, left: string, right: string) {
  const r = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right,${left} 0%,${left} ${r}%,${right} ${r}%,${right} 100%)`;
}

function calc1RM(charge: number, reps: number) {
  if (reps === 1) return { avg: charge, ep: charge, br: charge };
  const ep = epley(charge, reps);
  const br = reps >= 37 ? ep : brzycki(charge, reps);
  return { avg: Math.round((ep + br) / 2), ep, br };
}

/* ─── Wheel Picker (style iOS UIPickerView) ─── */

function WheelPicker({ rm1, t }: { rm1: number; t: (k: string) => string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafId = useRef(0);

  const updateVisuals = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const st = el.scrollTop;
    const activeIdx = Math.round(st / ROW_H);

    for (let i = 0; i < rowRefs.current.length; i++) {
      const row = rowRefs.current[i];
      if (!row) continue;
      const d = Math.abs(st - i * ROW_H);

      let op: number;
      let sc: number;
      if (d < 15) {
        op = 1;
        sc = 1;
      } else if (d < ROW_H * 1.5) {
        const progress = (d - 15) / (ROW_H * 1.5 - 15);
        op = 1 - progress * 0.6;
        sc = 1 - progress * 0.08;
      } else {
        op = 0.15;
        sc = 0.85;
      }

      row.style.opacity = String(op);
      row.style.transform = `scale(${sc})`;
      row.setAttribute("aria-selected", String(i === activeIdx));
    }

    // Update aria-activedescendant
    if (ZONE_ROWS[activeIdx]) {
      el.setAttribute("aria-activedescendant", `rm-zone-${ZONE_ROWS[activeIdx].pct}`);
    }
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(updateVisuals);
  }, [updateVisuals]);

  // Position initiale sur 65% + apply transforms
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = INIT_IDX * ROW_H;
    updateVisuals();
  }, [updateVisuals]);

  const step = (delta: number) =>
    scrollRef.current?.scrollBy({ top: delta * ROW_H, behavior: "smooth" });

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
  };

  return (
    <div className="relative">
      {/* Bouton ▲ */}
      <button
        type="button"
        onClick={() => step(-1)}
        className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 p-1 text-zinc-500 opacity-30 hover:opacity-60 transition-opacity"
        aria-label="Pourcentage supérieur"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Picker container */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]"
        style={{ height: PICKER_H }}
      >
        {/* Indicateur central (zone de sélection) */}
        <div
          className="absolute left-0 right-0 z-[2] pointer-events-none bg-black/[0.03] dark:bg-white/[0.03] border-y border-black/10 dark:border-white/10"
          style={{ top: ROW_H, height: ROW_H }}
        />

        {/* Liste scrollable */}
        <div
          ref={scrollRef}
          role="listbox"
          tabIndex={0}
          aria-label="Sélecteur de pourcentage de charge"
          onScroll={onScroll}
          onKeyDown={onKey}
          className="rm-wheel h-full overflow-y-scroll outline-none"
          style={{
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
          }}
        >
          {/* Padding haut — permet au 1er élément d'être centré */}
          <div style={{ height: ROW_H }} aria-hidden="true" />

          {ZONE_ROWS.map((r, i) => {
            const weight = Math.round((rm1 * r.pct) / 100);
            return (
              <div
                key={r.pct}
                id={`rm-zone-${r.pct}`}
                ref={(el) => { rowRefs.current[i] = el; }}
                role="option"
                aria-selected={i === INIT_IDX}
                className="flex items-center justify-between px-5"
                style={{
                  height: ROW_H,
                  scrollSnapAlign: "center",
                  transition: "opacity .15s, transform .15s",
                  willChange: "opacity, transform",
                }}
              >
                {/* Gauche : pourcentage + reps + zone */}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-mono text-[28px] font-medium"
                      style={{ color: r.color }}
                    >
                      {r.pct}%
                    </span>
                    <span className="text-[12px] text-zinc-500">{r.reps}</span>
                  </div>
                  <div className="text-[12px] truncate" style={{ color: r.color }}>
                    {t(ZONE_I18N[r.zone])}
                  </div>
                </div>

                {/* Droite : poids calculé */}
                <div
                  className="shrink-0 pl-3 font-mono text-[24px] font-medium"
                  style={{ color: r.color }}
                >
                  {weight}
                  <span className="text-[13px] text-zinc-500 ml-0.5">kg</span>
                </div>
              </div>
            );
          })}

          {/* Padding bas — permet au dernier élément d'être centré */}
          <div style={{ height: ROW_H }} aria-hidden="true" />
        </div>
      </div>

      {/* Bouton ▼ */}
      <button
        type="button"
        onClick={() => step(1)}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 p-1 text-zinc-500 opacity-30 hover:opacity-60 transition-opacity"
        aria-label="Pourcentage inférieur"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Composant principal ─── */

export function CalculateurRM() {
  const { t } = useI18n();
  const [charge, setCharge] = useState(60);
  const [reps, setReps] = useState(10);
  const { avg, ep, br } = useMemo(() => calc1RM(charge, reps), [charge, reps]);

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
        {/* Charge */}
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
            onChange={(e) => setCharge(+e.target.value)}
            className="rm-slider w-full"
            style={{
              background: sliderBg(
                charge, 5, 200,
                "rgba(0,229,255,0.35)",
                "rgba(255,255,255,0.06)",
              ),
            }}
          />
          <div className="flex justify-between text-[11px] text-zinc-700 mt-0.5">
            <span>5 kg</span>
            <span>200 kg</span>
          </div>
        </div>

        {/* Répétitions */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              {t("apprendre.calculateur.repsLabel")}
            </span>
            <span className="font-mono text-[28px] font-medium text-pink-500">
              {reps}
              <span className="text-[14px] text-zinc-500 ml-1">
                rep{reps > 1 ? "s" : ""}
              </span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={reps}
            onChange={(e) => setReps(+e.target.value)}
            className="rm-slider w-full"
            style={{
              background: sliderBg(
                reps, 1, 30,
                "rgba(255,0,110,0.35)",
                "rgba(255,255,255,0.06)",
              ),
            }}
          />
          <div className="flex justify-between text-[11px] text-zinc-700 mt-0.5">
            <span>1 rep</span>
            <span>30 reps</span>
          </div>
        </div>
      </div>

      {/* Section 2 — Résultat 1RM */}
      <div className="rounded-2xl p-5 text-center bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
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
            <div className="text-[14px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
              {ep} kg
            </div>
          </div>
          <div className="w-px h-7 bg-zinc-300 dark:bg-zinc-700" />
          <div>
            <div className="text-[11px] text-zinc-500">Brzycki</div>
            <div className="text-[14px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
              {br} kg
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 — Wheel Picker zones de travail */}
      <div>
        <div className="text-[12px] font-medium text-zinc-400 tracking-wide mb-3 uppercase">
          Choisis ta charge de travail
        </div>
        <WheelPicker rm1={avg} t={t} />
      </div>

      {/* Section 4 — Warning sécurité */}
      <LearnWarning>
        Le 1RM est une estimation. Ne tente jamais un vrai max sans pareur et
        sans maîtriser la technique.
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
