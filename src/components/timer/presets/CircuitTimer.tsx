'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { WheelPicker } from '@/components/tools/WheelPicker';
import { CountdownRing, type RingPhase } from '@/components/tools/CountdownRing';
import { useTimer, type TimerPreset } from '@/hooks/useTimer';
import { unlockAudio, hapticFeedback, playCountdownBeep, playTransitionBeep } from '@/lib/audio/beep';
import { speakEvent, isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

const WORK_VALUES = Array.from({ length: 11 }, (_, i) => (i + 2) * 5);
const REST_VALUES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const STATION_VALUES = Array.from({ length: 11 }, (_, i) => i + 2);
const TOUR_VALUES = Array.from({ length: 5 }, (_, i) => i + 1);

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

interface CircuitTimerProps { onBack: () => void }

export function CircuitTimer({ onBack }: CircuitTimerProps) {
  const { t } = useI18n();
  const [work, setWork] = useState(30);
  const [rest, setRest] = useState(15);
  const [stations, setStations] = useState(6);
  const [tours, setTours] = useState(2);
  const [running, setRunning] = useState(false);

  const totalDuration = (work + rest) * stations * tours;

  const preset: TimerPreset = useMemo(() => ({
    name: 'CIRCUIT', prepareDuration: 10, workDuration: work, restDuration: rest,
    rounds: stations, cycles: tours, recoveryDuration: tours > 1 ? 30 : 0, cooldownDuration: 0,
  }), [work, rest, stations, tours]);

  const ringPhases: RingPhase[] = useMemo(() => {
    const p: RingPhase[] = [];
    for (let tour = 0; tour < tours; tour++) {
      for (let s = 0; s < stations; s++) {
        p.push({ type: 'work', duration: work, color: '#f97316' });
        p.push({ type: 'rest', duration: rest, color: '#ef4444' });
      }
    }
    return p;
  }, [work, rest, stations, tours]);

  const handleStart = () => { unlockAudio(); setRunning(true); };
  const handleDone = useCallback(() => setRunning(false), []);

  if (running) {
    return <CircuitCountdown preset={preset} ringPhases={ringPhases} ringTotal={totalDuration} stations={stations} tours={tours} onBack={onBack} onDone={handleDone} />;
  }

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute top-3 right-3 pointer-events-none"><path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <button onClick={onBack} className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">← Retour</button>
        <h1 className="text-[22px] font-bold text-white">Circuit Training</h1>
        <p className="text-[12px] text-white/70 mt-0.5">{stations} stations &times; {tours} tour{tours > 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="grid items-start mb-1" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#f97316' }}>{t('timer.config.work')}</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#ef4444' }}>{t('timer.config.rest')}</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <WheelPicker values={WORK_VALUES} defaultValue={30} unit="s" color="#f97316" onChange={setWork} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-1 self-center">|</div>
          <WheelPicker values={REST_VALUES} defaultValue={15} unit="s" color="#ef4444" onChange={setRest} />
        </div>
        <div className="grid items-start mb-1 mt-4" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#3b82f6' }}>Stations</div>
          <div />
          <div className="text-[11px] font-semibold tracking-wider text-center uppercase" style={{ color: '#8b5cf6' }}>Tours</div>
        </div>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <WheelPicker values={STATION_VALUES} defaultValue={6} unit="" color="#3b82f6" onChange={setStations} />
          <div className="text-[14px] text-zinc-300 dark:text-zinc-700 px-2 self-center">&times;</div>
          <WheelPicker values={TOUR_VALUES} defaultValue={2} unit="" color="#8b5cf6" onChange={setTours} />
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-[11px] text-zinc-400 dark:text-white/35">Dur&eacute;e totale</span>
        <div className="font-mono text-[22px] font-bold text-zinc-900 dark:text-white mt-0.5">{formatDuration(totalDuration)}</div>
      </div>

      <button onClick={handleStart} className="w-full mt-4 cursor-pointer border-none" style={{ height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {t('timer.controls.start')}
      </button>
    </section>
  );
}

/* ─── Countdown ─── */

interface CircuitCountdownProps {
  preset: TimerPreset;
  ringPhases: RingPhase[];
  ringTotal: number;
  stations: number;
  tours: number;
  onBack: () => void;
  onDone: () => void;
}

function CircuitCountdown({ preset, ringPhases, ringTotal, stations, tours, onBack, onDone }: CircuitCountdownProps) {
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
      if (secondsLeft >= 1 && secondsLeft <= 3) { playCountdownBeep(secondsLeft); hapticFeedback('tap'); speakEvent(`countdown_${secondsLeft}`, langRef.current); }
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
  const phaseType = activePhase?.type ?? 'work';
  const isWork = phaseType === 'work';
  const isRest = phaseType === 'rest';
  const isPrepare = phaseType === 'prepare';

  const handleStop = () => { reset(); onDone(); };
  if (isDone) { reset(); onDone(); return null; }

  const bannerGradient = isRest
    ? 'linear-gradient(135deg, #dc2626, #ef4444)'
    : 'linear-gradient(135deg, #ea580c, #f97316)';
  const phaseColor = isRest ? '#ef4444' : '#f97316';

  const stationLabel = isWork
    ? `${t('timer.phases.work')} — Station ${state.currentRound}`
    : isPrepare ? t('timer.phases.prepare')
    : phaseType === 'recovery' ? 'Récupération'
    : t('timer.phases.rest');

  const prepareOffset = state.phases.length > 0 && state.phases[0].type === 'prepare' ? 1 : 0;
  // Ring phases don't include prepare or recovery — approximate mapping
  const ringPhaseIndex = Math.max(0, state.activePhaseIndex - prepareOffset);
  const prepareTime = prepareOffset > 0 ? state.phases[0].duration : 0;
  const ringElapsed = Math.max(0, state.elapsedSeconds - prepareTime);

  return (
    <section className="page">
      <div className="relative overflow-hidden rounded-2xl px-5 pt-4 pb-3 transition-all duration-500" style={{ background: bannerGradient }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] font-bold tracking-widest text-white uppercase">{stationLabel}</span>
          <button onClick={toggleSpeech} className="bg-transparent border-none cursor-pointer p-1" style={{ color: speechOn ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {speechOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
          </button>
        </div>
        {tours > 1 && <span className="text-[12px] text-white/60">Tour {state.currentCycle} / {tours}</span>}
      </div>

      <div className="flex flex-col items-center py-6">
        <CountdownRing
          currentSeconds={state.secondsLeft}
          totalPhaseSeconds={activePhase?.duration ?? 1}
          totalElapsed={isPrepare ? 0 : ringElapsed}
          totalDuration={ringTotal}
          phases={ringPhases}
          currentPhaseIndex={isPrepare ? 0 : Math.min(ringPhaseIndex, ringPhases.length - 1)}
          phaseColor={isPrepare ? '#6366f1' : phaseColor}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={handleStop} className="w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer bg-red-500/15" aria-label="Stop"><StopIcon /></button>
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
