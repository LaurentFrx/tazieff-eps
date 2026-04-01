'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { WheelPicker, type WheelPickerHandle } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const DURATION_VALUES = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300];

const QUICK_PRESETS = [
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
];

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

/* ─── Main ─── */

interface ReposTimerProps { onBack: () => void }

export function ReposTimer({ onBack }: ReposTimerProps) {
  const { t } = useI18n();
  const [duration, setDuration] = useState(60);
  const [running, setRunning] = useState(false);
  const [quickStartDuration, setQuickStartDuration] = useState<number | null>(null);
  const pickerRef = useRef<WheelPickerHandle>(null);

  const activeDuration = quickStartDuration ?? duration;

  const preset: TimerPreset = useMemo(() => ({
    name: 'REPOS', prepareDuration: 3, workDuration: activeDuration,
    restDuration: 0, rounds: 1, cycles: 1, recoveryDuration: 0, cooldownDuration: 0,
  }), [activeDuration]);

  const handleStart = () => { unlockAudio(); setQuickStartDuration(null); setRunning(true); };

  const handleQuickStart = (value: number) => {
    unlockAudio();
    pickerRef.current?.scrollToValue(value);
    setDuration(value);
    setQuickStartDuration(value);
    setTimeout(() => setRunning(true), 60);
  };

  const handleDone = useCallback(() => { setRunning(false); setQuickStartDuration(null); }, []);

  if (running) {
    return <ReposCountdown preset={preset} activeDuration={activeDuration} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none"><path d="M18.36 5.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">Repos</h1>
        <p className="text-[12px] text-white/70 mt-0.5">Chrono de repos entre s&eacute;ries</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] max-w-[280px] mx-auto">
        <div className="text-[11px] font-semibold tracking-wider text-center uppercase mb-2" style={{ color: '#06b6d4' }}>Dur&eacute;e</div>
        <div className="flex justify-center">
          <div style={{ width: 160 }}>
            <WheelPicker ref={pickerRef} values={DURATION_VALUES} defaultValue={60} unit="s" color="#06b6d4" onChange={setDuration} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        {QUICK_PRESETS.map((qp) => (
          <button key={qp.value} onClick={() => handleQuickStart(qp.value)}
            className="rounded-xl px-4 py-2.5 text-[14px] font-bold cursor-pointer border transition-all active:scale-95"
            style={{ background: duration === qp.value ? 'rgba(6,182,212,0.3)' : 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.25)', color: '#22d3ee' }}>
            {qp.label}
          </button>
        ))}
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface ReposCountdownProps {
  preset: TimerPreset;
  activeDuration: number;
  onBack: () => void;
  onDone: () => void;
}

function ReposCountdown({ preset, activeDuration, onBack, onDone }: ReposCountdownProps) {
  const { t, lang } = useI18n();
  const langRef = useRef(lang); langRef.current = lang;
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());
  const toggleSpeech = () => { const n = !speechOn; setSpeechOn(n); setSpeechEnabled(n); };

  const ringPhases: RingPhase[] = useMemo(() =>
    [{ type: 'rest', duration: activeDuration, color: '#06b6d4' }],
  [activeDuration]);

  const callbacks = useMemo(() => ({
    onPhaseChange: (phase: { type: string }) => {
      hapticFeedback('heavy'); playTransitionBeep();
      if (phase.type === 'prepare') speakEvent('prepare', langRef.current);
      else if (phase.type === 'work') speakEvent('rest_start', langRef.current);
    },
    onTick: (secondsLeft: number) => {
      if (secondsLeft >= 1 && secondsLeft <= 5) { playCountdownBeep(secondsLeft); hapticFeedback('tap'); if (secondsLeft <= 3) speakEvent(`countdown_${secondsLeft}`, langRef.current); }
      if (secondsLeft === 10) { playTransitionBeep(); hapticFeedback('tap'); }
    },
    onHalfway: () => {},
    onLastRound: () => {},
    onDone: () => { speakEvent('done', langRef.current); hapticFeedback('heavy'); playTransitionBeep(); setTimeout(() => playTransitionBeep(), 200); },
  }), []);

  const { state, start, pause, resume, reset } = useTimer(preset, callbacks);

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
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[16px] font-bold tracking-widest text-white uppercase">
            {isPrepare ? t('timer.phases.prepare') : 'REPOS'}
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
          totalDuration={activeDuration}
          phases={ringPhases}
          currentPhaseIndex={0}
          phaseColor={isPrepare ? '#6366f1' : '#06b6d4'}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={handleStop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
        {isRunning ? (
          <button onClick={pause} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: '#06b6d4' }} aria-label="Pause"><PauseIcon /></button>
        ) : isPaused ? (
          <button onClick={resume} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: '#06b6d4' }} aria-label="Resume"><PlayIcon /></button>
        ) : null}
      </div>
    </section>
  );
}
