'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { LocaleLink as Link } from '@/components/LocaleLink';

// ---------- Preset definitions ----------

interface PresetDef {
  id: string;
  name: string;
  description: string;
  color: string;
  gradient: string;
  subtitle: string;
  detail: string;
  preset: TimerPreset;
}

const PRESETS: PresetDef[] = [
  {
    id: 'tabata',
    name: 'TABATA',
    description: '20s travail / 10s repos × 8',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a, #22c55e)',
    subtitle: '20s effort / 10s repos',
    detail: '8 rounds — 4 min',
    preset: {
      name: 'TABATA',
      prepareDuration: 10,
      workDuration: 20,
      restDuration: 10,
      rounds: 8,
      cycles: 1,
      recoveryDuration: 0,
      cooldownDuration: 0,
    },
  },
  {
    id: 'emom',
    name: 'EMOM',
    description: '1 minute × 10 rounds',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    subtitle: '1 exo par minute',
    detail: 'Chaque minute, top départ',
    preset: {
      name: 'EMOM',
      prepareDuration: 10,
      workDuration: 60,
      restDuration: 0,
      rounds: 10,
      cycles: 1,
      recoveryDuration: 0,
      cooldownDuration: 0,
    },
  },
  {
    id: 'circuit',
    name: 'CIRCUIT',
    description: '40s travail / 20s repos × 6',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #ea580c, #f97316)',
    subtitle: 'Travail / repos par station',
    detail: 'Enchaînement continu',
    preset: {
      name: 'CIRCUIT',
      prepareDuration: 10,
      workDuration: 40,
      restDuration: 20,
      rounds: 6,
      cycles: 1,
      recoveryDuration: 0,
      cooldownDuration: 60,
    },
  },
  {
    id: 'amrap',
    name: 'AMRAP',
    description: '12 minutes en continu',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    subtitle: 'Max reps en temps limité',
    detail: 'Intensité maximale',
    preset: {
      name: 'AMRAP',
      prepareDuration: 10,
      workDuration: 720,
      restDuration: 0,
      rounds: 1,
      cycles: 1,
      recoveryDuration: 0,
      cooldownDuration: 0,
    },
  },
  {
    id: 'repos',
    name: 'REPOS',
    description: '2 min repos entre séries',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    subtitle: 'Chrono entre séries',
    detail: '30s — 1min — 2min — 5min',
    preset: {
      name: 'REPOS',
      prepareDuration: 5,
      workDuration: 120,
      restDuration: 0,
      rounds: 1,
      cycles: 1,
      recoveryDuration: 0,
      cooldownDuration: 0,
    },
  },
  {
    id: 'custom',
    name: 'PERSONNALISÉ',
    description: 'Configurez vos propres temps',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    subtitle: 'Configure ton chrono',
    detail: 'Durées personnalisées',
    preset: {
      name: 'PERSONNALISÉ',
      prepareDuration: 10,
      workDuration: 30,
      restDuration: 15,
      rounds: 5,
      cycles: 2,
      recoveryDuration: 60,
      cooldownDuration: 30,
    },
  },
];

const PRESET_ICONS: Record<string, React.ReactNode> = {
  tabata: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  emom: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M5 3v18M19 3v18M5 12h14M5 7h14M5 17h14"/>
    </svg>
  ),
  circuit: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  amrap: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  repos: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <path d="M18.36 5.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
    </svg>
  ),
  custom: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3.5 right-3.5 pointer-events-none">
      <circle cx="12" cy="12" r="3"/><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    </svg>
  ),
};

// ---------- Number input ----------

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function NumberField({ label, value, onChange, min = 0, max = 999, step = 1, unit = 's' }: NumberFieldProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
      <span style={{ color: '#ccc', fontSize: '14px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          −
        </button>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: '48px', textAlign: 'center', fontFamily: "ui-monospace, 'Courier New', monospace" }}>
          {value}{unit}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function TimerPage() {
  const { t } = useI18n();
  const [selectedPreset, setSelectedPreset] = useState<PresetDef | null>(null);
  const [customPreset, setCustomPreset] = useState<TimerPreset | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  // Active preset (custom overrides selected)
  const activePreset = useMemo(() => {
    if (!selectedPreset) return null;
    return customPreset || selectedPreset.preset;
  }, [selectedPreset, customPreset]);

  const handleSelectPreset = (def: PresetDef) => {
    setSelectedPreset(def);
    setCustomPreset({ ...def.preset });
  };

  const handleStartTimer = () => {
    unlockAudio();
    setShowTimer(true);
  };

  const handleBackToPresets = useCallback(() => {
    setShowTimer(false);
    setSelectedPreset(null);
    setCustomPreset(null);
  }, []);

  // Preset selection screen
  if (!selectedPreset) {
    return (
      <section className="page">
        <header className="page-header">
          <Link href="/outils" className="eyebrow hover:text-[color:var(--accent)]">
            ← {t('outils.backLabel')}
          </Link>
          <h1>{t('timer.pageTitle')}</h1>
          <p className="text-[14px] text-zinc-500 dark:text-zinc-400">{t('timer.pageSubtitle')}</p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((def) => (
            <button
              key={def.id}
              onClick={() => handleSelectPreset(def)}
              className="relative overflow-hidden rounded-2xl text-left cursor-pointer flex flex-col justify-end transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: def.gradient,
                padding: '20px 16px',
                minHeight: '120px',
                border: 'none',
              }}
            >
              {PRESET_ICONS[def.id]}
              <span className="text-[18px] font-bold text-white" style={{ letterSpacing: '0.03em' }}>
                {t(`timer.presets.${def.id}.name`)}
              </span>
              <span className="text-[12px] text-white/70 mt-1">
                {def.subtitle}
              </span>
              <span className="text-[11px] text-white/45 mt-0.5">
                {def.detail}
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Config screen
  if (!showTimer && customPreset) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100dvh', padding: '20px 16px 100px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <button
            onClick={() => { setSelectedPreset(null); setCustomPreset(null); }}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: '4px 0' }}
          >
            ← {t('timer.done.backToPresets')}
          </button>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: selectedPreset.color, marginRight: '10px' }} />
            {t(`timer.presets.${selectedPreset.id}.name`)}
          </h2>

          <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #222', padding: '4px 16px', marginBottom: '24px' }}>
            <NumberField
              label={t('timer.config.prepare')}
              value={customPreset.prepareDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, prepareDuration: v })}
              step={5}
            />
            <NumberField
              label={t('timer.config.work')}
              value={customPreset.workDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, workDuration: v })}
              step={5}
            />
            <NumberField
              label={t('timer.config.rest')}
              value={customPreset.restDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, restDuration: v })}
              step={5}
            />
            <NumberField
              label={t('timer.config.rounds')}
              value={customPreset.rounds}
              onChange={(v) => setCustomPreset({ ...customPreset, rounds: v })}
              min={1}
              max={50}
              unit=""
            />
            <NumberField
              label={t('timer.config.cycles')}
              value={customPreset.cycles}
              onChange={(v) => setCustomPreset({ ...customPreset, cycles: v })}
              min={1}
              max={20}
              unit=""
            />
            {customPreset.cycles > 1 && (
              <NumberField
                label={t('timer.config.recovery')}
                value={customPreset.recoveryDuration}
                onChange={(v) => setCustomPreset({ ...customPreset, recoveryDuration: v })}
                step={10}
              />
            )}
            <NumberField
              label={t('timer.config.cooldown')}
              value={customPreset.cooldownDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, cooldownDuration: v })}
              step={10}
            />
          </div>

          <button
            onClick={handleStartTimer}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(180deg, #e0e0e0, #b0b0b0, #808080)',
              color: '#000',
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {t('timer.controls.start')}
          </button>
        </div>
      </div>
    );
  }

  // Timer view
  if (showTimer && activePreset) {
    return (
      <TimerRunner
        preset={activePreset}
        presetName={t(`timer.presets.${selectedPreset.id}.name`)}
        onBackToPresets={handleBackToPresets}
      />
    );
  }

  return null;
}

// ---------- Timer Runner (uses the hook) ----------

interface TimerRunnerProps {
  preset: TimerPreset;
  presetName: string;
  onBackToPresets: () => void;
}

function TimerRunner({ preset, presetName, onBackToPresets }: TimerRunnerProps) {
  const callbacks = useMemo(
    () => ({
      onPhaseChange: (phase: { type: string }) => {
        hapticFeedback('heavy');
        playTransitionBeep();

        if (phase.type === 'prepare') speakEvent('prepare');
        else if (phase.type === 'work') speakEvent('work_start');
        else if (phase.type === 'rest' || phase.type === 'recovery') speakEvent('rest_start');
      },
      onTick: (secondsLeft: number) => {
        if (secondsLeft >= 1 && secondsLeft <= 3) {
          playCountdownBeep(secondsLeft);
          hapticFeedback('tap');
          const key = `countdown_${secondsLeft}` as const;
          speakEvent(key);
        }
      },
      onHalfway: () => {
        speakEvent('halfway');
      },
      onLastRound: () => {
        speakEvent('last_round');
        hapticFeedback('double');
      },
      onDone: () => {
        speakEvent('done');
        hapticFeedback('heavy');
      },
    }),
    [],
  );

  const { state, start, pause, resume, reset, skip } = useTimer(preset, callbacks);

  return (
    <TimerDisplay
      state={state}
      presetName={presetName}
      onStart={start}
      onPause={pause}
      onResume={resume}
      onReset={reset}
      onSkip={skip}
      onBack={onBackToPresets}
    />
  );
}
