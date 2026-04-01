'use client';

import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownWheels } from '@/components/tools/CountdownWheels';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const DURATION_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30];

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

interface AmrapTimerProps {
  onBack: () => void;
}

export function AmrapTimer({ onBack }: AmrapTimerProps) {
  const { t } = useI18n();
  const [durationMin, setDurationMin] = useState(10);
  const [running, setRunning] = useState(false);

  const preset: TimerPreset = useMemo(() => ({
    name: 'AMRAP',
    prepareDuration: 10,
    workDuration: durationMin * 60,
    restDuration: 0,
    rounds: 1,
    cycles: 1,
    recoveryDuration: 0,
    cooldownDuration: 0,
  }), [durationMin]);

  const handleStart = () => {
    unlockAudio();
    setRunning(true);
  };

  const handleDone = useCallback(() => {
    setRunning(false);
  }, []);

  if (running) {
    return <AmrapCountdown preset={preset} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white dark:bg-[#0a0a0a]">
      {/* Banner */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">
          ← Retour
        </button>
        <h1 className="text-[22px] font-bold text-white">AMRAP</h1>
        <p className="text-[12px] text-white/70 mt-0.5">
          Max de reps en {durationMin} min
        </p>
      </div>

      {/* Config card */}
      <div className="flex-1 px-4 py-5 flex flex-col items-center">
        <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] w-full max-w-[280px]">
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase mb-2" style={{ color: '#ef4444' }}>
            {t('timer.config.work')}
          </div>
          <div className="flex justify-center">
            <div style={{ width: 160 }}>
              <WheelPicker values={DURATION_VALUES} defaultValue={10} unit="min" color="#ef4444" onChange={setDurationMin} />
            </div>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="px-4 pb-6" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))' }}>
        <button
          onClick={handleStart}
          className="w-full cursor-pointer border-none"
          style={{
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {t('timer.controls.start')}
        </button>
      </div>
    </div>
  );
}

/* ─── Countdown ─── */

interface AmrapCountdownProps {
  preset: TimerPreset;
  onBack: () => void;
  onDone: () => void;
}

// Milestone seconds for extra beeps in AMRAP
const MILESTONES = new Set([180, 60, 30, 10]);

function AmrapCountdown({ preset, onBack, onDone }: AmrapCountdownProps) {
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
    },
    onTick: (secondsLeft: number) => {
      // Standard countdown beeps at 3-2-1
      if (secondsLeft >= 1 && secondsLeft <= 3) {
        playCountdownBeep(secondsLeft);
        hapticFeedback('tap');
        speakEvent(`countdown_${secondsLeft}`);
      }
      // AMRAP milestone beeps at 3:00, 1:00, 30s, 10s
      if (MILESTONES.has(secondsLeft)) {
        playTransitionBeep();
        hapticFeedback('tap');
      }
      // 5-4 also get beeps
      if (secondsLeft === 5 || secondsLeft === 4) {
        playCountdownBeep(secondsLeft);
        hapticFeedback('tap');
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
  const mins = Math.floor(state.secondsLeft / 60);
  const secs = state.secondsLeft % 60;
  const progress = activePhase ? 1 - state.secondsLeft / activePhase.duration : 0;

  const handleStop = () => { reset(); onDone(); };

  if (isDone) { reset(); onDone(); return null; }

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-[#0a0a0a]" style={{ height: '100dvh' }}>
      {/* Banner — always red */}
      <div
        className="relative overflow-hidden px-5 pt-4 pb-3"
        style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">
            {activePhase?.type === 'prepare' ? t('timer.phases.prepare') : 'EN COURS'}
          </span>
          <button onClick={toggleSpeech} className="bg-transparent border-none cursor-pointer p-1" style={{ color: speechOn ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {speechOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
          </button>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <CountdownWheels minutes={mins} seconds={secs} />

        <div className="w-full max-w-[280px] h-[6px] rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%`, background: '#ef4444' }}
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
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
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
