'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const DURATION_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30];

/* ─── Icons ─── */

const SpeakerOnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);
const SpeakerOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
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

interface AmrapTimerProps { onBack: () => void }

export function AmrapTimer({ onBack }: AmrapTimerProps) {
  const { t } = useI18n();
  const [durationMin, setDurationMin] = useState(10);
  const [running, setRunning] = useState(false);

  const ringTotal = durationMin * 60;

  const preset: TimerPreset = useMemo(() => ({
    name: 'AMRAP', prepareDuration: 10, workDuration: ringTotal,
    restDuration: 0, rounds: 1, cycles: 1, recoveryDuration: 0, cooldownDuration: 0,
  }), [ringTotal]);

  const ringPhases: RingPhase[] = useMemo(() =>
    [{ type: 'amrap', duration: ringTotal, color: '#ef4444' }],
  [ringTotal]);

  const handleStart = () => { unlockAudio(); setRunning(true); };
  const handleDone = useCallback(() => setRunning(false), []);

  if (running) {
    return <AmrapCountdown preset={preset} ringPhases={ringPhases} ringTotal={ringTotal} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">AMRAP</h1>
        <p className="text-[12px] text-white/70 mt-0.5">Max de reps en {durationMin} min</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] max-w-[280px] mx-auto">
        <div className="text-[11px] font-semibold tracking-wider text-center uppercase mb-2" style={{ color: '#ef4444' }}>{t('timer.config.work')}</div>
        <div className="flex justify-center">
          <div style={{ width: 160 }}>
            <WheelPicker values={DURATION_VALUES} defaultValue={10} unit="min" color="#ef4444" onChange={setDurationMin} />
          </div>
        </div>
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface AmrapCountdownProps {
  preset: TimerPreset;
  ringPhases: RingPhase[];
  ringTotal: number;
  onBack: () => void;
  onDone: () => void;
}

const MILESTONES = new Set([180, 60, 30, 10]);

function AmrapCountdown({ preset, ringPhases, ringTotal, onBack, onDone }: AmrapCountdownProps) {
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
      if (secondsLeft >= 1 && secondsLeft <= 3) { playCountdownBeep(secondsLeft); hapticFeedback('tap'); speakEvent(`countdown_${secondsLeft}`, langRef.current); }
      if (MILESTONES.has(secondsLeft)) { playTransitionBeep(); hapticFeedback('tap'); }
      if (secondsLeft === 5 || secondsLeft === 4) { playCountdownBeep(secondsLeft); hapticFeedback('tap'); }
    },
    onHalfway: () => speakEvent('halfway', langRef.current),
    onLastRound: () => { speakEvent('last_round', langRef.current); hapticFeedback('double'); },
    onDone: () => { speakEvent('done', langRef.current); hapticFeedback('heavy'); },
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
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[16px] font-bold tracking-widest text-white uppercase">
            {isPrepare ? t('timer.phases.prepare') : 'EN COURS'}
          </span>
          <button onClick={toggleSpeech} className="bg-transparent border-none cursor-pointer p-1" style={{ color: speechOn ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {speechOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
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
          currentPhaseIndex={0}
          phaseColor={isPrepare ? '#6366f1' : '#ef4444'}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={handleStop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
        {isRunning ? (
          <button onClick={pause} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: '#ef4444' }} aria-label="Pause"><PauseIcon /></button>
        ) : isPaused ? (
          <button onClick={resume} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: '#ef4444' }} aria-label="Resume"><PlayIcon /></button>
        ) : null}
        <button onClick={skip} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-zinc-200 dark:bg-white/10" aria-label="Skip"><SkipIcon /></button>
      </div>
    </section>
  );
}
