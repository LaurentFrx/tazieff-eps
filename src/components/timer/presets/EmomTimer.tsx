'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep, playFinishSound } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const DURATION_VALUES = [30, 40, 45, 50, 55, 60];
const MINUTES_VALUES = Array.from({ length: 30 }, (_, i) => i + 1);

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

/* ─── Main ─── */

interface EmomTimerProps { onBack: () => void }

export function EmomTimer({ onBack }: EmomTimerProps) {
  const { t } = useI18n();
  const [duration, setDuration] = useState(60);
  const [minutes, setMinutes] = useState(10);
  const [running, setRunning] = useState(false);

  const ringTotal = duration * minutes;

  const preset: TimerPreset = useMemo(() => ({
    name: 'EMOM', prepareDuration: 10, workDuration: duration, restDuration: 0,
    rounds: minutes, cycles: 1, recoveryDuration: 0, cooldownDuration: 0,
  }), [duration, minutes]);

  const ringPhases: RingPhase[] = useMemo(() =>
    Array.from({ length: minutes }, () => ({ type: 'minute', duration, color: '#3b82f6' })),
  [duration, minutes]);

  const handleStart = () => { unlockAudio(); setRunning(true); };
  const handleDone = useCallback(() => setRunning(false), []);

  if (running) {
    return <EmomCountdown preset={preset} ringPhases={ringPhases} ringTotal={ringTotal} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none"><path d="M5 3v18M19 3v18M5 12h14M5 7h14M5 17h14"/></svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">EMOM</h1>
        <p className="text-[12px] text-white/70 mt-0.5">Chaque minute pendant {minutes} min</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="grid items-start mb-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#06b6d4' }}>Dur&eacute;e / round</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#3b82f6' }}>Minutes</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <WheelPicker values={DURATION_VALUES} defaultValue={60} unit="s" color="#06b6d4" onChange={setDuration} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-2 self-center">&times;</div>
          <WheelPicker values={MINUTES_VALUES} defaultValue={10} unit="min" color="#3b82f6" onChange={setMinutes} />
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">{minutes} min</div>
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface EmomCountdownProps {
  preset: TimerPreset;
  ringPhases: RingPhase[];
  ringTotal: number;
  onBack: () => void;
  onDone: () => void;
}

function EmomCountdown({ preset, ringPhases, ringTotal, onBack, onDone }: EmomCountdownProps) {
  const { t, lang } = useI18n();
  const langRef = useRef(lang); langRef.current = lang;
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());
  const toggleSpeech = () => { const n = !speechOn; setSpeechOn(n); setSpeechEnabled(n); };

  const callbacks = useMemo(() => ({
    onPhaseChange: (phase: { type: string }) => {
      hapticFeedback('heavy'); playTransitionBeep();
      if (phase.type === 'prepare') speakEvent('prepare', langRef.current);
      else if (phase.type === 'work') speakEvent('work_start', langRef.current);
    },
    onTick: (secondsLeft: number) => {
      if (secondsLeft >= 1 && secondsLeft <= 5) { playCountdownBeep(secondsLeft); hapticFeedback('tap'); if (secondsLeft <= 3) speakEvent(`countdown_${secondsLeft}`, langRef.current); }
    },
    onHalfway: () => speakEvent('halfway', langRef.current),
    onLastRound: () => { speakEvent('last_round', langRef.current); hapticFeedback('double'); },
    onDone: () => { playFinishSound(); speakEvent('done', langRef.current); hapticFeedback('heavy'); },
  }), []);

  const { state, start, pause, resume, reset, skip } = useTimer(preset, callbacks);

  useMemo(() => { if (state.status === 'idle') setTimeout(() => start(), 50); return true; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isDone = state.status === 'done';
  const activePhase = state.phases[state.activePhaseIndex];
  const isPrepare = activePhase?.type === 'prepare';

  const handleStop = () => { reset(); onDone(); };
  if (isDone) { reset(); onDone(); return null; }

  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  const ringPhaseIndex = Math.max(0, state.activePhaseIndex - prepareOffset);
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">
            {isPrepare ? t('timer.phases.prepare') : `Minute ${state.currentRound} / ${state.totalRounds}`}
          </span>
          <button onClick={toggleSpeech} className="flex items-center justify-center w-11 h-11 rounded-full border-none cursor-pointer" style={{ background: speechOn ? 'rgba(255,255,255,0.15)' : 'rgba(255,0,0,0.15)', color: '#fff' }}>
            {speechOn ? <MicOnIcon /> : <MicOffIcon />}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center py-6">
        <CountdownRing
          currentSeconds={state.secondsLeft}
          totalPhaseSeconds={activePhase?.duration ?? 1}
          totalElapsed={isPrepare ? 0 : ringElapsed}
          totalDuration={ringTotal}
          phases={ringPhases}
          currentPhaseIndex={isPrepare ? 0 : ringPhaseIndex}
          phaseColor={isPrepare ? '#6366f1' : '#3b82f6'}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={handleStop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
        {isRunning ? (
          <button onClick={pause} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: '#3b82f6' }} aria-label="Pause"><PauseIcon /></button>
        ) : isPaused ? (
          <button onClick={resume} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: '#3b82f6' }} aria-label="Resume"><PlayIcon /></button>
        ) : null}
        <button onClick={skip} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-zinc-200 dark:bg-white/10" aria-label="Skip"><SkipIcon /></button>
      </div>
    </section>
  );
}
