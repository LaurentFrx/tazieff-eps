"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { computeTotalDuration, type TimerConfig } from "@/hooks/useTimer";

const TimerDisplay = dynamic(() => import("@/components/timer/TimerDisplay"), {
  ssr: false,
});

/* ── Helpers ──────────────────────────────────────────────────────────── */

function fmt(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec ? `${m}min${sec.toString().padStart(2, "0")}` : `${m}min`;
}

function fmtDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s ? `${m}min ${s}s` : `${m}min`;
}

/* ── SVG Icons ────────────────────────────────────────────────────────── */

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CircuitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

/* ── Preset definitions ───────────────────────────────────────────────── */

type PresetKey = "repos" | "emom" | "amrap" | "circuit" | "tabata" | "custom";

interface PresetDef {
  key: PresetKey;
  icon: React.ReactNode;
  gradient: string;
  defaultConfig: TimerConfig;
}

const PRESETS: PresetDef[] = [
  {
    key: "repos",
    icon: <ClockIcon />,
    gradient: "from-green-500/20 to-transparent",
    defaultConfig: { prepareSeconds: 0, workSeconds: 0, restSeconds: 120, rounds: 1, cycles: 1, recoverySeconds: 0, cooldownSeconds: 0 },
  },
  {
    key: "emom",
    icon: <RepeatIcon />,
    gradient: "from-blue-500/20 to-transparent",
    defaultConfig: { prepareSeconds: 5, workSeconds: 60, restSeconds: 0, rounds: 10, cycles: 1, recoverySeconds: 0, cooldownSeconds: 0 },
  },
  {
    key: "amrap",
    icon: <FlameIcon />,
    gradient: "from-orange-500/20 to-transparent",
    defaultConfig: { prepareSeconds: 5, workSeconds: 600, restSeconds: 0, rounds: 1, cycles: 1, recoverySeconds: 0, cooldownSeconds: 0 },
  },
  {
    key: "circuit",
    icon: <CircuitIcon />,
    gradient: "from-purple-500/20 to-transparent",
    defaultConfig: { prepareSeconds: 10, workSeconds: 40, restSeconds: 20, rounds: 6, cycles: 3, recoverySeconds: 60, cooldownSeconds: 0 },
  },
  {
    key: "tabata",
    icon: <ZapIcon />,
    gradient: "from-red-500/20 to-transparent",
    defaultConfig: { prepareSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 8, cycles: 1, recoverySeconds: 0, cooldownSeconds: 0 },
  },
  {
    key: "custom",
    icon: <SlidersIcon />,
    gradient: "from-pink-500/20 to-transparent",
    defaultConfig: { prepareSeconds: 10, workSeconds: 30, restSeconds: 15, rounds: 5, cycles: 1, recoverySeconds: 0, cooldownSeconds: 0 },
  },
];

/* ── Chip selector ────────────────────────────────────────────────────── */

function ChipSelect({
  options,
  value,
  onChange,
  formatLabel,
}: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  formatLabel?: (v: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
            value === v
              ? "bg-pink-500 text-white shadow-md"
              : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-pink-400 hover:text-[color:var(--ink)]"
          }`}
        >
          {formatLabel ? formatLabel(v) : fmt(v)}
        </button>
      ))}
    </div>
  );
}

/* ── Stepper ──────────────────────────────────────────────────────────── */

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[color:var(--muted)] min-w-[90px]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-lg font-bold text-[color:var(--muted)] transition-all hover:border-pink-400 active:scale-95 disabled:opacity-30"
        >
          −
        </button>
        <span className="min-w-[60px] text-center text-xl font-black text-[color:var(--ink)] tabular-nums">
          {format ? format(value) : fmt(value)}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10 text-lg font-bold text-pink-500 transition-all hover:bg-pink-500 hover:text-white active:scale-95 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── Config panel per preset ──────────────────────────────────────────── */

function ConfigPanel({
  presetKey,
  config,
  onChange,
}: {
  presetKey: PresetKey;
  config: TimerConfig;
  onChange: (partial: Partial<TimerConfig>) => void;
}) {
  const { t } = useI18n();

  if (presetKey === "repos") {
    return (
      <ChipSelect
        options={[30, 45, 60, 90, 120, 180]}
        value={config.restSeconds}
        onChange={(v) => onChange({ restSeconds: v })}
      />
    );
  }

  if (presetKey === "emom") {
    return (
      <ChipSelect
        options={[8, 10, 12, 15, 20]}
        value={config.rounds}
        onChange={(v) => onChange({ rounds: v })}
        formatLabel={(v) => `${v} min`}
      />
    );
  }

  if (presetKey === "amrap") {
    return (
      <ChipSelect
        options={[5, 8, 10, 15, 20].map((m) => m * 60)}
        value={config.workSeconds}
        onChange={(v) => onChange({ workSeconds: v })}
        formatLabel={(v) => `${v / 60} min`}
      />
    );
  }

  if (presetKey === "circuit") {
    return (
      <div className="flex flex-col gap-4">
        <ChipSelect
          options={[30, 40, 45, 60]}
          value={config.workSeconds}
          onChange={(v) => onChange({ workSeconds: v })}
        />
        <ChipSelect
          options={[15, 20, 30]}
          value={config.restSeconds}
          onChange={(v) => onChange({ restSeconds: v })}
        />
        <ChipSelect
          options={[4, 5, 6, 7, 8]}
          value={config.rounds}
          onChange={(v) => onChange({ rounds: v })}
          formatLabel={(v) => `${v} ${t("timer.config.stations")}`}
        />
        <ChipSelect
          options={[2, 3, 4]}
          value={config.cycles}
          onChange={(v) => onChange({ cycles: v })}
          formatLabel={(v) => `${v} ${t("timer.config.tours")}`}
        />
      </div>
    );
  }

  if (presetKey === "tabata") {
    return (
      <div className="flex flex-col gap-4">
        <Stepper
          label={t("timer.config.work")}
          value={config.workSeconds}
          onChange={(v) => onChange({ workSeconds: v })}
          min={10}
          max={60}
          step={5}
        />
        <Stepper
          label={t("timer.config.rest")}
          value={config.restSeconds}
          onChange={(v) => onChange({ restSeconds: v })}
          min={5}
          max={30}
          step={5}
        />
        <Stepper
          label={t("timer.config.rounds")}
          value={config.rounds}
          onChange={(v) => onChange({ rounds: v })}
          min={4}
          max={16}
          step={1}
          format={(v) => String(v)}
        />
      </div>
    );
  }

  /* Custom — full config */
  return (
    <div className="flex flex-col gap-4">
      <Stepper
        label={t("timer.config.prepare")}
        value={config.prepareSeconds}
        onChange={(v) => onChange({ prepareSeconds: v })}
        min={0}
        max={30}
        step={5}
      />
      <Stepper
        label={t("timer.config.work")}
        value={config.workSeconds}
        onChange={(v) => onChange({ workSeconds: v })}
        min={5}
        max={300}
        step={5}
      />
      <Stepper
        label={t("timer.config.rest")}
        value={config.restSeconds}
        onChange={(v) => onChange({ restSeconds: v })}
        min={0}
        max={300}
        step={5}
      />
      <Stepper
        label={t("timer.config.rounds")}
        value={config.rounds}
        onChange={(v) => onChange({ rounds: v })}
        min={1}
        max={50}
        step={1}
        format={(v) => String(v)}
      />
      <Stepper
        label={t("timer.config.cycles")}
        value={config.cycles}
        onChange={(v) => onChange({ cycles: v })}
        min={1}
        max={10}
        step={1}
        format={(v) => String(v)}
      />
      {config.cycles > 1 && (
        <Stepper
          label={t("timer.config.recovery")}
          value={config.recoverySeconds}
          onChange={(v) => onChange({ recoverySeconds: v })}
          min={0}
          max={300}
          step={5}
        />
      )}
      <Stepper
        label={t("timer.config.cooldown")}
        value={config.cooldownSeconds}
        onChange={(v) => onChange({ cooldownSeconds: v })}
        min={0}
        max={120}
        step={5}
      />
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

type View = "presets" | "config" | "timer";

export function Timer() {
  const { t } = useI18n();
  const [view, setView] = useState<View>("presets");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);
  const [config, setConfig] = useState<TimerConfig>(PRESETS[0].defaultConfig);

  /* Load saved custom config */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tazieff-timer-custom");
      if (saved) {
        const parsed = JSON.parse(saved) as TimerConfig;
        if (parsed && typeof parsed.workSeconds === "number") {
          // Will be used when custom preset is selected
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleSelectPreset = useCallback((preset: PresetDef) => {
    let cfg = { ...preset.defaultConfig };
    if (preset.key === "custom") {
      try {
        const saved = localStorage.getItem("tazieff-timer-custom");
        if (saved) {
          const parsed = JSON.parse(saved) as TimerConfig;
          if (parsed && typeof parsed.workSeconds === "number") cfg = parsed;
        }
      } catch { /* ignore */ }
    }
    setConfig(cfg);
    setSelectedPreset(preset.key);
    setView("config");
  }, []);

  const handleConfigChange = useCallback((partial: Partial<TimerConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      if (selectedPreset === "custom") {
        try { localStorage.setItem("tazieff-timer-custom", JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  }, [selectedPreset]);

  const handleStart = useCallback(() => {
    setView("timer");
  }, []);

  const handleBackFromTimer = useCallback(() => {
    setView("config");
  }, []);

  const handleBackFromConfig = useCallback(() => {
    setView("presets");
    setSelectedPreset(null);
  }, []);

  const totalDuration = useMemo(() => computeTotalDuration(config), [config]);

  /* ── Timer display (full-screen overlay) ──── */
  if (view === "timer") {
    return <TimerDisplay config={config} onBack={handleBackFromTimer} />;
  }

  /* ── Config panel ──── */
  if (view === "config" && selectedPreset) {
    const preset = PRESETS.find((p) => p.key === selectedPreset)!;
    return (
      <section className="page" style={{ minHeight: "100dvh" }}>
        <header className="page-header">
          <button
            type="button"
            onClick={handleBackFromConfig}
            className="eyebrow hover:text-[color:var(--accent)]"
          >
            ← {t("apprendre.timer.title")}
          </button>
          <h1>{t(`timer.presets.${selectedPreset}.name`)}</h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">
            {t(`timer.presets.${selectedPreset}.desc`)}
          </p>
        </header>

        <div className="card flex flex-col gap-6 py-6">
          <ConfigPanel
            presetKey={selectedPreset}
            config={config}
            onChange={handleConfigChange}
          />

          {/* Estimated duration */}
          <div className="flex items-center justify-between pt-4 border-t border-[color:var(--border)]">
            <span className="text-sm text-[color:var(--muted)]">
              {t("timer.estimatedDuration")}
            </span>
            <span className="text-lg font-black text-[color:var(--ink)] tabular-nums">
              {fmtDuration(totalDuration)}
            </span>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={totalDuration === 0}
            className="min-h-[56px] rounded-2xl bg-pink-500 px-6 py-4 text-xl font-black text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-30 hover:bg-pink-600"
          >
            {t("timer.startButton")}
          </button>
        </div>
      </section>
    );
  }

  /* ── Preset grid ──── */
  return (
    <section className="page" style={{ minHeight: "100dvh" }}>
      <header className="page-header">
        <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
          ← {t("outils.backLabel")}
        </Link>
        <h1>{t("apprendre.timer.title")}</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          {t("timer.selectPreset")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {PRESETS.map((preset) => {
          const dur = computeTotalDuration(preset.defaultConfig);
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`card flex flex-col items-start gap-3 p-4 text-left bg-gradient-to-br ${preset.gradient} transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span className="text-pink-500">{preset.icon}</span>
              <span className="text-base font-black text-[color:var(--ink)]">
                {t(`timer.presets.${preset.key}.name`)}
              </span>
              <span className="text-xs text-[color:var(--muted)] leading-snug line-clamp-2">
                {t(`timer.presets.${preset.key}.desc`)}
              </span>
              <span className="text-xs font-bold text-pink-500 tabular-nums">
                ~{fmtDuration(dur)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
