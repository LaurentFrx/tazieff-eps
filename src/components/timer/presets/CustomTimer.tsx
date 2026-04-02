'use client';

import { useState, useMemo } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/audio/beep';
import { useI18n } from '@/lib/i18n/I18nProvider';

const PREPARE_VALUES = [0, 3, 5, 10, 15, 20, 30];
const COOLDOWN_VALUES = [0, 5, 10, 15, 20, 30];
const WORK_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);
const REST_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);
const SERIES_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);
const CYCLES_VALUES = Array.from({ length: 5 }, (_, i) => i + 1);

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

const MicOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const PauseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
);
const PlayIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21" /></svg>
);
const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
);
const SkipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

/* ─── Phase maps ─── */

const PHASE_GRADIENTS: Record<string, string> = {
  prepare:  'linear-gradient(135deg, #ca8a04, #eab308)',
  work:     'linear-gradient(135deg, #7c3aed, #8b5cf6)',
  rest:     'linear-gradient(135deg, #dc2626, #ef4444)',
  recovery: 'linear-gradient(135deg, #dc2626, #ef4444)',
  cooldown: 'linear-gradient(135deg, #ca8a04, #eab308)',
};

const PHASE_COLORS: Record<string, string> = {
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

/* ─── Main ─── */

interface CustomTimerProps { onBack: () => void }

export function CustomTimer({ onBack }: CustomTimerProps) {
  const { t, lang } = useI18n();
  const ctx = useTimerContext();
  const [prepare, setPrepare] = useState(10);
  const [cooldown, setCooldown] = useState(0);
  const [work, setWork] = useState(30);
  const [rest, setRest] = useState(15);
  const [series, setSeries] = useState(8);
  const [cycles, setCycles] = useState(1);
  const [pickerKey, setPickerKey] = useState(0);

  const totalDuration = prepare + (work + rest) * series * cycles + cooldown;

  const preset: TimerPreset = useMemo(() => ({
    name: 'PERSONNALISÉ', prepareDuration: prepare, workDuration: work, restDuration: rest,
    rounds: series, cycles, recoveryDuration: 0, cooldownDuration: cooldown,
  }), [prepare, work, rest, series, cycles, cooldown]);

  // Build ring phases matching the spec exactly
  const ringPhases: RingPhase[] = useMemo(() => {
    const p: RingPhase[] = [];
    if (prepare > 0) p.push({ type: 'prep', duration: prepare, color: '#eab308' });
    for (let c = 0; c < cycles; c++) {
      for (let s = 0; s < series; s++) {
        p.push({ type: 'work', duration: work, color: '#8b5cf6' });
        if (!(c === cycles - 1 && s === series - 1)) {
          p.push({ type: 'rest', duration: rest, color: '#ef4444' });
        }
      }
    }
    if (cooldown > 0) p.push({ type: 'cooldown', duration: cooldown, color: '#eab308' });
    return p;
  }, [prepare, work, rest, series, cycles, cooldown]);

  const ringTotal = ringPhases.reduce((s, p) => s + p.duration, 0);

  const displayConfig: TimerDisplayConfig = useMemo(() => ({
    ringPhases, ringTotal,
    phaseColorMap: { prepare: '#eab308', work: '#8b5cf6', rest: '#ef4444', recovery: '#ef4444', cooldown: '#eab308' },
    phaseGradientMap: PHASE_GRADIENTS,
  }), [ringPhases, ringTotal]);

  const handleStart = () => { unlockAudio(); ctx?.startTimer('custom', preset, displayConfig, lang); };

  const applyQuickPreset = (qp: PresetQuick) => {
    setPrepare(qp.prepare); setWork(qp.work); setRest(qp.rest);
    setSeries(qp.series); setCycles(qp.cycles); setCooldown(qp.cooldown);
    setPickerKey((k) => k + 1);
  };

  if (ctx?.isActive && ctx.timerType === 'custom') {
    return <CustomCountdown onBack={onBack} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none">
          <circle cx="12" cy="12" r="3"/><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        </svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">Personnalis&eacute;</h1>
        <p className="text-[12px] text-white/70 mt-0.5">
          {work}s travail / {rest}s repos &times; {series} s&eacute;ries{cycles > 1 ? ` × ${cycles} cycles` : ''}
        </p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }} key={`r1-${pickerKey}`}>
          <WheelPicker values={PREPARE_VALUES} defaultValue={prepare} unit="s" color="#eab308" onChange={setPrepare} label="Préparation" />
          <WheelPicker values={COOLDOWN_VALUES} defaultValue={cooldown} unit="s" color="#eab308" onChange={setCooldown} label="Retour calme" />
        </div>
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: '1fr 1fr' }} key={`r2-${pickerKey}`}>
          <WheelPicker values={WORK_VALUES} defaultValue={work} unit="s" color="#8b5cf6" onChange={setWork} label={t('timer.config.work')} />
          <WheelPicker values={REST_VALUES} defaultValue={rest} unit="s" color="#ef4444" onChange={setRest} label={t('timer.config.rest')} />
        </div>
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: '1fr 1fr' }} key={`r3-${pickerKey}`}>
          <WheelPicker values={SERIES_VALUES} defaultValue={series} unit="" color="#3b82f6" onChange={setSeries} label="Séries" />
          <WheelPicker values={CYCLES_VALUES} defaultValue={cycles} unit="" color="#22c55e" onChange={setCycles} label="Cycles" />
        </div>
      </div>

      <div className="text-center mt-3">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">{formatDuration(totalDuration)}</div>
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>

      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {QUICK_PRESETS.map((qp) => (
          <button key={qp.label} onClick={() => applyQuickPreset(qp)}
            className="rounded-xl px-3 py-2 text-[12px] font-medium cursor-pointer border transition-all active:scale-95"
            style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
            {qp.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Countdown ─── */

function CustomCountdown({ onBack }: { onBack: () => void }) {
  const ctx = useTimerContext()!;
  const { state, displayConfig, speechEnabled, toggleSpeech, pause, resume, stop, skip } = ctx;

  if (state.status === 'done') return null;

  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';

  const phaseColor = displayConfig?.phaseColorMap[phaseType] ?? PHASE_COLORS[phaseType] ?? '#8b5cf6';
  const bannerGradient = displayConfig?.phaseGradientMap[phaseType] ?? PHASE_GRADIENTS[phaseType] ?? PHASE_GRADIENTS.work;
  const phaseLabel = PHASE_LABELS[phaseType] ?? phaseType.toUpperCase();

  const roundInfo = (phaseType === 'work' || phaseType === 'rest')
    ? `Série ${state.currentRound} / ${state.totalRounds}${state.totalCycles > 1 ? ` — Cycle ${state.currentCycle} / ${state.totalCycles}` : ''}`
    : null;

  // Ring phases match useTimer phases exactly for custom timer (both include prepare/cooldown)
  const ringPhaseIndex = Math.min(state.activePhaseIndex, (displayConfig?.ringPhases.length ?? 1) - 1);

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3 transition-all duration-500" style={{ background: bannerGradient }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <button onClick={onBack} className="flex items-center text-white/70 bg-transparent border-none cursor-pointer p-2 -ml-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-[14px] font-bold tracking-widest text-white uppercase">{phaseLabel}</span>
          </div>
          <button onClick={toggleSpeech} className="flex items-center justify-center w-11 h-11 rounded-full border-none cursor-pointer" style={{ background: speechEnabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,0,0,0.15)', color: '#fff' }}>
            {speechEnabled ? <MicOnIcon /> : <MicOffIcon />}
          </button>
        </div>
        {roundInfo && <span className="text-[12px] text-white/60">{roundInfo}</span>}
      </div>

      <div className="flex flex-col items-center py-6">
        <CountdownRing
          currentSeconds={state.secondsLeft}
          totalPhaseSeconds={activePhase?.duration ?? 1}
          totalElapsed={state.elapsedSeconds}
          totalDuration={displayConfig?.ringTotal ?? 1}
          phases={displayConfig?.ringPhases ?? []}
          currentPhaseIndex={ringPhaseIndex}
          phaseColor={phaseColor}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={stop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
        {isRunning ? (
          <button onClick={pause} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: phaseColor }} aria-label="Pause"><PauseIcon /></button>
        ) : isPaused ? (
          <button onClick={resume} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: phaseColor }} aria-label="Resume"><PlayIcon /></button>
        ) : null}
        <button onClick={skip} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-zinc-200 dark:bg-white/10" aria-label="Skip"><SkipIcon /></button>
      </div>
    </section>
  );
}
