'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WheelPicker, type WheelPickerHandle } from '@/components/tools/WheelPicker';
import { CountdownWheels } from '@/components/tools/CountdownWheels';
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

interface ReposTimerProps {
  onBack: () => void;
}

export function ReposTimer({ onBack }: ReposTimerProps) {
  const { t } = useI18n();
  const [duration, setDuration] = useState(60);
  const [running, setRunning] = useState(false);
  const [quickStartDuration, setQuickStartDuration] = useState<number | null>(null);
  const pickerRef = useRef<WheelPickerHandle>(null);

  const activeDuration = quickStartDuration ?? duration;

  const preset: TimerPreset = useMemo(() => ({
    name: 'REPOS',
    prepareDuration: 3,
    workDuration: activeDuration,
    restDuration: 0,
    rounds: 1,
    cycles: 1,
    recoveryDuration: 0,
    cooldownDuration: 0,
  }), [activeDuration]);

  const handleStart = () => {
    unlockAudio();
    setQuickStartDuration(null);
    setRunning(true);
  };

  const handleQuickStart = (value: number) => {
    unlockAudio();
    pickerRef.current?.scrollToValue(value);
    setDuration(value);
    setQuickStartDuration(value);
    // Small delay to let state propagate
    setTimeout(() => setRunning(true), 60);
  };

  const handleDone = useCallback(() => {
    setRunning(false);
    setQuickStartDuration(null);
  }, []);

  if (running) {
    return <ReposCountdown preset={preset} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white dark:bg-[#0a0a0a]">
      {/* Banner */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none">
          <path d="M18.36 5.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
        </svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">
          ← Retour
        </button>
        <h1 className="text-[22px] font-bold text-white">Repos</h1>
        <p className="text-[12px] text-white/70 mt-0.5">
          Chrono de repos entre s&eacute;ries
        </p>
      </div>

      {/* Config card */}
      <div className="flex-1 px-4 py-5 flex flex-col items-center">
        <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] w-full max-w-[280px]">
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase mb-2" style={{ color: '#06b6d4' }}>
            Dur&eacute;e
          </div>
          <div className="flex justify-center">
            <div style={{ width: 160 }}>
              <WheelPicker
                ref={pickerRef}
                values={DURATION_VALUES}
                defaultValue={60}
                unit="s"
                color="#06b6d4"
                onChange={setDuration}
              />
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mt-4">
          {QUICK_PRESETS.map((qp) => (
            <button
              key={qp.value}
              onClick={() => handleQuickStart(qp.value)}
              className="rounded-xl px-4 py-2.5 text-[14px] font-bold cursor-pointer border transition-all active:scale-95"
              style={{
                background: duration === qp.value ? 'rgba(6,182,212,0.3)' : 'rgba(6,182,212,0.15)',
                borderColor: 'rgba(6,182,212,0.25)',
                color: '#22d3ee',
              }}
            >
              {qp.label}
            </button>
          ))}
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
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
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

interface ReposCountdownProps {
  preset: TimerPreset;
  onBack: () => void;
  onDone: () => void;
}

function ReposCountdown({ preset, onBack, onDone }: ReposCountdownProps) {
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
      else if (phase.type === 'work') speakEvent('rest_start');
    },
    onTick: (secondsLeft: number) => {
      if (secondsLeft >= 1 && secondsLeft <= 5) {
        playCountdownBeep(secondsLeft);
        hapticFeedback('tap');
        if (secondsLeft <= 3) speakEvent(`countdown_${secondsLeft}`);
      }
      if (secondsLeft === 10) {
        playTransitionBeep();
        hapticFeedback('tap');
      }
    },
    onHalfway: () => {},
    onLastRound: () => {},
    onDone: () => {
      speakEvent('done');
      hapticFeedback('heavy');
      // Double beep at end
      playTransitionBeep();
      setTimeout(() => playTransitionBeep(), 200);
    },
  }), []);

  const { state, start, pause, resume, reset } = useTimer(preset, callbacks);

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
      {/* Banner — always cyan */}
      <div
        className="relative overflow-hidden px-5 pt-4 pb-3"
        style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">
            {activePhase?.type === 'prepare' ? t('timer.phases.prepare') : 'REPOS'}
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
            style={{ width: `${progress * 100}%`, background: '#06b6d4' }}
          />
        </div>
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
            style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
          >
            {t('timer.controls.resume')}
          </button>
        ) : null}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
