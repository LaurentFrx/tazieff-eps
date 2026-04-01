"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { epley, brzycki } from "@/lib/rm";

/* ─── Zone data — fourchettes NSCA unifiées ─── */

const ZONE_ROWS = [
  { pct: 100, label: "Force maximale — 1 rep",          color: "#f87171" },
  { pct: 95,  label: "Force — 1 à 3 reps",              color: "#f87171" },
  { pct: 90,  label: "Force — 2 à 4 reps",              color: "#f87171" },
  { pct: 85,  label: "Force — 4 à 6 reps",              color: "#f87171" },
  { pct: 80,  label: "Hypertrophie — 6 à 8 reps",       color: "#60a5fa" },
  { pct: 75,  label: "Hypertrophie — 8 à 10 reps",      color: "#60a5fa" },
  { pct: 70,  label: "Hypertrophie — 10 à 12 reps",     color: "#60a5fa" },
  { pct: 65,  label: "Endurance — 12 à 15 reps",        color: "#4ade80" },
  { pct: 60,  label: "Endurance — 15 à 20 reps",        color: "#4ade80" },
  { pct: 55,  label: "Endurance — 20 à 25 reps",        color: "#4ade80" },
  { pct: 50,  label: "Endurance légère — 25+ reps",     color: "#fb923c" },
  { pct: 45,  label: "Endurance légère — 28+ reps",     color: "#fb923c" },
  { pct: 40,  label: "Explosif / Vitesse",               color: "#a78bfa" },
  { pct: 35,  label: "Explosif / Vitesse",               color: "#a78bfa" },
  { pct: 30,  label: "Explosif / Vitesse",               color: "#a78bfa" },
] as const;

const PICKER_ITEM_H = 50;
const PICKER_H = PICKER_ITEM_H * 3;
const ZONE_ITEM_H = 70;

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
      <button
        type="button"
        onClick={() => step(-1)}
        className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-11 h-11 flex items-center justify-center text-zinc-400 opacity-40 hover:opacity-70 active:opacity-100 transition-opacity"
        aria-label="Valeur précédente"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <div
        className={`relative overflow-hidden ${containerClass ?? ""}`}
        style={{ height: h, ...containerStyle }}
      >
        <div
          className={`absolute left-0 right-0 z-[2] pointer-events-none ${selectClass ?? ""}`}
          style={{ top: itemH, height: itemH, ...selectStyle }}
        />

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

      <button
        type="button"
        onClick={() => step(1)}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 w-11 h-11 flex items-center justify-center text-zinc-400 opacity-40 hover:opacity-70 active:opacity-100 transition-opacity"
        aria-label="Valeur suivante"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

  /* Render — charge (24px → 28px bold blanc quand actif via CSS) */
  const renderCharge = useCallback(
    (i: number) => (
      <>
        <span className="rm-val rm-val-sm font-mono text-[24px] font-medium text-cyan-400">
          {i + 5}
        </span>
      </>
    ),
    [],
  );

  /* Render — reps */
  const renderReps = useCallback((i: number) => {
    const v = i + 1;
    return (
      <>
        <span
          className="rm-val rm-val-sm font-mono text-[24px] font-medium"
          style={{ color: "#FF006E" }}
        >
          {v}
        </span>
      </>
    );
  }, []);

  /* Render — zone : label NSCA unifié (plus de doublon ~reps) */
  const renderZone = useCallback(
    (i: number) => {
      const r = ZONE_ROWS[i];
      const w = Math.round((avg * r.pct) / 100);
      return (
        <div className="flex items-center justify-between w-full px-5">
          <div className="min-w-0">
            <span
              className="rm-val rm-val-lg font-mono text-[28px] font-medium"
              style={{ color: r.color }}
            >
              {r.pct}%
            </span>
            <div
              className="text-[12px] font-medium truncate mt-0.5"
              style={{ color: r.color }}
            >
              {r.label}
            </div>
          </div>
          <div className="shrink-0 pl-3 text-right">
            <span
              className="rm-val-sm font-mono text-[24px] font-medium"
              style={{ color: r.color }}
            >
              {w}
            </span>
            <span className="text-[13px] text-zinc-400 ml-0.5">kg</span>
          </div>
        </div>
      );
    },
    [avg],
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

      {/* ── Carte combinée — Charge × Reps = 1RM ── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(0,229,255,0.06)",
          border: "1px solid rgba(0,229,255,0.15)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex gap-2 items-start">
          {/* Col 1 — Charge picker */}
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <div
              className="text-[11px] font-medium text-cyan-400 text-center tracking-wide mb-2 rounded-md px-2 py-0.5"
              style={{ background: "rgba(0,229,255,0.08)" }}
            >
              {t("apprendre.calculateur.chargeLabel").toUpperCase()}
            </div>
            <Wheel
              count={196}
              itemH={PICKER_ITEM_H}
              initIdx={55}
              onIdx={onChargeIdx}
              renderItem={renderCharge}
              containerClass="rounded-xl"
              containerStyle={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              selectStyle={{
                borderTop: "1.5px solid rgba(0,229,255,0.4)",
                borderBottom: "1.5px solid rgba(0,229,255,0.4)",
                background: "rgba(0,229,255,0.15)",
              }}
              maskFade={[25, 75]}
              ariaLabel="Sélecteur de charge"
              idPrefix="rm-charge"
            />
          </div>

          {/* × */}
          <div className="flex flex-col items-center">
            <div className="text-[11px] tracking-wide mb-2 opacity-0 select-none" aria-hidden="true">&nbsp;</div>
            <div className="flex items-center" style={{ height: PICKER_H }}>
              <span className="text-[18px] text-zinc-600">×</span>
            </div>
          </div>

          {/* Col 2 — Reps picker */}
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <div
              className="text-[11px] font-medium text-center tracking-wide mb-2 rounded-md px-2 py-0.5"
              style={{ color: "#FF006E", background: "rgba(255,0,110,0.08)" }}
            >
              REPS
            </div>
            <Wheel
              count={30}
              itemH={PICKER_ITEM_H}
              initIdx={9}
              onIdx={onRepsIdx}
              renderItem={renderReps}
              containerClass="rounded-xl"
              containerStyle={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              selectStyle={{
                borderTop: "1.5px solid rgba(255,0,110,0.4)",
                borderBottom: "1.5px solid rgba(255,0,110,0.4)",
                background: "rgba(255,0,110,0.15)",
              }}
              maskFade={[25, 75]}
              ariaLabel="Sélecteur de répétitions"
              idPrefix="rm-reps"
            />
          </div>

          {/* = */}
          <div className="flex flex-col items-center">
            <div className="text-[11px] tracking-wide mb-2 opacity-0 select-none" aria-hidden="true">&nbsp;</div>
            <div className="flex items-center" style={{ height: PICKER_H }}>
              <span className="text-[18px] text-zinc-600">=</span>
            </div>
          </div>

          {/* Col 3 — Résultat 1RM */}
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <div
              className="text-[11px] font-medium text-zinc-300 text-center tracking-wide mb-2 rounded-md px-2 py-0.5"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              1RM
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-xl w-full"
              style={{ height: PICKER_H }}
            >
              <div className="font-mono text-[40px] font-bold text-zinc-900 dark:text-white leading-none">
                {avg}
              </div>
              <div className="text-[16px] text-zinc-900/60 dark:text-white/60 mt-0.5">
                kg
              </div>
              <div className="mt-2 text-[11px] text-zinc-400 text-center leading-relaxed">
                <div>Epley {ep}</div>
                <div>Brzycki {br}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Wheel Picker — Zones de travail ── */}
      <div>
        <div className="text-[12px] font-medium text-zinc-300 tracking-wide mb-3 uppercase">
          Choisis ta charge de travail
        </div>
        <Wheel
          count={15}
          itemH={ZONE_ITEM_H}
          initIdx={7}
          renderItem={renderZone}
          containerClass="rounded-2xl"
          containerStyle={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          selectStyle={{
            borderTop: "1.5px solid rgba(255,255,255,0.2)",
            borderBottom: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
          }}
          maskFade={[30, 70]}
          ariaLabel="Sélecteur de pourcentage de charge"
          idPrefix="rm-zone"
        />
      </div>

      {/* ── Warning sécurité (version lumineuse) ── */}
      <div
        className="flex gap-[10px] items-start rounded-[10px] p-[10px_12px]"
        style={{
          background: "rgba(255,160,0,0.1)",
          border: "1px solid rgba(255,160,0,0.2)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffaa00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 mt-px"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="text-[11px] leading-snug" style={{ color: "#eeb850" }}>
          Le 1RM est une estimation. Ne tente jamais un vrai max sans pareur et
          sans maîtriser la technique.
        </p>
      </div>

      {/* ── Chips de liens ── */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/apprendre/rm-rir-rpe"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          style={{
            background: "rgba(0,229,255,0.12)",
            border: "1px solid rgba(0,229,255,0.25)",
            color: "#33eeff",
          }}
        >
          RM, RIR et RPE →
        </Link>
        <Link
          href="/apprendre/connaissances"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
          style={{
            background: "rgba(167,139,250,0.12)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: "#b8a4fb",
          }}
        >
          Connaissances →
        </Link>
      </div>
    </section>
  );
}
