'use client';

import { useState, useMemo, useCallback } from 'react';
/* createPortal removed — countdown renders inline */
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownWheels } from '@/components/tools/CountdownWheels';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const WORK_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5); // 5-60 step 5
const REST_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5); // 5-60 step 5
const ROUND_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);       // 1-20

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

/* ─── Component ─── */

interface TabataTimerProps {
  onBack: () => void;
}

export function TabataTimer({ onBack }: TabataTimerProps) {
  const { t } = useI18n();
  const [work, setWork] = useState(20);
  const [rest, setRest] = useState(10);
  const [rounds, setRounds] = useState(8);
  const [running, setRunning] = useState(false);

  const totalDuration = (work + rest) * rounds;

  const preset: TimerPreset = useMemo(() => ({
    name: 'TABATA',
    prepareDuration: 10,
    workDuration: work,
    restDuration: rest,
    rounds,
    cycles: 1,
    recoveryDuration: 0,
    cooldownDuration: 0,
  }), [work, rest, rounds]);

  const handleStart = () => {
    unlockAudio();
    setRunning(true);
  };

  const handleDone = useCallback(() => {
    setRunning(false);
  }, []);

  if (running) {
    return <TabataCountdown preset={preset} onBack={onBack} onDone={handleDone} />;
  }

  // ── Config view ──
  return (
    <section className="page">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">
          ← Retour
        </button>
        <h1 className="text-[22px] font-bold text-white">Tabata</h1>
        <p className="text-[12px] text-white/70 mt-0.5">
          {work}s effort / {rest}s repos &times; {rounds} rounds
        </p>
      </div>

      {/* Config card */}
      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        {/* Labels row */}
        <div className="grid items-start mb-2" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#22c55e' }}>
            {t('timer.config.work')}
          </div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#ef4444' }}>
            {t('timer.config.rest')}
          </div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#60a5fa' }}>
            Rounds
          </div>
        </div>

        {/* Pickers row */}
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr' }}>
          <WheelPicker values={WORK_VALUES} defaultValue={20} unit="s" color="#22c55e" onChange={setWork} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">|</div>
          <WheelPicker values={REST_VALUES} defaultValue={10} unit="s" color="#ef4444" onChange={setRest} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">&times;</div>
          <WheelPicker values={ROUND_VALUES} defaultValue={8} unit="" color="#60a5fa" onChange={setRounds} />
        </div>
      </div>

      {/* Total duration */}
      <div className="text-center mt-4">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">
          {formatDuration(totalDuration)}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="w-full mt-4 cursor-pointer border-none"
        style={{
          height: 56,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
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

/* ─── Countdown sub-component ─── */

interface TabataCountdownProps {
  preset: TimerPreset;
  onBack: () => void;
  onDone: () => void;
}

function TabataCountdown({ preset, onBack, onDone }: TabataCountdownProps) {
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

  // Auto-start
  const didStart = useMemo(() => {
    if (state.status === 'idle') {
      setTimeout(() => start(), 50);
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void didStart;

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isDone = state.status === 'done';

  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';
  const isWork = phaseType === 'work';
  const isRest = phaseType === 'rest';

  const mins = Math.floor(state.secondsLeft / 60);
  const secs = state.secondsLeft % 60;

  const progress = activePhase
    ? 1 - state.secondsLeft / activePhase.duration
    : 0;

  const handleStop = () => {
    reset();
    onDone();
  };

  if (isDone) {
    reset();
    onDone();
    return null;
  }

  const bannerGradient = isRest
    ? 'linear-gradient(135deg, #dc2626, #ef4444)'
    : 'linear-gradient(135deg, #16a34a, #22c55e)';

  const barColor = isRest ? '#ef4444' : '#22c55e';

  return (
    <section className="page">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3 transition-all duration-500"
        style={{ background: bannerGradient }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">
            {phaseType === 'prepare' ? t('timer.phases.prepare') : isWork ? t('timer.phases.work') : t('timer.phases.rest')}
          </span>
          <button onClick={toggleSpeech} className="bg-transparent border-none cursor-pointer p-1" style={{ color: speechOn ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {speechOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
          </button>
        </div>
        <span className="text-[12px] text-white/60">
          Round {state.currentRound} / {state.totalRounds}
        </span>
      </div>

      {/* Countdown */}
      <div className="flex flex-col items-center gap-4 py-8">
        <CountdownWheels minutes={mins} seconds={secs} />

        {/* Progress bar */}
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
      <div className="flex items-center gap-3">
        <button
          onClick={handleStop}
          className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 bg-red-500/15"
          aria-label="Stop"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        </button>

        {isRunning ? (
          <button
            onClick={pause}
            className="flex-1 h-14 rounded-[12px] border-none cursor-pointer text-[16px] font-bold tracking-widest uppercase text-zinc-700 dark:text-white bg-zinc-200 dark:bg-white/10"
          >
            {t('timer.controls.pause')}
          </button>
        ) : isPaused ? (
          <button
            onClick={resume}
            className="flex-1 h-14 rounded-[12px] border-none cursor-pointer text-[16px] font-bold tracking-widest uppercase text-white"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
          >
            {t('timer.controls.resume')}
          </button>
        ) : null}

        <button
          onClick={skip}
          className="w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 bg-zinc-200 dark:bg-white/10"
          aria-label="Skip"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>
    </section>
  );
}
