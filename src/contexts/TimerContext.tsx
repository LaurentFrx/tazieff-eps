'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import type { RingPhase } from '@/components/tools/CountdownRing';
import type { TimerPreset, TimerState, PhaseEntry } from '@/hooks/useTimer';
import { buildPhases, computeTotalRemaining, getCurrentRoundCycle } from '@/hooks/useTimer';
import { playCountdownBeep, playFinishSound, playSkipBeep } from '@/lib/timer-audio';
import { hapticFeedback } from '@/lib/audio/beep';
import { playCoachEvent, isCoachEnabled, toggleCoach, getVoice, setVoice, preloadNextEvents, type VoiceName } from '@/lib/audio/voice-coach';
import { useI18n } from '@/lib/i18n/I18nProvider';

/* ─── Display config passed by each timer preset ─── */

export interface TimerDisplayConfig {
  ringPhases: RingPhase[];
  ringTotal: number;
  phaseColorMap: Record<string, string>;
  phaseGradientMap: Record<string, string>;
}

/* ─── Context value ─── */

export interface TimerContextValue {
  state: TimerState;
  timerType: string | null;
  displayConfig: TimerDisplayConfig | null;
  isActive: boolean;
  startTimer: (type: string, preset: TimerPreset, config: TimerDisplayConfig) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  voiceOn: boolean;
  toggleVoice: () => void;
  selectedVoice: VoiceName;
  setSelectedVoice: (name: VoiceName) => void;
}

/* ─── Idle state ─── */

const IDLE_STATE: TimerState = {
  status: 'idle', phases: [], activePhaseIndex: 0, secondsLeft: 0,
  totalSecondsLeft: 0, currentRound: 1, totalRounds: 1,
  currentCycle: 1, totalCycles: 1, elapsedSeconds: 0,
};

/* ─── Context ─── */

const TimerContext = createContext<TimerContextValue | null>(null);
export function useTimerContext() { return useContext(TimerContext); }

/* ─── Provider ─── */

export function TimerProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const [timerType, setTimerType] = useState<string | null>(null);
  const [displayConfig, setDisplayConfig] = useState<TimerDisplayConfig | null>(null);
  const [state, setState] = useState<TimerState>(IDLE_STATE);
  const [voiceOn, setVoiceOn] = useState(() =>
    typeof window !== 'undefined' ? isCoachEnabled() : true,
  );
  const [selectedVoice, setSelectedVoiceState] = useState<VoiceName>(() =>
    typeof window !== 'undefined' ? getVoice() : 'Paul',
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const presetRef = useRef<TimerPreset | null>(null);
  const voiceOnRef = useRef(voiceOn);
  useEffect(() => { voiceOnRef.current = voiceOn; }, [voiceOn]);

  /* ── helpers ── */

  const clearInt = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const acquireWL = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator)
        wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch { /* not available */ }
  }, []);

  const releaseWL = useCallback(() => {
    wakeLockRef.current?.release(); wakeLockRef.current = null;
  }, []);

  /* ── advance to next phase ── */

  const advancePhase = useCallback((cur: TimerState): TimerState => {
    const nextIdx = cur.activePhaseIndex + 1;
    const newPhases = cur.phases.map((p: PhaseEntry, i: number) =>
      i === cur.activePhaseIndex ? { ...p, status: 'done' as const }
        : i === nextIdx ? { ...p, status: 'active' as const }
        : p,
    );

    if (nextIdx >= cur.phases.length) {
      playFinishSound();
      hapticFeedback('heavy');
      // Retarder la voix de fin après le triple Do-Mi-Sol (~0.8s)
      setTimeout(() => playCoachEvent('done', langRef.current), 1000);
      return { ...cur, status: 'done', phases: newPhases, secondsLeft: 0, totalSecondsLeft: 0 };
    }

    const next = newPhases[nextIdx];
    hapticFeedback('double');
    const preset = presetRef.current;
    if (preset) {
      const { currentRound, currentCycle } = getCurrentRoundCycle(newPhases, nextIdx);
      const locale = langRef.current;

      // === COACHING VOCAL ===
      const phaseToCategory: Record<string, string> = {
        prepare: 'prepare',
        work: 'work_start',
        rest: 'rest_start',
        rest_between: 'rest_start',
        recovery: 'rest_start',
        cooldown: 'rest_start',
      };
      const category = phaseToCategory[next.type];
      if (category) {
        // For work phases: check if last round first
        if (next.type === 'work') {
          const isLastRound = currentRound === preset.rounds && currentCycle === preset.cycles;
          if (isLastRound) {
            playCoachEvent('last_round', locale);
          } else {
            playCoachEvent('work_start', locale);
          }
        } else {
          playCoachEvent(category, locale);
        }
      }

      // Round announcement (work phases)
      if (next.type === 'work' && next.roundIndex && next.roundIndex <= 10) {
        setTimeout(() => playCoachEvent(`round_${next.roundIndex}`, locale), 1500);
      }

      // Halfway detection
      if (next.type === 'work') {
        const totalRounds = preset.rounds * preset.cycles;
        const currentTotalRound = (currentCycle - 1) * preset.rounds + currentRound;
        if (totalRounds > 2 && currentTotalRound === Math.ceil(totalRounds / 2)) {
          setTimeout(() => playCoachEvent('halfway', locale), 2000);
        }
      }

      // Précharger les countdown et la prochaine transition
      const nextCategory = phaseToCategory[next.type];
      if (nextCategory) {
        preloadNextEvents(['countdown_3', 'countdown_2', 'countdown_1', nextCategory], locale);
      }

      return {
        ...cur, phases: newPhases, activePhaseIndex: nextIdx,
        secondsLeft: next.duration,
        totalSecondsLeft: computeTotalRemaining(newPhases, nextIdx, next.duration),
        currentRound, currentCycle,
      };
    }
    return cur;
  }, []);

  /* ── tick ── */

  const tick = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'running') return prev;
      const sl = prev.secondsLeft - 1;
      const el = prev.elapsedSeconds + 1;

      // Countdown (3, 2, 1, 0) — voix OU bips, jamais les deux
      if (sl >= 1 && sl <= 3) hapticFeedback('tap');
      if (sl >= 0 && sl <= 3) {
        if (voiceOnRef.current) {
          // Voix ON : countdown parlé, PAS de bips
          if (sl === 3) playCoachEvent('countdown_3', langRef.current);
          else if (sl === 2) playCoachEvent('countdown_2', langRef.current);
          else if (sl === 1) playCoachEvent('countdown_1', langRef.current);
          // sl === 0 : rien ici, la phrase de transition joue dans advancePhase
        } else {
          // Voix OFF : bips seulement
          playCountdownBeep(sl);
        }
      }

      // Time remaining announcements
      if (sl === 30) playCoachEvent('time_30', langRef.current);
      else if (sl === 10) playCoachEvent('time_10', langRef.current);
      else if (sl === 5) playCoachEvent('time_5', langRef.current);

      // Mid-work encouragement : une fois à mi-phase pour les phases > 20s
      const currentPhase = prev.phases[prev.activePhaseIndex];
      if (currentPhase?.type === 'work' && currentPhase.duration > 20) {
        const midPoint = Math.floor(currentPhase.duration / 2);
        if (sl === midPoint) {
          // 60% chance mid_work, 40% chance technique
          if (Math.random() < 0.6) {
            playCoachEvent('mid_work', langRef.current);
          } else {
            playCoachEvent('technique', langRef.current);
          }
        }
      }

      if (sl <= 0) return advancePhase({ ...prev, secondsLeft: 0, elapsedSeconds: el });
      return { ...prev, secondsLeft: sl, totalSecondsLeft: prev.totalSecondsLeft - 1, elapsedSeconds: el };
    });
  }, [advancePhase]);

  /* ── actions ── */

  const stop = useCallback(() => {
    clearInt(); releaseWL();
    setTimerType(null); setDisplayConfig(null);
    presetRef.current = null; setState(IDLE_STATE);
    // Clear media session
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('play', null);
    }
  }, [clearInt, releaseWL]);

  // Auto-cleanup 2 s after done + session complete flag
  useEffect(() => {
    if (state.status === 'done') {
      // If a session draft exists, store completion data for carnet
      try {
        const draft = localStorage.getItem('eps_session_draft');
        if (draft) {
          const items = JSON.parse(draft);
          if (Array.isArray(items) && items.length > 0) {
            localStorage.setItem('eps_session_complete', JSON.stringify({
              exercices: items,
              duration: state.elapsedSeconds,
              timerType,
              date: new Date().toISOString(),
            }));
          }
        }
      } catch { /* ignore */ }

      const t = setTimeout(stop, 2000);
      return () => clearTimeout(t);
    }
  }, [state.status, state.elapsedSeconds, timerType, stop]);

  const startTimer = useCallback((type: string, preset: TimerPreset, config: TimerDisplayConfig) => {
    clearInt(); releaseWL();
    setTimerType(type); setDisplayConfig(config);
    presetRef.current = preset;

    const phases = buildPhases(preset);
    const activated = phases.map((p, i) => i === 0 ? { ...p, status: 'active' as const } : p);

    setState({
      status: 'running', phases: activated, activePhaseIndex: 0,
      secondsLeft: phases[0]?.duration ?? 0,
      totalSecondsLeft: phases.reduce((s, p) => s + p.duration, 0),
      currentRound: 1, totalRounds: preset.rounds,
      currentCycle: 1, totalCycles: preset.cycles, elapsedSeconds: 0,
    });

    acquireWL();
    intervalRef.current = setInterval(tick, 1000);

    // Annoncer la première phase
    const firstPhaseType = phases[0]?.type;
    if (firstPhaseType) {
      const phaseToCategory: Record<string, string> = {
        prepare: 'prepare',
        work: 'work_start',
        rest: 'rest_start',
        rest_between: 'rest_start',
        recovery: 'rest_start',
        cooldown: 'rest_start',
      };
      const category = phaseToCategory[firstPhaseType];
      if (category) playCoachEvent(category, langRef.current);
    }

    // Précharger les voix pour les prochaines phases
    preloadNextEvents(['prepare', 'work_start', 'countdown_3', 'countdown_2', 'countdown_1'], langRef.current);

    // Media Session — lock screen controls (does NOT steal audio focus)
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Timer actif',
        artist: 'Tazieff EPS',
      });
    }
  }, [clearInt, releaseWL, acquireWL, tick]);

  const pause = useCallback(() => {
    setState(p => p.status === 'running' ? { ...p, status: 'paused' } : p);
    clearInt();
  }, [clearInt]);

  const resume = useCallback(() => {
    setState(p => p.status === 'paused' ? { ...p, status: 'running' } : p);
    clearInt(); intervalRef.current = setInterval(tick, 1000);
  }, [tick, clearInt]);

  const skip = useCallback(() => {
    playSkipBeep();
    hapticFeedback('tap');
    setState(p => (p.status === 'running' || p.status === 'paused')
      ? advancePhase({ ...p, secondsLeft: 0 }) : p);
  }, [advancePhase]);

  const handleToggleVoice = useCallback(() => {
    const newState = toggleCoach();
    setVoiceOn(newState);
  }, []);

  const handleSetVoice = useCallback((name: VoiceName) => {
    setVoice(name);
    setSelectedVoiceState(name);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { clearInt(); releaseWL(); }, [clearInt, releaseWL]);

  const isActive = state.status === 'running' || state.status === 'paused';

  // Media Session play/pause handlers
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!isActive) return;
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('play', () => resume());
    return () => {
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('play', null);
    };
  }, [isActive, pause, resume]);

  return (
    <TimerContext.Provider value={{
      state, timerType, displayConfig, isActive,
      startTimer, pause, resume, stop, skip,
      voiceOn, toggleVoice: handleToggleVoice,
      selectedVoice, setSelectedVoice: handleSetVoice,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
