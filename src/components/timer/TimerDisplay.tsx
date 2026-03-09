'use client';

import { useEffect, useRef, useState } from 'react';
import type { PhaseEntry, TimerState } from '@/hooks/useTimer';
import { isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

// ---------- Phase colors ----------

const PHASE_COLORS: Record<string, { from: string; to: string; text: string; dimBg: string; doneBg: string }> = {
  prepare:  { from: '#f59e0b', to: '#d97706', text: '#000',   dimBg: 'rgba(245,158,11,0.2)',  doneBg: '#3a2a0a' },
  work:     { from: '#22c55e', to: '#16a34a', text: '#000',   dimBg: 'rgba(34,197,94,0.2)',   doneBg: '#1a3a1a' },
  rest:     { from: '#ef4444', to: '#dc2626', text: '#fff',   dimBg: 'rgba(239,68,68,0.2)',   doneBg: '#3a1a1a' },
  recovery: { from: '#3b82f6', to: '#2563eb', text: '#fff',   dimBg: 'rgba(59,130,246,0.2)',  doneBg: '#1a1a3a' },
  cooldown: { from: '#06b6d4', to: '#0891b2', text: '#fff',   dimBg: 'rgba(6,182,212,0.2)',   doneBg: '#0a2a2a' },
};

function getPhaseColor(type: string) {
  return PHASE_COLORS[type] || PHASE_COLORS.work;
}

// ---------- Format time ----------

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ---------- SVG Icons ----------

const ResetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 1 9 9" />
    <polyline points="1 7 3 12 8 10" />
  </svg>
);

const SkipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const SpeakerOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const SpeakerOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

// ---------- Phase Band ----------

interface PhaseBandProps {
  phase: PhaseEntry;
  isActive: boolean;
  secondsLeft: number;
  index: number;
}

function PhaseBand({ phase, isActive, secondsLeft, index }: PhaseBandProps) {
  const { t } = useI18n();
  const colors = getPhaseColor(phase.type);
  const isDone = phase.status === 'done';
  const showCountdown = isActive && secondsLeft <= 3 && secondsLeft > 0;
  const scale = showCountdown ? 1 + (4 - secondsLeft) * 0.1 : 1;

  const bgStyle: React.CSSProperties = isDone
    ? { background: colors.doneBg, opacity: 0.5 }
    : isActive
      ? { background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }
      : { background: colors.dimBg };

  const textColor = isActive ? colors.text : '#fff';

  return (
    <div
      className="timer-band"
      style={{
        ...bgStyle,
        flex: isActive ? '1 1 auto' : '0 0 auto',
        height: isActive ? undefined : isDone ? '44px' : '56px',
        minHeight: isActive ? '120px' : undefined,
        borderRadius: '12px',
        padding: isActive ? '16px 20px' : '10px 20px',
        display: 'flex',
        flexDirection: isActive ? 'column' : 'row',
        alignItems: isActive ? 'center' : 'center',
        justifyContent: isActive ? 'center' : 'space-between',
        gap: isActive ? '8px' : '0',
        color: textColor,
        transition: 'all 300ms ease',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${index * 30}ms`,
      }}
      data-phase-status={phase.status}
      data-phase-type={phase.type}
    >
      {/* Heartbeat pulse overlay for active WORK */}
      {isActive && phase.type === 'work' && (
        <div
          className="timer-pulse-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'inherit',
            borderRadius: 'inherit',
            animation: 'timer-heartbeat 1s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Phase transition flash overlay */}
      {isActive && (
        <div
          className="timer-flash-overlay"
          key={`flash-${index}-${phase.status}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            borderRadius: 'inherit',
            animation: 'timer-flash 300ms ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Phase label */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize: isActive ? '14px' : '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          opacity: isDone ? 0.6 : 1,
          textDecoration: isDone ? 'line-through' : 'none',
          position: isActive ? 'relative' : 'static',
          zIndex: 1,
        }}
      >
        {t(`timer.phases.${phase.type}`)}
        {phase.roundIndex != null && !isActive && (
          <span style={{ opacity: 0.6, fontStyle: 'normal', fontWeight: 400, marginLeft: '6px' }}>
            R{phase.roundIndex}
          </span>
        )}
      </span>

      {/* Countdown */}
      {isActive ? (
        <span
          className="font-orbitron"
          style={{
            fontSize: 'clamp(64px, 18vw, 110px)',
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            transform: `scale(${scale})`,
            transition: 'transform 200ms ease',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {formatTime(secondsLeft)}
        </span>
      ) : (
        <span
          style={{
            fontFamily: "ui-monospace, 'Courier New', monospace",
            fontWeight: 700,
            fontSize: '15px',
            fontVariantNumeric: 'tabular-nums',
            opacity: isDone ? 0.5 : 0.8,
          }}
        >
          {isDone ? '00:00' : formatTime(phase.duration)}
        </span>
      )}

      {/* Round info on active band */}
      {isActive && phase.roundIndex != null && (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            opacity: 0.7,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {t('timer.roundOf')} {phase.roundIndex}
        </span>
      )}
    </div>
  );
}

// ---------- Scoreboard Counters ----------

interface ScoreboardProps {
  currentRound: number;
  totalRounds: number;
  currentCycle: number;
  totalCycles: number;
}

function Scoreboard({ currentRound, totalRounds, currentCycle, totalCycles }: ScoreboardProps) {
  const { t } = useI18n();
  const showCycles = totalCycles > 1;

  const counterStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 50%, #0a0a1e 100%)',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  };

  return (
    <div style={{ display: 'flex', gap: '12px', padding: '0 12px' }}>
      <div style={{ ...counterStyle, ...(showCycles ? {} : { maxWidth: '200px', margin: '0 auto' }) }}>
        <span
          className="font-orbitron"
          style={{ fontSize: '36px', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
        >
          {currentRound}<span style={{ opacity: 0.4, fontSize: '20px' }}>/{totalRounds}</span>
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginTop: '2px' }}>
          {t('timer.roundOf')}
        </span>
      </div>
      {showCycles && (
        <div style={counterStyle}>
          <span
            className="font-orbitron"
            style={{ fontSize: '36px', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
          >
            {currentCycle}<span style={{ opacity: 0.4, fontSize: '20px' }}>/{totalCycles}</span>
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginTop: '2px' }}>
            {t('timer.cycleOf')}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------- Done Screen ----------

interface DoneScreenProps {
  elapsedSeconds: number;
  totalRounds: number;
  totalCycles: number;
  onRestart: () => void;
  onBack: () => void;
}

function DoneScreen({ elapsedSeconds, totalRounds, totalCycles, onRestart, onBack }: DoneScreenProps) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '24px',
      }}
    >
      <div
        style={{
          fontSize: '80px',
          transform: show ? 'scale(1)' : 'scale(0)',
          transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        ✓
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 700,
          color: '#f59e0b',
          opacity: show ? 1 : 0,
          transition: 'opacity 400ms ease 200ms',
        }}
      >
        {t('timer.done.bravo')}
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          color: '#aaa',
          fontSize: '15px',
          opacity: show ? 1 : 0,
          transition: 'opacity 400ms ease 400ms',
        }}
      >
        <span>{t('timer.done.duration')} : {formatTime(elapsedSeconds)}</span>
        <span>
          {totalRounds} {totalRounds > 1 ? t('timer.done.seriesPlural') : t('timer.done.series')}
          {totalCycles > 1 ? ` × ${totalCycles} ${t('timer.done.cycles')}` : ''}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
          marginTop: '16px',
          opacity: show ? 1 : 0,
          transition: 'opacity 400ms ease 600ms',
        }}
      >
        <button
          onClick={onRestart}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(180deg, #e0e0e0, #b0b0b0, #808080)',
            color: '#000',
            fontSize: '16px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {t('timer.done.restart')}
        </button>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          ← {t('timer.done.backToPresets')}
        </button>
      </div>
    </div>
  );
}

// ---------- Main TimerDisplay ----------

interface TimerDisplayProps {
  state: TimerState;
  presetName: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function TimerDisplay({
  state,
  presetName,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
  onBack,
}: TimerDisplayProps) {
  const { t } = useI18n();
  const [speechOn, setSpeechOn] = useState(isSpeechEnabled());
  const bandsContainerRef = useRef<HTMLDivElement>(null);

  // Toggle speech
  const toggleSpeech = () => {
    const next = !speechOn;
    setSpeechOn(next);
    setSpeechEnabled(next);
  };

  // Auto-scroll active phase into view
  useEffect(() => {
    if (!bandsContainerRef.current) return;
    const activeBand = bandsContainerRef.current.querySelector('[data-phase-status="active"]');
    if (activeBand) {
      activeBand.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.activePhaseIndex]);

  const isIdle = state.status === 'idle';
  const isDone = state.status === 'done';
  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isActive = isRunning || isPaused;

  // Done screen
  if (isDone) {
    return (
      <DoneScreen
        elapsedSeconds={state.elapsedSeconds}
        totalRounds={state.totalRounds}
        totalCycles={state.totalCycles}
        onRestart={onReset}
        onBack={onBack}
      />
    );
  }

  // Full-screen timer (active or idle with preview)
  return (
    <div
      style={{
        position: isActive ? 'fixed' : 'relative',
        inset: isActive ? 0 : undefined,
        zIndex: isActive ? 9999 : undefined,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        height: isActive ? '100dvh' : undefined,
        minHeight: isActive ? undefined : '80dvh',
        overflow: 'hidden',
      }}
    >
      {/* 1. Info bar */}
      <div
        style={{
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #222',
          flexShrink: 0,
        }}
      >
        {/* Left: total time remaining */}
        <span
          style={{
            fontFamily: "ui-monospace, 'Courier New', monospace",
            fontSize: '14px',
            color: '#888',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(state.totalSecondsLeft)}
        </span>

        {/* Center: preset name */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#ccc',
            fontFamily: 'var(--font-display)',
          }}
        >
          {presetName}
        </span>

        {/* Right: speaker toggle */}
        <button
          onClick={toggleSpeech}
          style={{
            background: 'none',
            border: 'none',
            color: speechOn ? '#fff' : '#555',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={speechOn ? t('timer.voiceOn') : t('timer.voiceOff')}
        >
          {speechOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
        </button>
      </div>

      {/* 2. Phase bands */}
      <div
        ref={bandsContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px 12px',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {state.phases.map((phase, i) => (
          <PhaseBand
            key={`${phase.type}-${i}`}
            phase={phase}
            isActive={i === state.activePhaseIndex && isActive}
            secondsLeft={i === state.activePhaseIndex ? state.secondsLeft : phase.duration}
            index={i}
          />
        ))}

        {/* Idle state: show preview bands (all upcoming) */}
        {isIdle && state.phases.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
            {t('timer.noPhase')}
          </div>
        )}
      </div>

      {/* 3. Scoreboard counters */}
      <div style={{ flexShrink: 0, padding: '8px 0' }}>
        <Scoreboard
          currentRound={state.currentRound}
          totalRounds={state.totalRounds}
          currentCycle={state.currentCycle}
          totalCycles={state.totalCycles}
        />
      </div>

      {/* 4. Controls */}
      <div style={{ flexShrink: 0, padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {/* Main button */}
        {isIdle && (
          <button
            onClick={onStart}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(180deg, #e0e0e0, #b0b0b0, #808080)',
              color: '#000',
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {t('timer.controls.start')}
          </button>
        )}
        {isRunning && (
          <button
            onClick={onPause}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '12px',
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {t('timer.controls.pause')}
          </button>
        )}
        {isPaused && (
          <button
            onClick={onResume}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '12px',
              border: 'none',
              background: '#22c55e',
              color: '#000',
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {t('timer.controls.resume')}
          </button>
        )}

        {/* Secondary buttons */}
        {isActive && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={onReset}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                background: '#333',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={t('timer.controls.reset')}
            >
              <ResetIcon />
            </button>
            <button
              onClick={onSkip}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                background: '#333',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={t('timer.controls.skip')}
            >
              <SkipIcon />
            </button>
          </div>
        )}

        {/* Back button on idle */}
        {isIdle && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ← {t('timer.back')}
          </button>
        )}
      </div>
    </div>
  );
}
