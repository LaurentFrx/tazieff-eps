'use client';

import { useEffect, useRef, useState } from 'react';
import type { PhaseEntry, TimerState } from '@/hooks/useTimer';
import { isSpeechEnabled, setSpeechEnabled } from '@/lib/audio/speech';
import { useI18n } from '@/lib/i18n/I18nProvider';

// ---------- Phase gradients (Sport Vibrant) ----------

const PHASE_GRADIENTS: Record<string, { from: string; to: string }> = {
  prepare:  { from: '#2563eb', to: '#6366f1' },  // blue-600  → indigo-500  (= card Méthodes)
  work:     { from: '#f97316', to: '#fbbf24' },  // orange-500 → amber-400  (= card Exercices)
  rest:     { from: '#7c3aed', to: '#d946ef' },  // violet-600 → fuchsia-500 (= card BAC)
  recovery: { from: '#22c55e', to: '#34d399' },  // green-500  → emerald-400 (= card Apprendre)
  cooldown: { from: '#22d3ee', to: '#14b8a6' },  // cyan-400  → teal-500
};

function getGradient(type: string) {
  return PHASE_GRADIENTS[type] || PHASE_GRADIENTS.work;
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
  const g = getGradient(phase.type);
  const isDone = phase.status === 'done';
  const showCountdown = isActive && secondsLeft <= 3 && secondsLeft > 0;
  const scale = showCountdown ? 1 + (4 - secondsLeft) * 0.1 : 1;

  // ── Done band: compressed, gray ──
  if (isDone) {
    return (
      <div
        className="timer-band"
        style={{
          flex: '0 0 auto',
          height: '36px',
          borderRadius: '12px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, #374151, #4b5563)',
          color: '#fff',
          opacity: 0.5,
          transition: 'all 300ms ease',
        }}
        data-phase-status="done"
        data-phase-type={phase.type}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'line-through',
          }}
        >
          {t(`timer.phases.${phase.type}`)}
          {phase.roundIndex != null && (
            <span style={{ opacity: 0.5, fontStyle: 'normal', fontWeight: 400, marginLeft: '6px' }}>
              R{phase.roundIndex}
            </span>
          )}
        </span>
        <span
          style={{
            fontFamily: "ui-monospace, 'Courier New', monospace",
            fontWeight: 700,
            fontSize: '13px',
            opacity: 0.5,
          }}
        >
          00:00
        </span>
      </div>
    );
  }

  // ── Active band: large, dominant ──
  if (isActive) {
    return (
      <div
        className="timer-band"
        style={{
          flex: '1 1 auto',
          minHeight: '200px',
          borderRadius: '24px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          transition: 'all 300ms ease',
        }}
        data-phase-status="active"
        data-phase-type={phase.type}
      >
        {/* Heartbeat pulse overlay for WORK */}
        {phase.type === 'work' && (
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

        {/* Phase transition flash */}
        <div
          className="timer-flash-overlay"
          key={`flash-${index}-active`}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            borderRadius: 'inherit',
            animation: 'timer-flash 300ms ease-out forwards',
            pointerEvents: 'none',
          }}
        />

        {/* Phase label */}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: '20px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {t(`timer.phases.${phase.type}`)}
        </span>

        {/* Giant countdown */}
        <span
          className="font-orbitron"
          style={{
            fontSize: 'clamp(72px, 20vw, 120px)',
            fontWeight: 900,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transform: `scale(${scale})`,
            transition: 'transform 200ms ease',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {formatTime(secondsLeft)}
        </span>

        {/* Round info */}
        {phase.roundIndex != null && (
          <span
            style={{
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              opacity: 0.8,
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
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

  // ── Upcoming band: compact, gradient with dark overlay ──
  return (
    <div
      className="timer-band"
      style={{
        flex: '0 0 auto',
        height: '56px',
        borderRadius: '16px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(to right, ${g.from}, ${g.to})`,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
        transition: 'all 300ms ease',
        animationDelay: `${index * 30}ms`,
      }}
      data-phase-status="upcoming"
      data-phase-type={phase.type}
    >
      {/* Dark overlay for subtlety */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.10)',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }}
      />

      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {t(`timer.phases.${phase.type}`)}
        {phase.roundIndex != null && (
          <span style={{ opacity: 0.7, fontStyle: 'normal', fontWeight: 400, marginLeft: '6px' }}>
            R{phase.roundIndex}
          </span>
        )}
      </span>
      <span
        style={{
          fontFamily: "ui-monospace, 'Courier New', monospace",
          fontWeight: 700,
          fontSize: '15px',
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {formatTime(phase.duration)}
      </span>
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

  return (
    <div style={{ display: 'flex', gap: '12px', padding: '0 12px' }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 50%, #0a0a1e 100%)',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          ...(showCycles ? {} : { maxWidth: '200px', margin: '0 auto' }),
        }}
      >
        <span
          className="font-orbitron"
          style={{ fontSize: '32px', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
        >
          {currentRound}<span style={{ opacity: 0.4, fontSize: '18px' }}>/{totalRounds}</span>
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginTop: '2px' }}>
          {t('timer.roundOf')}
        </span>
      </div>
      {showCycles && (
        <div
          style={{
            background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 50%, #0a0a1e 100%)',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '8px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <span
            className="font-orbitron"
            style={{ fontSize: '32px', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
          >
            {currentCycle}<span style={{ opacity: 0.4, fontSize: '18px' }}>/{totalCycles}</span>
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
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-6">
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

  // Lock body scroll when timer is active (hides content behind fullscreen)
  useEffect(() => {
    if (isActive || isDone) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isActive, isDone]);

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
      className={isActive ? 'fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col' : 'relative flex flex-col'}
      style={{
        height: isActive ? '100dvh' : undefined,
        minHeight: isActive ? undefined : '80dvh',
        background: isActive ? undefined : '#0a0a0a',
      }}
    >
      {/* 1. Info bar — flex-none h-10 */}
      <div
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #222',
          flexShrink: 0,
        }}
      >
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

      {/* 2. Phase bands — flex-1, scrollable */}
      <div
        ref={bandsContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
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

        {isIdle && state.phases.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
            {t('timer.noPhase')}
          </div>
        )}
      </div>

      {/* 3. Scoreboard — flex-none */}
      <div style={{ flexShrink: 0, padding: '6px 0' }}>
        <Scoreboard
          currentRound={state.currentRound}
          totalRounds={state.totalRounds}
          currentCycle={state.currentCycle}
          totalCycles={state.totalCycles}
        />
      </div>

      {/* 4. Controls — flex-none, safe-area bottom padding */}
      <div
        style={{
          flexShrink: 0,
          padding: '8px 16px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))',
        }}
      >
        {/* Idle: START + back */}
        {isIdle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
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
          </div>
        )}

        {/* Active: single row  [Reset]  [  PAUSE/RESUME  ]  [Skip] */}
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onReset}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: '#374151',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label={t('timer.controls.reset')}
            >
              <ResetIcon />
            </button>

            {isRunning ? (
              <button
                onClick={onPause}
                style={{
                  flex: 1,
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
            ) : (
              <button
                onClick={onResume}
                style={{
                  flex: 1,
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

            <button
              onClick={onSkip}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: '#374151',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label={t('timer.controls.skip')}
            >
              <SkipIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
