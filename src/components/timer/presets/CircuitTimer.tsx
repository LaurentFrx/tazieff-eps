'use client';

import { useState, useMemo } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/audio/beep';
import { useI18n } from '@/lib/i18n/I18nProvider';

const WORK_VALUES = Array.from({ length: 11 }, (_, i) => (i + 2) * 5);
const REST_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const STATION_VALUES = Array.from({ length: 11 }, (_, i) => i + 2);
const TOUR_VALUES = Array.from({ length: 5 }, (_, i) => i + 1);

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

/* ─── Icons ─── */

const VoiceOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const VoiceOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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

/* ─── Main ─── */

interface CircuitTimerProps { onBack: () => void }

export function CircuitTimer({ onBack }: CircuitTimerProps) {
  const { t, lang } = useI18n();
  const ctx = useTimerContext();
  const [work, setWork] = useState(30);
  const [rest, setRest] = useState(15);
  const [stations, setStations] = useState(6);
  const [tours, setTours] = useState(2);

  const totalDuration = (work + rest) * stations * tours;

  const preset: TimerPreset = useMemo(() => ({
    name: 'CIRCUIT', prepareDuration: 10, workDuration: work, restDuration: rest,
    rounds: stations, cycles: tours, recoveryDuration: tours > 1 ? 30 : 0, cooldownDuration: 0,
  }), [work, rest, stations, tours]);

  const ringPhases: RingPhase[] = useMemo(() => {
    const p: RingPhase[] = [];
    for (let tour = 0; tour < tours; tour++) {
      for (let s = 0; s < stations; s++) {
        p.push({ type: 'work', duration: work, color: '#f97316' });
        p.push({ type: 'rest', duration: rest, color: '#ef4444' });
      }
    }
    return p;
  }, [work, rest, stations, tours]);

  const displayConfig: TimerDisplayConfig = useMemo(() => ({
    ringPhases, ringTotal: totalDuration,
    phaseColorMap: { prepare: '#6366f1', work: '#f97316', rest: '#ef4444', recovery: '#ef4444' },
    phaseGradientMap: {
      prepare: 'linear-gradient(135deg, #4f46e5, #6366f1)',
      work: 'linear-gradient(135deg, #ea580c, #f97316)',
      rest: 'linear-gradient(135deg, #dc2626, #ef4444)',
      recovery: 'linear-gradient(135deg, #dc2626, #ef4444)',
    },
  }), [ringPhases, totalDuration]);

  const handleStart = () => { unlockAudio(); ctx?.startTimer('circuit', preset, displayConfig, lang); };

  if (ctx?.isActive && ctx.timerType === 'circuit') {
    return <CircuitCountdown stations={stations} tours={tours} onBack={onBack} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none"><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">&larr; Retour</button>
        <h1 className="text-[22px] font-bold text-white">Circuit Training</h1>
        <p className="text-[12px] text-white/70 mt-0.5">{stations} stations &times; {tours} tour{tours > 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="grid items-start mb-1" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#f97316' }}>{t('timer.config.work')}</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#ef4444' }}>{t('timer.config.rest')}</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <WheelPicker values={WORK_VALUES} defaultValue={30} unit="s" color="#f97316" onChange={setWork} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">|</div>
          <WheelPicker values={REST_VALUES} defaultValue={15} unit="s" color="#ef4444" onChange={setRest} />
        </div>
        <div className="grid items-start mb-1 mt-4" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#3b82f6' }}>Stations</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#8b5cf6' }}>Tours</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <WheelPicker values={STATION_VALUES} defaultValue={6} unit="" color="#3b82f6" onChange={setStations} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-2 self-center">&times;</div>
          <WheelPicker values={TOUR_VALUES} defaultValue={2} unit="" color="#8b5cf6" onChange={setTours} />
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">{formatDuration(totalDuration)}</div>
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface CircuitCountdownProps {
  stations: number;
  tours: number;
  onBack: () => void;
}

function CircuitCountdown({ stations, tours, onBack }: CircuitCountdownProps) {
  const { t } = useI18n();
  const ctx = useTimerContext()!;
  const { state, displayConfig, speechEnabled, toggleSpeech, pause, resume, stop, skip } = ctx;

  if (state.status === 'done') return null;

  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';
  const isWork = phaseType === 'work';
  const isPrepare = phaseType === 'prepare';

  const phaseColor = displayConfig?.phaseColorMap[phaseType] ?? '#f97316';
  const bannerGradient = displayConfig?.phaseGradientMap[phaseType] ?? 'linear-gradient(135deg, #ea580c, #f97316)';

  const stationLabel = isWork
    ? `${t('timer.phases.work')} \u2014 Station ${state.currentRound}`
    : isPrepare ? t('timer.phases.prepare')
    : phaseType === 'recovery' ? 'R\u00e9cup\u00e9ration'
    : t('timer.phases.rest');

  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  const ringPhaseIndex = Math.max(0, state.activePhaseIndex - prepareOffset);
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

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
            <span className="text-[14px] font-bold tracking-widest text-white uppercase">{stationLabel}</span>
          </div>
          <button onClick={toggleSpeech} className="flex items-center justify-center w-11 h-11 rounded-full border-none cursor-pointer" style={{ background: speechEnabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,80,80,0.15)', color: speechEnabled ? '#fff' : 'rgba(255,120,120,0.8)' }}>
            {speechEnabled ? <VoiceOnIcon /> : <VoiceOffIcon />}
          </button>
        </div>
        {tours > 1 && <span className="text-[12px] text-white/60">Tour {state.currentCycle} / {tours}</span>}
      </div>

      <div className="flex flex-col items-center py-6">
        <CountdownRing
          currentSeconds={state.secondsLeft}
          totalPhaseSeconds={activePhase?.duration ?? 1}
          totalElapsed={isPrepare ? 0 : ringElapsed}
          totalDuration={displayConfig?.ringTotal ?? 1}
          phases={displayConfig?.ringPhases ?? []}
          currentPhaseIndex={isPrepare ? 0 : Math.min(ringPhaseIndex, (displayConfig?.ringPhases ?? []).length - 1)}
          phaseColor={isPrepare ? '#6366f1' : phaseColor}
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
