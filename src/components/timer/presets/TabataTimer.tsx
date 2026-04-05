'use client';

import { useState, useMemo } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/timer-audio';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { VoiceSelector } from '@/components/timer/VoiceSelector';
import { VoiceOnIcon, VoiceOffIcon } from '@/components/timer/VoiceIcons';

const WORK_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const REST_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const ROUND_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);
const REST_BETWEEN_VALUES = [0, 30, 60, 120, 180, 240, 300];

function formatRestBetween(seconds: number): { main: string; unit?: string } {
  if (seconds === 0) return { main: '0' };
  if (seconds < 60) return { main: String(seconds), unit: 's' };
  const m = seconds / 60;
  return { main: String(m), unit: 'mn' };
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

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

/* ─── Main component ─── */

interface TabataTimerProps { onBack: () => void }

export function TabataTimer({ onBack }: TabataTimerProps) {
  const { t } = useI18n();
  const ctx = useTimerContext();
  const [work, setWork] = useState(20);
  const [rest, setRest] = useState(10);
  const [rounds, setRounds] = useState(8);
  const [restBetween, setRestBetween] = useState(120);

  const totalDuration = (work + rest) * rounds + restBetween * Math.max(0, rounds - 1);

  const preset: TimerPreset = useMemo(() => ({
    name: 'TABATA', prepareDuration: 10, workDuration: work, restDuration: rest,
    rounds, cycles: 1, recoveryDuration: 0, restBetweenDuration: restBetween, cooldownDuration: 0,
  }), [work, rest, rounds, restBetween]);

  const ringPhases: RingPhase[] = useMemo(() => {
    const p: RingPhase[] = [];
    for (let r = 0; r < rounds; r++) {
      p.push({ type: 'work', duration: work, color: '#22c55e' });
      p.push({ type: 'rest', duration: rest, color: '#ef4444' });
      if (restBetween > 0 && r < rounds - 1) {
        p.push({ type: 'rest_between', duration: restBetween, color: '#22d3ee' });
      }
    }
    return p;
  }, [work, rest, rounds, restBetween]);

  const displayConfig: TimerDisplayConfig = useMemo(() => ({
    ringPhases, ringTotal: totalDuration,
    phaseColorMap: { prepare: '#3b82f6', work: '#22c55e', rest: '#ef4444', rest_between: '#22d3ee' },
    phaseGradientMap: {
      prepare: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      work: 'linear-gradient(135deg, #16a34a, #22c55e)',
      rest: 'linear-gradient(135deg, #dc2626, #ef4444)',
      rest_between: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    },
  }), [ringPhases, totalDuration]);

  const handleStart = () => { unlockAudio(); ctx?.startTimer('tabata', preset, displayConfig); };

  if (ctx?.isActive && ctx.timerType === 'tabata') {
    return <TabataCountdown onBack={onBack} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">Tabata</h1>
        <p className="text-[12px] text-white/70 mt-0.5">{work}s effort / {rest}s repos &times; {rounds} rounds{restBetween > 0 ? ` / ${restBetween}s récup` : ''}</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="grid items-start mb-2" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#22c55e' }}>{t('timer.config.work')}</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#ef4444' }}>{t('timer.config.rest')}</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#60a5fa' }}>Rounds</div>
          <div />
          <div className="text-[10px] font-semibold tracking-wider text-center uppercase" style={{ color: '#22d3ee' }}>{t('timer.config.restBetween')}</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr' }}>
          <WheelPicker values={WORK_VALUES} defaultValue={20} unit="s" color="#22c55e" onChange={setWork} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">|</div>
          <WheelPicker values={REST_VALUES} defaultValue={10} unit="s" color="#ef4444" onChange={setRest} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">&times;</div>
          <WheelPicker values={ROUND_VALUES} defaultValue={8} unit="" color="#60a5fa" onChange={setRounds} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">|</div>
          <WheelPicker values={REST_BETWEEN_VALUES} defaultValue={120} color="#22d3ee" onChange={setRestBetween} formatLabel={formatRestBetween} />
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">{formatDuration(totalDuration)}</div>
      </div>

      <VoiceSelector />

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

function TabataCountdown({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const ctx = useTimerContext()!;
  const { state, displayConfig, voiceOn, toggleVoice, pause, resume, stop, skip } = ctx;

  if (state.status === 'done') return null;

  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';
  const isWork = phaseType === 'work';
  const isRest = phaseType === 'rest';
  const isRestBetween = phaseType === 'rest_between';
  const isPrepare = phaseType === 'prepare';

  const phaseColor = displayConfig?.phaseColorMap[phaseType] ?? '#22c55e';
  const bannerGradient = displayConfig?.phaseGradientMap[phaseType] ?? 'linear-gradient(135deg, #16a34a, #22c55e)';

  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  const ringPhaseIndex = Math.max(0, state.activePhaseIndex - prepareOffset);
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
              <div className="text-[18px] font-bold text-white">Tabata</div>
              <div className="text-[13px] font-semibold tracking-wider text-white/80">
                {isPrepare ? t('timer.phases.prepare') : isRestBetween ? t('timer.phases.rest_between') : `${isWork ? t('timer.phases.work') : t('timer.phases.rest')} \u2014 Round ${state.currentRound} / ${state.totalRounds}`}
              </div>
            </div>
          </div>
          <button onClick={toggleVoice} className="flex items-center justify-center w-11 h-11 rounded-full border-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            {voiceOn ? <VoiceOnIcon /> : <VoiceOffIcon />}
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
          <button onClick={pause} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: phaseColor }} aria-label="Pause"><PauseIcon /></button>
        ) : isPaused ? (
          <button onClick={resume} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: phaseColor }} aria-label="Resume"><PlayIcon /></button>
        ) : null}
        <button onClick={skip} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-zinc-200 dark:bg-white/10" aria-label="Skip"><SkipIcon /></button>
      </div>
    </section>
  );
}
