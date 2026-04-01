"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { epley, brzycki } from "@/lib/rm";

/* ─── Zone data — fourchettes NSCA unifiées ─── */

const ZONE_ROWS = [
  { pct: 100, label: "Force maximale — 1 rep",      color: "#f87171" },
  { pct: 95,  label: "Force — 1 à 3 reps",          color: "#f87171" },
  { pct: 90,  label: "Force — 2 à 4 reps",          color: "#f87171" },
  { pct: 85,  label: "Force — 4 à 6 reps",          color: "#f87171" },
  { pct: 80,  label: "Hypertrophie — 6 à 8 reps",   color: "#60a5fa" },
  { pct: 75,  label: "Hypertrophie — 8 à 10 reps",  color: "#60a5fa" },
  { pct: 70,  label: "Hypertrophie — 10 à 12 reps", color: "#60a5fa" },
  { pct: 65,  label: "Endurance — 12 à 15 reps",    color: "#4ade80" },
  { pct: 60,  label: "Endurance — 15 à 20 reps",    color: "#4ade80" },
  { pct: 55,  label: "Endurance — 20 à 25 reps",    color: "#4ade80" },
  { pct: 50,  label: "Endurance légère — 25+ reps",  color: "#fb923c" },
  { pct: 45,  label: "Endurance légère — 28+ reps",  color: "#fb923c" },
  { pct: 40,  label: "Explosif / Vitesse",           color: "#a78bfa" },
  { pct: 35,  label: "Explosif / Vitesse",           color: "#a78bfa" },
  { pct: 30,  label: "Explosif / Vitesse",           color: "#a78bfa" },
] as const;

const PK_H = 44; // item height charge/reps
const ZN_H = 70; // item height zones

/* ─── Helpers ─── */

function calc1RM(charge: number, reps: number) {
  if (reps === 1) return { avg: charge, ep: charge, br: charge };
  const ep = epley(charge, reps);
  const br = reps >= 37 ? ep : brzycki(charge, reps);
  return { avg: Math.round((ep + br) / 2), ep, br };
}

/* ─── Generic Wheel Picker ─── */

function Wheel({
  count, itemH, initIdx, onIdx, renderItem,
  containerClass, containerStyle, selectClass, selectStyle,
  maskFade, ariaLabel, idPrefix,
}: {
  count: number; itemH: number; initIdx: number;
  onIdx?: (i: number) => void;
  renderItem: (i: number) => React.ReactNode;
  containerClass?: string; containerStyle?: React.CSSProperties;
  selectClass?: string; selectStyle?: React.CSSProperties;
  maskFade: [number, number]; ariaLabel: string; idPrefix: string;
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
        op = 1; sc = 1;
      } else if (d < itemH * 1.6) {
        const p = (d - itemH * 0.6) / itemH;
        op = 1 - p * 0.7; sc = 1 - p * 0.1;
      } else {
        op = 0.1; sc = 0.85;
      }
      row.style.opacity = String(op);
      row.style.transform = `scale(${sc})`;
      row.setAttribute("aria-selected", String(i === idx));
      row.classList.toggle("rm-active", i === idx);
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

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  const step = (d: number) =>
    scrollRef.current?.scrollBy({ top: d * itemH, behavior: "smooth" });

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
  };

  const mask = `linear-gradient(to bottom,transparent 0%,black ${maskFade[0]}%,black ${maskFade[1]}%,transparent 100%)`;

  return (
    <div className="relative">
      <button type="button" onClick={() => step(-1)}
        className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10 w-8 h-8 flex items-center justify-center opacity-25 hover:opacity-50 active:opacity-80 transition-opacity"
        aria-label="Valeur précédente">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <div className={`relative overflow-hidden ${containerClass ?? ""}`}
        style={{ height: h, ...containerStyle }}>
        <div className={`absolute left-0 right-0 z-[2] pointer-events-none ${selectClass ?? ""}`}
          style={{ top: itemH, height: itemH, ...selectStyle }} />
        <div ref={scrollRef} role="listbox" tabIndex={0} aria-label={ariaLabel}
          onScroll={onScroll} onKeyDown={onKey}
          className="rm-wheel h-full overflow-y-scroll outline-none"
          style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none", maskImage: mask, WebkitMaskImage: mask }}>
          <div style={{ height: itemH }} aria-hidden="true" />
          {Array.from({ length: count }, (_, i) => (
            <div key={i} id={`${idPrefix}-${i}`}
              ref={(el) => { rowRefs.current[i] = el; }}
              role="option" aria-selected={i === initIdx}
              className="flex items-center justify-center"
              style={{ height: itemH, scrollSnapAlign: "center",
                transition: "opacity .12s, transform .12s", willChange: "opacity, transform" }}>
              {renderItem(i)}
            </div>
          ))}
          <div style={{ height: itemH }} aria-hidden="true" />
        </div>
      </div>

      <button type="button" onClick={() => step(1)}
        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-10 w-8 h-8 flex items-center justify-center opacity-25 hover:opacity-50 active:opacity-80 transition-opacity"
        aria-label="Valeur suivante">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
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

  const onChargeIdx = useCallback((i: number) => setCharge(i + 5), []);
  const onRepsIdx = useCallback((i: number) => setReps(i + 1), []);

  const renderCharge = useCallback(
    (i: number) => (
      <>
        <span className="rm-val rm-val-sm font-mono text-[22px] font-medium text-cyan-400">{i + 5}</span>
        <span className="rm-unit font-mono text-[13px] ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>kg</span>
      </>
    ), [],
  );

  const renderReps = useCallback((i: number) => (
    <span className="rm-val rm-val-sm font-mono text-[22px] font-medium" style={{ color: "#FF006E" }}>
      {i + 1}
    </span>
  ), []);

  const renderZone = useCallback(
    (i: number) => {
      const r = ZONE_ROWS[i];
      const w = Math.round((avg * r.pct) / 100);
      return (
        <div className="flex items-center justify-between w-full px-5">
          <div className="min-w-0">
            <span className="rm-val rm-val-lg font-mono text-[26px] font-medium" style={{ color: r.color }}>
              {r.pct}%
            </span>
            <div className="rm-lbl text-[13px] font-medium truncate mt-0.5" style={{ color: r.color }}>
              {r.label}
            </div>
          </div>
          <div className="shrink-0 pl-3 text-right">
            <span className="rm-wt font-mono text-[22px] font-medium" style={{ color: r.color }}>
              {w}
            </span>
            <span className="text-[12px] ml-0.5" style={{ color: r.color, opacity: 0.6 }}>kg</span>
          </div>
        </div>
      );
    }, [avg],
  );

  return (
    <section className="page">
      <header className="page-header">
        <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("outils.backLabel")}
        </Link>
        <h1>{t("apprendre.calculateur.title")}</h1>
      </header>

      {/* ── Section 1 — Carte d'entrée ── */}
      <div
        className="rounded-2xl p-5 bg-black/[0.03] dark:bg-white/[0.04]"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="grid items-start"
          style={{ gridTemplateColumns: "1fr auto 1fr auto 1fr" }}
        >
          {/* Row 1 — Labels */}
          <div className="text-[11px] font-semibold tracking-wider text-center mb-2" style={{ color: "#00E5FF" }}>
            {t("apprendre.calculateur.chargeLabel").toUpperCase()}
          </div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center mb-2" style={{ color: "#FF006E" }}>
            REPS
          </div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            1RM
          </div>

          {/* Row 2 — Pickers + result */}
          <Wheel
            count={196} itemH={PK_H} initIdx={55}
            onIdx={onChargeIdx} renderItem={renderCharge}
            containerClass="rounded-xl"
            selectClass="rounded-lg"
            selectStyle={{
              borderTop: "1px solid rgba(0,229,255,0.25)",
              borderBottom: "1px solid rgba(0,229,255,0.25)",
              background: "rgba(0,229,255,0.08)",
            }}
            maskFade={[20, 80]} ariaLabel="Sélecteur de charge" idPrefix="rm-charge"
          />

          <div className="self-center text-[16px] text-zinc-500 px-1">×</div>

          <Wheel
            count={30} itemH={PK_H} initIdx={9}
            onIdx={onRepsIdx} renderItem={renderReps}
            containerClass="rounded-xl"
            selectClass="rounded-lg"
            selectStyle={{
              borderTop: "1px solid rgba(255,0,110,0.25)",
              borderBottom: "1px solid rgba(255,0,110,0.25)",
              background: "rgba(255,0,110,0.08)",
            }}
            maskFade={[20, 80]} ariaLabel="Sélecteur de répétitions" idPrefix="rm-reps"
          />

          <div className="self-center text-[16px] text-zinc-500 px-1">=</div>

          {/* Résultat 1RM */}
          <div className="flex flex-col items-center justify-center" style={{ height: PK_H * 3 }}>
            <div className="font-mono text-[42px] font-bold text-zinc-900 dark:text-white leading-none">
              {avg}
            </div>
            <div className="text-[15px] -mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              kg
            </div>
            <div className="my-2 mx-auto" style={{ height: 1, width: "60%", background: "rgba(255,255,255,0.06)" }} />
            <div className="text-[11px] text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              <div>Epley {ep}</div>
              <div>Brzycki {br}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2 — Zones de travail ── */}
      <div>
        <div className="text-[12px] font-semibold text-zinc-300 tracking-wider mb-3 uppercase">
          Choisis ta charge de travail
        </div>
        <Wheel
          count={15} itemH={ZN_H} initIdx={7}
          renderItem={renderZone}
          containerClass="rounded-2xl"
          containerStyle={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          selectStyle={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
          }}
          maskFade={[25, 75]} ariaLabel="Sélecteur de pourcentage de charge" idPrefix="rm-zone"
        />
      </div>

      {/* ── Section 3 — Warning ── */}
      <div
        className="flex gap-2.5 items-start rounded-xl p-3"
        style={{ background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.18)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eeb850"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="text-[12px] leading-relaxed" style={{ color: "#eeb850" }}>
          Le 1RM est une estimation. Ne tente jamais un vrai max sans pareur et sans maîtriser la technique.
        </p>
      </div>

      {/* ── Section 4 — Chips ── */}
      <div className="flex flex-wrap gap-2">
        <Link href="/apprendre/rm-rir-rpe"
          className="inline-flex items-center rounded-full px-4 py-2 text-[12px] font-medium transition-colors"
          style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", color: "#00E5FF" }}>
          RM, RIR et RPE →
        </Link>
        <Link href="/apprendre/connaissances"
          className="inline-flex items-center rounded-full px-4 py-2 text-[12px] font-medium transition-colors"
          style={{ background: "rgba(123,47,255,0.1)", border: "1px solid rgba(123,47,255,0.2)", color: "#a070ff" }}>
          Connaissances →
        </Link>
      </div>
    </section>
  );
}
