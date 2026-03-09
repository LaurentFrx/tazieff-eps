'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent } from '@/lib/audio/speech';

// ---------- Preset definitions ----------

interface PresetDef {
  id: string;
  name: string;
  description: string;
  color: string;
  preset: TimerPreset;
}

const PRESETS: PresetDef[] = [
  {
    id: 'tabata',
    name: 'TABATA',
    description: '20s travail / 10s repos × 8',
    color: '#22c55e',
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
      <div style={{ background: '#0a0a0a', minHeight: '100dvh', padding: '20px 16px 100px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Timer
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            Choisissez un format d&apos;entraînement
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {PRESETS.map((def) => (
              <button
                key={def.id}
                onClick={() => handleSelectPreset(def)}
                style={{
                  background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 50%, #0a0a1e 100%)',
                  border: '1px solid #333',
                  borderRadius: '16px',
                  padding: '20px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: def.color }} />
                <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                  {def.name}
                </span>
                <span style={{ color: '#888', fontSize: '12px', lineHeight: 1.4 }}>
                  {def.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
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
            ← Retour aux presets
          </button>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: selectedPreset.color, marginRight: '10px' }} />
            {selectedPreset.name}
          </h2>

          <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #222', padding: '4px 16px', marginBottom: '24px' }}>
            <NumberField
              label="Préparation"
              value={customPreset.prepareDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, prepareDuration: v })}
              step={5}
            />
            <NumberField
              label="Travail"
              value={customPreset.workDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, workDuration: v })}
              step={5}
            />
            <NumberField
              label="Repos"
              value={customPreset.restDuration}
              onChange={(v) => setCustomPreset({ ...customPreset, restDuration: v })}
              step={5}
            />
            <NumberField
              label="Séries"
              value={customPreset.rounds}
              onChange={(v) => setCustomPreset({ ...customPreset, rounds: v })}
              min={1}
              max={50}
              unit=""
            />
            <NumberField
              label="Cycles"
              value={customPreset.cycles}
              onChange={(v) => setCustomPreset({ ...customPreset, cycles: v })}
              min={1}
              max={20}
              unit=""
            />
            {customPreset.cycles > 1 && (
              <NumberField
                label="Récupération"
                value={customPreset.recoveryDuration}
                onChange={(v) => setCustomPreset({ ...customPreset, recoveryDuration: v })}
                step={10}
              />
            )}
            <NumberField
              label="Retour au calme"
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
            START
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
        presetName={selectedPreset.name}
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
