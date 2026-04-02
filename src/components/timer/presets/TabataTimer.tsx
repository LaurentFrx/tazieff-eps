'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep, playFinishSound } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const WORK_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const REST_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const ROUND_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

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

/* ─── Main component ─── */

interface TabataTimerProps { onBack: () => void }

export function TabataTimer({ onBack }: TabataTimerProps) {
  const { t } = useI18n();
  const [work, setWork] = useState(20);
  const [rest, setRest] = useState(10);
  const [rounds, setRounds] = useState(8);
  const [running, setRunning] = useState(false);

  const totalDuration = (work + rest) * rounds;

  const preset: TimerPreset = useMemo(() => ({
    name: 'TABATA', prepareDuration: 10, workDuration: work, restDuration: rest,
    rounds, cycles: 1, recoveryDuration: 0, cooldownDuration: 0,
  }), [work, rest, rounds]);

  // Build ring phases (excludes prepare — ring only shows work/rest)
  const ringPhases: RingPhase[] = useMemo(() => {
    const p: RingPhase[] = [];
    for (let r = 0; r < rounds; r++) {
      p.push({ type: 'work', duration: work, color: '#22c55e' });
      p.push({ type: 'rest', duration: rest, color: '#ef4444' });
    }
    return p;
  }, [work, rest, rounds]);

  const handleStart = () => { unlockAudio(); setRunning(true); };
  const handleDone = useCallback(() => setRunning(false), []);

  if (running) {
    return <TabataCountdown preset={preset} ringPhases={ringPhases} ringTotal={totalDuration} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">Tabata</h1>
        <p className="text-[12px] text-white/70 mt-0.5">{work}s effort / {rest}s repos &times; {rounds} rounds</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="grid items-start mb-2" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#22c55e' }}>{t('timer.config.work')}</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#ef4444' }}>{t('timer.config.rest')}</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#60a5fa' }}>Rounds</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr' }}>
          <WheelPicker values={WORK_VALUES} defaultValue={20} unit="s" color="#22c55e" onChange={setWork} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">|</div>
          <WheelPicker values={REST_VALUES} defaultValue={10} unit="s" color="#ef4444" onChange={setRest} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">&times;</div>
          <WheelPicker values={ROUND_VALUES} defaultValue={8} unit="" color="#60a5fa" onChange={setRounds} />
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">{formatDuration(totalDuration)}</div>
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface TabataCountdownProps {
  preset: TimerPreset;
  ringPhases: RingPhase[];
  ringTotal: number;
  onBack: () => void;
  onDone: () => void;
}

function TabataCountdown({ preset, ringPhases, ringTotal, onBack, onDone }: TabataCountdownProps) {
  const { t, lang } = useI18n();
  const langRef = useRef(lang); langRef.current = lang;
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());
  const toggleSpeech = () => { const n = !speechOn; setSpeechOn(n); setSpeechEnabled(n); };

  const callbacks = useMemo(() => ({
    onPhaseChange: (phase: { type: string }) => {
      hapticFeedback('heavy'); playTransitionBeep();
      if (phase.type === 'prepare') speakEvent('prepare', langRef.current);
      else if (phase.type === 'work') speakEvent('work_start', langRef.current);
      else if (phase.type === 'rest' || phase.type === 'recovery') speakEvent('rest_start', langRef.current);
    },
    onTick: (secondsLeft: number) => {
      if (secondsLeft >= 1 && secondsLeft <= 5) { playCountdownBeep(secondsLeft); hapticFeedback('tap'); if (secondsLeft <= 3) speakEvent(`countdown_${secondsLeft}`, langRef.current); }
    },
    onHalfway: () => speakEvent('halfway', langRef.current),
    onLastRound: () => { speakEvent('last_round', langRef.current); hapticFeedback('double'); },
    onDone: () => { playFinishSound(); speakEvent('done', langRef.current); hapticFeedback('heavy'); },
  }), []);

  const { state, start, pause, resume, reset, skip } = useTimer(preset, callbacks);

  // Auto-start
  useMemo(() => { if (state.status === 'idle') setTimeout(() => start(), 50); return true; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isDone = state.status === 'done';
  const activePhase = state.phases[state.activePhaseIndex];
  const phaseType = activePhase?.type ?? 'work';
  const isWork = phaseType === 'work';
  const isRest = phaseType === 'rest';
  const isPrepare = phaseType === 'prepare';

  const handleStop = () => { reset(); onDone(); };
  if (isDone) { reset(); onDone(); return null; }

  const bannerGradient = isRest
    ? 'linear-gradient(135deg, #dc2626, #ef4444)'
    : 'linear-gradient(135deg, #16a34a, #22c55e)';
  const phaseColor = isRest ? '#ef4444' : '#22c55e';

  // Ring phase index: useTimer phases include 'prepare' at index 0, ring phases don't.
  // So ring index = useTimer activePhaseIndex - (prepare exists ? 1 : 0), clamped to 0.
  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  const ringPhaseIndex = Math.max(0, state.activePhaseIndex - prepareOffset);

  // Elapsed for ring: exclude prepare time
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

  return (
    <section className="page">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3 transition-all duration-500" style={{ background: bannerGradient }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">
            {isPrepare ? t('timer.phases.prepare') : isWork ? t('timer.phases.work') : t('timer.phases.rest')}
          </span>
          <button onClick={toggleSpeech} className="flex items-center justify-center w-11 h-11 rounded-full border-none cursor-pointer" style={{ background: speechOn ? 'rgba(255,255,255,0.15)' : 'rgba(255,0,0,0.15)', color: '#fff' }}>
            {speechOn ? <MicOnIcon /> : <MicOffIcon />}
          </button>
        </div>
        <span className="text-[12px] text-white/60">Round {state.currentRound} / {state.totalRounds}</span>
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center py-6">
        <CountdownRing
          currentSeconds={state.secondsLeft}
          totalPhaseSeconds={activePhase?.duration ?? 1}
          totalElapsed={isPrepare ? 0 : ringElapsed}
          totalDuration={ringTotal}
          phases={ringPhases}
          currentPhaseIndex={isPrepare ? 0 : ringPhaseIndex}
          phaseColor={isPrepare ? '#3b82f6' : phaseColor}
        />
      </div>

      {/* Controls: stop | pause/play | skip */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={handleStop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop">
          <StopIcon />
        </button>

        {isRunning ? (
          <button onClick={pause} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: phaseColor }} aria-label="Pause">
            <PauseIcon />
          </button>
        ) : isPaused ? (
          <button onClick={resume} className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer text-white shadow-lg" style={{ background: phaseColor }} aria-label="Resume">
            <PlayIcon />
          </button>
        ) : null}

        <button onClick={skip} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-zinc-200 dark:bg-white/10" aria-label="Skip">
          <SkipIcon />
        </button>
      </div>
    </section>
  );
}
