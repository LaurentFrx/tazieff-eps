'use client';

import { useState, useMemo } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/timer-audio';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { VoiceSelector } from '@/components/timer/VoiceSelector';

const DURATION_VALUES = [30, 40, 45, 50, 55, 60];
const MINUTES_VALUES = Array.from({ length: 30 }, (_, i) => i + 1);

/* ─── Icons ─── */

const PauseIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>);
const PlayIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21" /></svg>);
const StopIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>);
const SkipIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>);

/* ─── Main ─── */

interface EmomTimerProps { onBack: () => void }

export function EmomTimer({ onBack }: EmomTimerProps) {
  const { t } = useI18n();
  const ctx = useTimerContext();
  const [duration, setDuration] = useState(60);
  const [minutes, setMinutes] = useState(10);

  const ringTotal = duration * minutes;

  const preset: TimerPreset = useMemo(() => ({
    name: 'EMOM', prepareDuration: 10, workDuration: duration, restDuration: 0,
    rounds: minutes, cycles: 1, recoveryDuration: 0, restBetweenDuration: 0, cooldownDuration: 0,
  }), [duration, minutes]);

  const ringPhases: RingPhase[] = useMemo(() =>
    Array.from({ length: minutes }, () => ({ type: 'minute', duration, color: '#3b82f6' })),
  [duration, minutes]);

  const displayConfig: TimerDisplayConfig = useMemo(() => ({
    ringPhases, ringTotal,
    phaseColorMap: { prepare: '#6366f1', work: '#3b82f6' },
    phaseGradientMap: {
      prepare: 'linear-gradient(135deg, #4f46e5, #6366f1)',
      work: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    },
  }), [ringPhases, ringTotal]);

  const handleStart = () => { unlockAudio(); ctx?.startTimer('emom', preset, displayConfig); };

  if (ctx?.isActive && ctx.timerType === 'emom') {
    return <EmomCountdown onBack={onBack} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
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

      <VoiceSelector />

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

function EmomCountdown({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const ctx = useTimerContext()!;
  const { state, displayConfig, voiceOn, toggleVoice, pause, resume, stop, skip } = ctx;

  if (state.status === 'done') return null;

  const activePhase = state.phases[state.activePhaseIndex];
  const isPrepare = activePhase?.type === 'prepare';
  const phaseColor = displayConfig?.phaseColorMap[activePhase?.type ?? 'work'] ?? '#3b82f6';

  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  const ringPhaseIndex = Math.max(0, state.activePhaseIndex - prepareOffset);
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3" style={{ background: displayConfig?.phaseGradientMap[activePhase?.type ?? 'work'] ?? 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={onBack} className="flex items-center text-white/70 bg-transparent border-none cursor-pointer p-2 -ml-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="text-[18px] font-bold text-white">EMOM</div>
              <div className="text-[13px] font-semibold tracking-wider text-white/80">
                {isPrepare ? t('timer.phases.prepare') : `Minute ${state.currentRound} / ${state.totalRounds}`}
              </div>
            </div>
          </div>
          <button onClick={toggleVoice} className="flex items-center justify-center w-11 h-11 rounded-full border-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            {voiceOn ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5"/></svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center py-6">
        <CountdownRing
          currentSeconds={state.secondsLeft}
          totalPhaseSeconds={activePhase?.duration ?? 1}
          totalElapsed={isPrepare ? 0 : ringElapsed}
          totalDuration={displayConfig?.ringTotal ?? 1}
          phases={displayConfig?.ringPhases ?? []}
          currentPhaseIndex={isPrepare ? 0 : ringPhaseIndex}
          phaseColor={phaseColor}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={stop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
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
