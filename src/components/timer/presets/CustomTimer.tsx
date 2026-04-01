'use client';

import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownWheels } from '@/components/tools/CountdownWheels';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const PREPARE_VALUES = [0, 3, 5, 10, 15, 20, 30];
const COOLDOWN_VALUES = [0, 5, 10, 15, 20, 30];
const WORK_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);   // 5-120 step 5
const REST_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);   // 5-120 step 5
const SERIES_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);       // 1-20
const CYCLES_VALUES = Array.from({ length: 5 }, (_, i) => i + 1);        // 1-5

interface PresetQuick {
  label: string;
  prepare: number;
  work: number;
  rest: number;
  series: number;
  cycles: number;
  cooldown: number;
}

const QUICK_PRESETS: PresetQuick[] = [
  { label: 'Tabata classique', prepare: 10, work: 20, rest: 10, series: 8, cycles: 1, cooldown: 0 },
  { label: '30/30', prepare: 5, work: 30, rest: 30, series: 10, cycles: 1, cooldown: 0 },
  { label: 'Pyramide', prepare: 10, work: 40, rest: 20, series: 6, cycles: 2, cooldown: 10 },
];

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

/* ─── Icons ─── */

const SpeakerOnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const SpeakerOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

/* ─── Phase gradient map ─── */

const PHASE_GRADIENTS: Record<string, string> = {
  prepare:  'linear-gradient(135deg, #ca8a04, #eab308)',
  work:     'linear-gradient(135deg, #7c3aed, #8b5cf6)',
  rest:     'linear-gradient(135deg, #dc2626, #ef4444)',
  recovery: 'linear-gradient(135deg, #dc2626, #ef4444)',
  cooldown: 'linear-gradient(135deg, #ca8a04, #eab308)',
};

const PHASE_BAR_COLORS: Record<string, string> = {
  prepare: '#eab308',
  work: '#8b5cf6',
  rest: '#ef4444',
  recovery: '#ef4444',
  cooldown: '#eab308',
};

const PHASE_LABELS: Record<string, string> = {
  prepare: 'PRÉPARATION',
  work: 'TRAVAIL',
  rest: 'REPOS',
  recovery: 'REPOS',
  cooldown: 'RETOUR AU CALME',
};

/* ─── Component ─── */

interface CustomTimerProps {
  onBack: () => void;
}

export function CustomTimer({ onBack }: CustomTimerProps) {
  const { t } = useI18n();
  const [prepare, setPrepare] = useState(10);
  const [cooldown, setCooldown] = useState(0);
  const [work, setWork] = useState(30);
  const [rest, setRest] = useState(15);
  const [series, setSeries] = useState(8);
  const [cycles, setCycles] = useState(1);
  const [running, setRunning] = useState(false);
  // Key to force WheelPicker remount on preset apply
  const [pickerKey, setPickerKey] = useState(0);

  const totalDuration = prepare + (work + rest) * series * cycles + cooldown;

  const preset: TimerPreset = useMemo(() => ({
    name: 'PERSONNALISÉ',
    prepareDuration: prepare,
    workDuration: work,
    restDuration: rest,
    rounds: series,
    cycles,
    recoveryDuration: 0,
    cooldownDuration: cooldown,
  }), [prepare, work, rest, series, cycles, cooldown]);

  const handleStart = () => {
    unlockAudio();
    setRunning(true);
  };

  const handleDone = useCallback(() => {
    setRunning(false);
  }, []);

  const applyQuickPreset = (qp: PresetQuick) => {
    setPrepare(qp.prepare);
    setWork(qp.work);
    setRest(qp.rest);
    setSeries(qp.series);
    setCycles(qp.cycles);
    setCooldown(qp.cooldown);
    // Force remount of all pickers with new defaults
    setPickerKey((k) => k + 1);
  };

  if (running) {
    return <CustomCountdown preset={preset} series={series} cycles={cycles} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <section className="page">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none">
          <circle cx="12" cy="12" r="3"/><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        </svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">
          ← Retour
        </button>
        <h1 className="text-[22px] font-bold text-white">Personnalis&eacute;</h1>
        <p className="text-[12px] text-white/70 mt-0.5">
          {work}s travail / {rest}s repos &times; {series} s&eacute;ries{cycles > 1 ? ` × ${cycles} cycles` : ''}
        </p>
      </div>

      {/* Config card */}
      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        {/* Row 1: Préparation | Retour au calme */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }} key={`r1-${pickerKey}`}>
          <WheelPicker values={PREPARE_VALUES} defaultValue={prepare} unit="s" color="#eab308" onChange={setPrepare} label="Préparation" />
          <WheelPicker values={COOLDOWN_VALUES} defaultValue={cooldown} unit="s" color="#eab308" onChange={setCooldown} label="Retour calme" />
        </div>

        {/* Row 2: Travail | Repos */}
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: '1fr 1fr' }} key={`r2-${pickerKey}`}>
          <WheelPicker values={WORK_VALUES} defaultValue={work} unit="s" color="#8b5cf6" onChange={setWork} label={t('timer.config.work')} />
          <WheelPicker values={REST_VALUES} defaultValue={rest} unit="s" color="#ef4444" onChange={setRest} label={t('timer.config.rest')} />
        </div>

        {/* Row 3: Séries | Cycles */}
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: '1fr 1fr' }} key={`r3-${pickerKey}`}>
          <WheelPicker values={SERIES_VALUES} defaultValue={series} unit="" color="#3b82f6" onChange={setSeries} label="Séries" />
          <WheelPicker values={CYCLES_VALUES} defaultValue={cycles} unit="" color="#22c55e" onChange={setCycles} label="Cycles" />
        </div>
      </div>

      {/* Total duration */}
      <div className="text-center mt-3">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">
          {formatDuration(totalDuration)}
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {QUICK_PRESETS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => applyQuickPreset(qp)}
            className="rounded-xl px-3 py-2 text-[12px] font-bold cursor-pointer border transition-all active:scale-95"
            style={{
              background: 'rgba(139,92,246,0.12)',
              borderColor: 'rgba(139,92,246,0.2)',
              color: '#a78bfa',
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="w-full mt-4 cursor-pointer border-none"
        style={{
          height: 56,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface CustomCountdownProps {
  preset: TimerPreset;
  series: number;
  cycles: number;
  onBack: () => void;
  onDone: () => void;
}

function CustomCountdown({ preset, series, cycles, onBack, onDone }: CustomCountdownProps) {
  const { t } = useI18n();
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());

  const toggleSpeech = () => {
    const next = !speechOn;
    setSpeechOn(next);
    setSpeechEnabled(next);
  };

  const callbacks = useMemo(() => ({
    onPhaseChange: (phase: { type: string }) => {
      hapticFeedback('heavy');
      playTransitionBeep();
      if (phase.type === 'prepare') speakEvent('prepare');
      else if (phase.type === 'work') speakEvent('work_start');
      else if (phase.type === 'rest' || phase.type === 'recovery') speakEvent('rest_start');
      else if (phase.type === 'cooldown') speakEvent('rest_start');
    },
    onTick: (secondsLeft: number) => {
      if (secondsLeft >= 1 && secondsLeft <= 3) {
        playCountdownBeep(secondsLeft);
        hapticFeedback('tap');
        speakEvent(`countdown_${secondsLeft}`);
      }
    },
    onHalfway: () => speakEvent('halfway'),
    onLastRound: () => { speakEvent('last_round'); hapticFeedback('double'); },
    onDone: () => { speakEvent('done'); hapticFeedback('heavy'); },
  }), []);

  const { state, start, pause, resume, reset, skip } = useTimer(preset, callbacks);

  const didStart = useMemo(() => {
    if (state.status === 'idle') setTimeout(() => start(), 50);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void didStart;

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isDone = state.status === 'done';

  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';

  const mins = Math.floor(state.secondsLeft / 60);
  const secs = state.secondsLeft % 60;
  const progress = activePhase ? 1 - state.secondsLeft / activePhase.duration : 0;

  const handleStop = () => { reset(); onDone(); };

  if (isDone) { reset(); onDone(); return null; }

  const bannerGradient = PHASE_GRADIENTS[phaseType] ?? PHASE_GRADIENTS.work;
  const barColor = PHASE_BAR_COLORS[phaseType] ?? '#8b5cf6';
  const phaseLabel = PHASE_LABELS[phaseType] ?? phaseType.toUpperCase();

  // Round info
  const roundInfo = phaseType === 'work' || phaseType === 'rest'
    ? `Série ${state.currentRound} / ${series}${cycles > 1 ? ` — Cycle ${state.currentCycle} / ${cycles}` : ''}`
    : null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-[#0a0a0a]" style={{ height: '100dvh' }}>
      {/* Banner */}
      <div
        className="relative overflow-hidden px-5 pt-4 pb-3 transition-all duration-500"
        style={{ background: bannerGradient }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">
            {phaseLabel}
          </span>
          <button onClick={toggleSpeech} className="bg-transparent border-none cursor-pointer p-1" style={{ color: speechOn ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {speechOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
          </button>
        </div>
        {roundInfo && (
          <span className="text-[12px] text-white/60">{roundInfo}</span>
        )}
      </div>

      {/* Countdown */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <CountdownWheels minutes={mins} seconds={secs} />

        <div className="w-full max-w-[280px] h-[6px] rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%`, background: barColor }}
          />
        </div>

        <span className="text-[11px] text-zinc-400 dark:text-white/30 font-mono">
          {Math.floor(state.totalSecondsLeft / 60)}:{String(state.totalSecondsLeft % 60).padStart(2, '0')} restant
        </span>
      </div>

      {/* Controls */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))', paddingTop: 12 }}
      >
        <button
          onClick={handleStop}
          className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)' }}
          aria-label="Stop"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        </button>

        {isRunning ? (
          <button
            onClick={pause}
            className="flex-1 h-14 rounded-[12px] border-none cursor-pointer text-[16px] font-bold tracking-widest uppercase text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            {t('timer.controls.pause')}
          </button>
        ) : isPaused ? (
          <button
            onClick={resume}
            className="flex-1 h-14 rounded-[12px] border-none cursor-pointer text-[16px] font-bold tracking-widest uppercase text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}
          >
            {t('timer.controls.resume')}
          </button>
        ) : null}

        <button
          onClick={skip}
          className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-label="Skip"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
