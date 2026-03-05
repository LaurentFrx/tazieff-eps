"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* ── Types ─────────────────────────────────── */

type Mode = "recup" | "emom" | "amrap";
type Status = "idle" | "running" | "done";

/* ── Utilities ──────────────────────────────── */

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function playBeep(freq: number, dur: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, (dur + 0.5) * 1000);
  } catch { /* AudioContext unavailable */ }
}

function beepDone() {
  playBeep(880, 0.3);
  setTimeout(() => playBeep(660, 0.3), 350);
  setTimeout(() => playBeep(440, 0.6), 700);
  try { if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]); } catch { /* ignore */ }
}

function beepRound() {
  playBeep(660, 0.15);
  setTimeout(() => playBeep(660, 0.15), 220);
  try { if ("vibrate" in navigator) navigator.vibrate(150); } catch { /* ignore */ }
}

/* ── Component ──────────────────────────────── */

export function Timer() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("recup");
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearIv() {
    if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
  }

  /* ── RÉCUPÉRATION ── */
  const [recupSec, setRecupSec] = useState(120);
  const [recupLeft, setRecupLeft] = useState(120);
  const [recupStatus, setRecupStatus] = useState<Status>("idle");

  /* ── EMOM ── */
  const [emomRounds, setEmomRounds] = useState(8);
  const [emomRound, setEmomRound] = useState(1);
  const [emomLeft, setEmomLeft] = useState(60);
  const [emomStatus, setEmomStatus] = useState<Status>("idle");
  const emomRoundsRef = useRef(emomRounds);
  const emomRoundRef = useRef(emomRound);
  useEffect(() => { emomRoundsRef.current = emomRounds; }, [emomRounds]);
  useEffect(() => { emomRoundRef.current = emomRound; }, [emomRound]);

  /* ── AMRAP ── */
  const [amrapMin, setAmrapMin] = useState(10);
  const [amrapLeft, setAmrapLeft] = useState(600);
  const [amrapRounds, setAmrapRounds] = useState(0);
  const [amrapStatus, setAmrapStatus] = useState<Status>("idle");

  /* Reset recup on duration change */
  useEffect(() => {
    setRecupLeft(recupSec);
    setRecupStatus("idle");
  }, [recupSec]);

  /* Reset amrap on duration change */
  useEffect(() => {
    setAmrapLeft(amrapMin * 60);
    setAmrapStatus("idle");
    setAmrapRounds(0);
  }, [amrapMin]);

  /* Pause all on mode switch */
  useEffect(() => {
    clearIv();
    setRecupStatus((s) => (s === "running" ? "idle" : s));
    setEmomStatus((s) => (s === "running" ? "idle" : s));
    setAmrapStatus((s) => (s === "running" ? "idle" : s));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* RÉCUP interval */
  useEffect(() => {
    if (mode !== "recup" || recupStatus !== "running") { clearIv(); return; }
    ivRef.current = setInterval(() => {
      setRecupLeft((p) => {
        if (p <= 1) { clearIv(); setRecupStatus("done"); beepDone(); return 0; }
        return p - 1;
      });
    }, 1000);
    return clearIv;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, recupStatus]);

  /* EMOM interval */
  useEffect(() => {
    if (mode !== "emom" || emomStatus !== "running") { clearIv(); return; }
    ivRef.current = setInterval(() => {
      setEmomLeft((p) => {
        if (p <= 1) {
          const next = emomRoundRef.current + 1;
          if (next > emomRoundsRef.current) {
            clearIv(); setEmomStatus("done"); beepDone();
          } else {
            setEmomRound(next); beepRound();
          }
          return 60;
        }
        return p - 1;
      });
    }, 1000);
    return clearIv;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, emomStatus]);

  /* AMRAP interval */
  useEffect(() => {
    if (mode !== "amrap" || amrapStatus !== "running") { clearIv(); return; }
    ivRef.current = setInterval(() => {
      setAmrapLeft((p) => {
        if (p <= 1) { clearIv(); setAmrapStatus("done"); beepDone(); return 0; }
        return p - 1;
      });
    }, 1000);
    return clearIv;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, amrapStatus]);

  /* Background */
  const status: Status =
    mode === "recup" ? recupStatus :
    mode === "emom" ? emomStatus :
    amrapStatus;

  const bg =
    status === "done" ? "rgba(239,68,68,0.10)" :
    status === "running" ? "rgba(34,197,94,0.10)" :
    "rgba(59,130,246,0.05)";

  const timeColor =
    status === "done" ? "#ef4444" :
    status === "running" ? "#16a34a" :
    "var(--ink)";

  /* Button classes */
  const btnPrimary =
    "min-h-[60px] flex-1 rounded-xl px-6 py-3 text-xl font-bold text-white transition-opacity active:opacity-75 disabled:opacity-30 bg-[color:var(--accent)]";
  const btnSecondary =
    "min-h-[60px] rounded-xl border border-[color:var(--border)] px-6 py-3 text-xl font-semibold text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)] active:opacity-75";

  /* Mode labels */
  const modeLabels: Record<Mode, string> = {
    recup: t("apprendre.timer.modeRecup"),
    emom: t("apprendre.timer.modeEmom"),
    amrap: t("apprendre.timer.modeAmrap"),
  };

  return (
    <section
      className="page"
      style={{ background: bg, transition: "background 0.6s ease", minHeight: "100dvh" }}
    >
      <header className="page-header">
        <Link href="/apprendre" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("apprendre.backLabel")}
        </Link>
        <h1>{t("apprendre.timer.title")}</h1>
      </header>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["recup", "emom", "amrap"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg border py-3 text-sm font-bold transition-colors ${
              mode === m
                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                : "border-[color:var(--border)] text-[color:var(--muted)]"
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* ── RÉCUPÉRATION ── */}
      {mode === "recup" && (
        <div className="card flex flex-col items-center gap-6 py-8">
          {/* Quick presets */}
          <div className="flex flex-wrap justify-center gap-2">
            {[30, 60, 90, 120, 180].map((s) => (
              <button
                key={s}
                type="button"
                disabled={recupStatus === "running"}
                onClick={() => setRecupSec(s)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-40 ${
                  recupSec === s
                    ? "border-[color:var(--accent)] text-[color:var(--accent)]"
                    : "border-[color:var(--border)] text-[color:var(--muted)]"
                }`}
              >
                {s < 60 ? `${s}s` : `${s / 60}min`}
              </button>
            ))}
          </div>

          {/* Time display */}
          <span
            className="font-mono text-8xl font-black tabular-nums leading-none"
            style={{ color: timeColor }}
          >
            {fmt(recupLeft)}
          </span>

          {recupStatus === "done" && (
            <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
              {t("apprendre.timer.done")}
            </p>
          )}

          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled={recupStatus === "done"}
              onClick={() => setRecupStatus((s) => (s === "running" ? "idle" : "running"))}
              className={btnPrimary}
            >
              {recupStatus === "running" ? t("methodes.timer.pause") : t("methodes.timer.start")}
            </button>
            <button
              type="button"
              onClick={() => { setRecupLeft(recupSec); setRecupStatus("idle"); }}
              className={btnSecondary}
            >
              {t("methodes.timer.reset")}
            </button>
          </div>
        </div>
      )}

      {/* ── EMOM ── */}
      {mode === "emom" && (
        <div className="card flex flex-col items-center gap-6 py-8">
          {/* Rounds config */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[color:var(--muted)]">
              {t("apprendre.timer.rounds")}
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={emomRounds}
              disabled={emomStatus === "running"}
              onChange={(e) => {
                const v = Math.max(1, Math.min(30, Number(e.target.value)));
                setEmomRounds(v);
                setEmomRound(1);
                setEmomLeft(60);
                setEmomStatus("idle");
              }}
              className="w-16 rounded-lg border border-[color:var(--border)] bg-transparent px-2 py-1 text-center text-xl font-bold text-[color:var(--ink)] disabled:opacity-40"
            />
          </div>

          {/* Round indicator */}
          <p className="text-sm font-semibold text-[color:var(--muted)]">
            {t("apprendre.timer.roundOf")} {emomRound} / {emomRounds}
          </p>

          {/* Time in minute */}
          <span
            className="font-mono text-8xl font-black tabular-nums leading-none"
            style={{ color: timeColor }}
          >
            {fmt(emomLeft)}
          </span>

          {emomStatus === "done" && (
            <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
              {t("apprendre.timer.done")}
            </p>
          )}

          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled={emomStatus === "done"}
              onClick={() => {
                if (emomStatus === "idle") beepRound();
                setEmomStatus((s) => (s === "running" ? "idle" : "running"));
              }}
              className={btnPrimary}
            >
              {emomStatus === "running" ? t("methodes.timer.pause") : t("methodes.timer.start")}
            </button>
            <button
              type="button"
              onClick={() => { setEmomRound(1); setEmomLeft(60); setEmomStatus("idle"); }}
              className={btnSecondary}
            >
              {t("methodes.timer.reset")}
            </button>
          </div>
        </div>
      )}

      {/* ── AMRAP ── */}
      {mode === "amrap" && (
        <div className="card flex flex-col items-center gap-6 py-8">
          {/* Duration config */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[color:var(--muted)]">
              {t("apprendre.timer.duration")}
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={amrapMin}
              disabled={amrapStatus === "running"}
              onChange={(e) => setAmrapMin(Math.max(1, Math.min(60, Number(e.target.value))))}
              className="w-16 rounded-lg border border-[color:var(--border)] bg-transparent px-2 py-1 text-center text-xl font-bold text-[color:var(--ink)] disabled:opacity-40"
            />
            <span className="text-sm text-[color:var(--muted)]">min</span>
          </div>

          {/* Time remaining */}
          <span
            className="font-mono text-8xl font-black tabular-nums leading-none"
            style={{ color: timeColor }}
          >
            {fmt(amrapLeft)}
          </span>

          {/* Round counter */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-[color:var(--muted)]">
              {t("apprendre.timer.roundsDone")}
            </p>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setAmrapRounds((r) => Math.max(0, r - 1))}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--border)] text-2xl font-bold text-[color:var(--muted)] active:opacity-60"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center text-5xl font-black text-[color:var(--ink)] tabular-nums">
                {amrapRounds}
              </span>
              <button
                type="button"
                onClick={() => setAmrapRounds((r) => r + 1)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-2xl font-bold text-[color:var(--accent)] active:opacity-60"
              >
                +
              </button>
            </div>
          </div>

          {amrapStatus === "done" && (
            <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
              {t("apprendre.timer.done")}
            </p>
          )}

          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled={amrapStatus === "done"}
              onClick={() => setAmrapStatus((s) => (s === "running" ? "idle" : "running"))}
              className={btnPrimary}
            >
              {amrapStatus === "running" ? t("methodes.timer.pause") : t("methodes.timer.start")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAmrapLeft(amrapMin * 60);
                setAmrapStatus("idle");
                setAmrapRounds(0);
              }}
              className={btnSecondary}
            >
              {t("methodes.timer.reset")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
