'use client';

import { useState, useMemo } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/timer-audio';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { VoiceSelector } from '@/components/timer/VoiceSelector';

const DURATION_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30];

/* ─── Icons ─── */

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
  const ctx = useTimerContext();
  const [durationMin, setDurationMin] = useState(10);

  const ringTotal = durationMin * 60;

  const preset: TimerPreset = useMemo(() => ({
    name: 'AMRAP', prepareDuration: 10, workDuration: ringTotal,
    restDuration: 0, rounds: 1, cycles: 1, recoveryDuration: 0, restBetweenDuration: 0, cooldownDuration: 0,
  }), [ringTotal]);

  const ringPhases: RingPhase[] = useMemo(() =>
    [{ type: 'amrap', duration: ringTotal, color: '#ef4444' }],
  [ringTotal]);

  const displayConfig: TimerDisplayConfig = useMemo(() => ({
    ringPhases, ringTotal,
    phaseColorMap: { prepare: '#6366f1', work: '#ef4444' },
    phaseGradientMap: {
      prepare: 'linear-gradient(135deg, #4f46e5, #6366f1)',
      work: 'linear-gradient(135deg, #dc2626, #ef4444)',
    },
  }), [ringPhases, ringTotal]);

  const handleStart = () => { unlockAudio(); ctx?.startTimer('amrap', preset, displayConfig); };

  if (ctx?.isActive && ctx.timerType === 'amrap') {
    return <AmrapCountdown onBack={onBack} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">&larr; Retour</button>
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

      <VoiceSelector />

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

function AmrapCountdown({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const ctx = useTimerContext()!;
  const { state, displayConfig, voiceOn, toggleVoice, pause, resume, stop, skip } = ctx;

  if (state.status === 'done') return null;

  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';
  const isPrepare = phaseType === 'prepare';

  const phaseColor = displayConfig?.phaseColorMap[isPrepare ? 'prepare' : 'work'] ?? '#ef4444';
  const bannerGradient = displayConfig?.phaseGradientMap[isPrepare ? 'prepare' : 'work'] ?? 'linear-gradient(135deg, #dc2626, #ef4444)';

  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3 transition-all duration-500" style={{ background: bannerGradient }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={onBack} className="flex items-center text-white/70 bg-transparent border-none cursor-pointer p-2 -ml-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="text-[18px] font-bold text-white">AMRAP</div>
              <div className="text-[13px] font-semibold tracking-wider text-white/80">
                {isPrepare ? t('timer.phases.prepare') : t('timer.phases.work')}
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
          currentPhaseIndex={0}
          phaseColor={phaseColor}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={stop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
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
