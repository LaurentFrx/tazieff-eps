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

/* ─── Helpers ─── */

function calc1RM(charge: number, reps: number) {
  if (reps === 1) return { avg: charge, ep: charge, br: charge };
  const ep = epley(charge, reps);
  const br = reps >= 37 ? ep : brzycki(charge, reps);
  return { avg: Math.round((ep + br) / 2), ep, br };
}

/* ─── Generic Wheel Picker (iOS UIPickerView style) ─── */

function Wheel({
  count,
  itemH,
  initIdx,
  onIdx,
  renderItem,
  containerClass,
  containerStyle,
  selectClass,
  selectStyle,
  maskFade,
  ariaLabel,
  idPrefix,
}: {
  count: number;
  itemH: number;
  initIdx: number;
  onIdx?: (i: number) => void;
  renderItem: (i: number) => React.ReactNode;
  containerClass?: string;
  containerStyle?: React.CSSProperties;
  selectClass?: string;
  selectStyle?: React.CSSProperties;
  maskFade: [number, number];
  ariaLabel: string;
  idPrefix: string;
}) {
  const h = itemH * 3;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafId = useRef(0);
  const onIdxRef = useRef(onIdx);
  onIdxRef.current = onIdx;
  const lastIdx = useRef(-1);
  const didInit = useRef(false);

  const applyVisuals = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const st = el.scrollTop;
    const idx = Math.min(Math.max(Math.round(st / itemH), 0), count - 1);

    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      onIdxRef.current?.(idx);
    }

    for (let i = 0; i < rowRefs.current.length; i++) {
      const row = rowRefs.current[i];
      if (!row) continue;
      const d = Math.abs(st - i * itemH);
      let op: number;
      let sc: number;
      if (d < itemH * 0.6) {
        op = 1;
        sc = 1;
      } else if (d < itemH * 1.6) {
        const p = (d - itemH * 0.6) / itemH;
        op = 1 - p * 0.65;
        sc = 1 - p * 0.1;
      } else {
        op = 0.12;
        sc = 0.82;
      }
      row.style.opacity = String(op);
      row.style.transform = `scale(${sc})`;
      row.setAttribute("aria-selected", String(i === idx));
    }

    el.setAttribute("aria-activedescendant", `${idPrefix}-${idx}`);
  }, [count, itemH, idPrefix]);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(applyVisuals);
  }, [applyVisuals]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = initIdx * itemH;
    applyVisuals();
  }, [initIdx, itemH, applyVisuals]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const step = (d: number) =>
    scrollRef.current?.scrollBy({ top: d * itemH, behavior: "smooth" });

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
  };

  const mask = `linear-gradient(to bottom,transparent 0%,black ${maskFade[0]}%,black ${maskFade[1]}%,transparent 100%)`;

  return (
    <div className="relative">
      {/* Bouton ▲ */}
      <button
        type="button"
        onClick={() => step(-1)}
        className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10 w-6 h-6 flex items-center justify-center text-zinc-500 opacity-25 hover:opacity-50 transition-opacity"
        aria-label="Valeur précédente"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Container */}
      <div
        className={`relative overflow-hidden ${containerClass ?? ""}`}
        style={{ height: h, ...containerStyle }}
      >
        {/* Indicateur central */}
        <div
          className={`absolute left-0 right-0 z-[2] pointer-events-none ${selectClass ?? ""}`}
          style={{ top: itemH, height: itemH, ...selectStyle }}
        />

        {/* Liste scrollable */}
        <div
          ref={scrollRef}
          role="listbox"
          tabIndex={0}
          aria-label={ariaLabel}
          onScroll={onScroll}
          onKeyDown={onKey}
          className="rm-wheel h-full overflow-y-scroll outline-none"
          style={{
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        >
          <div style={{ height: itemH }} aria-hidden="true" />
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              id={`${idPrefix}-${i}`}
              ref={(el) => { rowRefs.current[i] = el; }}
              role="option"
              aria-selected={i === initIdx}
              className="flex items-center justify-center"
              style={{
                height: itemH,
                scrollSnapAlign: "center",
                transition: "opacity .15s, transform .15s",
                willChange: "opacity, transform",
              }}
            >
              {renderItem(i)}
            </div>
          ))}
          <div style={{ height: itemH }} aria-hidden="true" />
        </div>
      </div>

      {/* Bouton ▼ */}
      <button
        type="button"
        onClick={() => step(1)}
        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-10 w-6 h-6 flex items-center justify-center text-zinc-500 opacity-25 hover:opacity-50 transition-opacity"
        aria-label="Valeur suivante"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

  /* Callbacks stables — pas de re-render des pickers charge/reps */
  const onChargeIdx = useCallback((i: number) => setCharge(i + 5), []);
  const onRepsIdx = useCallback((i: number) => setReps(i + 1), []);

  /* Render functions */
  const renderCharge = useCallback(
    (i: number) => (
      <>
        <span className="font-mono text-[24px] font-medium text-cyan-400">
          {i + 5}
        </span>
        <span className="text-[12px] text-zinc-500 ml-1">kg</span>
      </>
    ),
    [],
  );

  const renderReps = useCallback((i: number) => {
    const v = i + 1;
    return (
      <>
        <span
          className="font-mono text-[24px] font-medium"
          style={{ color: "#FF006E" }}
        >
          {v}
        </span>
        <span className="text-[12px] text-zinc-500 ml-1">
          {v > 1 ? "reps" : "rep"}
        </span>
      </>
    );
  }, []);

  const renderZone = useCallback(
    (i: number) => {
      const r = ZONE_ROWS[i];
      const w = Math.round((avg * r.pct) / 100);
      return (
        <div className="flex items-center justify-between w-full px-5">
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
          <div
            className="shrink-0 pl-3 font-mono text-[24px] font-medium"
            style={{ color: r.color }}
          >
            {w}
            <span className="text-[13px] text-zinc-500 ml-0.5">kg</span>
          </div>
        </div>
      );
    },
    [avg, t],
  );

  return (
    <section className="page">
      {/* Header */}
      <header className="page-header">
        <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("outils.backLabel")}
        </Link>
        <h1>{t("apprendre.calculateur.title")}</h1>
      </header>

      {/* ── Carte combinée — Entrée + Résultat ── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(0,229,255,0.03)",
          border: "1px solid rgba(0,229,255,0.08)",
        }}
      >
        {/* Pickers côte à côte */}
        <div className="flex gap-3">
          {/* Charge picker */}
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[11px] font-medium text-cyan-400 text-center tracking-wide mb-2">
              {t("apprendre.calculateur.chargeLabel").toUpperCase()}
            </div>
            <Wheel
              count={196}
              itemH={50}
              initIdx={55}
              onIdx={onChargeIdx}
              renderItem={renderCharge}
              containerClass="bg-black/[0.04] dark:bg-black/20 rounded-xl"
              containerStyle={{ border: "1px solid rgba(0,229,255,0.1)" }}
              selectStyle={{
                borderTop: "1px solid rgba(0,229,255,0.2)",
                borderBottom: "1px solid rgba(0,229,255,0.2)",
                background: "rgba(0,229,255,0.05)",
              }}
              maskFade={[25, 75]}
              ariaLabel="Sélecteur de charge"
              idPrefix="rm-charge"
            />
          </div>

          {/* × séparateur */}
          <div className="flex items-center pt-[22px]">
            <span className="text-[20px] text-zinc-700 dark:text-zinc-500">×</span>
          </div>

          {/* Reps picker */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="text-[11px] font-medium text-center tracking-wide mb-2"
              style={{ color: "#FF006E" }}
            >
              REPS
            </div>
            <Wheel
              count={30}
              itemH={50}
              initIdx={9}
              onIdx={onRepsIdx}
              renderItem={renderReps}
              containerClass="bg-black/[0.04] dark:bg-black/20 rounded-xl"
              containerStyle={{ border: "1px solid rgba(255,0,110,0.1)" }}
              selectStyle={{
                borderTop: "1px solid rgba(255,0,110,0.2)",
                borderBottom: "1px solid rgba(255,0,110,0.2)",
                background: "rgba(255,0,110,0.05)",
              }}
              maskFade={[25, 75]}
              ariaLabel="Sélecteur de répétitions"
              idPrefix="rm-reps"
            />
          </div>
        </div>

        {/* Résultat 1RM */}
        <div
          className="pt-3 mt-4 text-center border-t border-black/[0.06] dark:border-white/[0.04]"
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
      </div>

      {/* ── Wheel Picker — Zones de travail ── */}
      <div>
        <div className="text-[12px] font-medium text-zinc-400 tracking-wide mb-3 uppercase">
          Choisis ta charge de travail
        </div>
        <Wheel
          count={15}
          itemH={70}
          initIdx={7}
          renderItem={renderZone}
          containerClass="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl"
          selectClass="border-y border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03]"
          maskFade={[30, 70]}
          ariaLabel="Sélecteur de pourcentage de charge"
          idPrefix="rm-zone"
        />
      </div>

      {/* ── Warning sécurité ── */}
      <LearnWarning>
        Le 1RM est une estimation. Ne tente jamais un vrai max sans pareur et
        sans maîtriser la technique.
      </LearnWarning>

      {/* ── Chips de liens ── */}
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
