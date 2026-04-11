'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/timer-audio';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { VoiceSelector } from '@/components/timer/VoiceSelector';

/* ─── Constants ─── */

const VALUES = [15, 30, 45, 60, 90, 120];
const DEFAULT_INDEX = 3; // 60s

/** Circle-ring dimensions */
const SIZE = 62;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 26;
const STROKE = 4;
const CIRC = 2 * Math.PI * R;

/* ─── Helpers ─── */

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function mkPreset(dur: number): TimerPreset {
  return {
    name: 'REPOS', prepareDuration: 3, workDuration: dur,
    restDuration: 0, rounds: 1, cycles: 1,
    recoveryDuration: 0, restBetweenDuration: 0, cooldownDuration: 0,
  };
}

function mkConfig(dur: number): TimerDisplayConfig {
  return {
    ringPhases: [{ type: 'rest', duration: dur, color: '#f97316' }],
    ringTotal: dur,
    phaseColorMap: { prepare: '#6366f1', work: '#f97316' },
    phaseGradientMap: {
      prepare: 'linear-gradient(135deg, #4f46e5, #6366f1)',
      work: 'linear-gradient(135deg, #ea580c, #f97316)',
    },
  };
}

/* ─── Component ─── */

interface ReposTimerProps { onBack: () => void }

export function ReposTimer({ onBack }: ReposTimerProps) {
  const { t } = useI18n();
  const ctx = useTimerContext();
  const [idx, setIdx] = useState(DEFAULT_INDEX);
  const [showDone, setShowDone] = useState(false);
  const touchX = useRef(0);
  const touchY = useRef(0);
  const didSwipe = useRef(false);

  const duration = VALUES[idx];

  /* ── Done flash (green ring 2 s) ── */

  useEffect(() => {
    if (ctx?.state.status === 'done' && ctx.timerType === 'repos') setShowDone(true);
  }, [ctx?.state.status, ctx?.timerType]);

  useEffect(() => {
    if (!showDone) return;
    const id = setTimeout(() => setShowDone(false), 2000);
    return () => clearTimeout(id);
  }, [showDone]);

  /* ── Derived state ── */

  const isActive = !!(ctx?.isActive && ctx.timerType === 'repos');
  const inCountdown = isActive || showDone;
  const isPaused = ctx?.state.status === 'paused';

  /* ── Timer actions ── */

  const start = useCallback(() => {
    unlockAudio();
    ctx?.startTimer('repos', mkPreset(duration), mkConfig(duration));
  }, [ctx, duration]);

  const handleTap = useCallback(() => {
    if (showDone) return;
    if (!isActive) start();
    else if (ctx?.state.status === 'running') ctx.pause();
    else if (isPaused) ctx?.resume();
  }, [isActive, showDone, ctx, isPaused, start]);

  const handleBack = useCallback(() => {
    if (isActive) ctx?.stop();
    onBack();
  }, [isActive, ctx, onBack]);

  /* ── Swipe gestures (horizontal only) ── */

  const onTS = useCallback((e: React.TouchEvent) => {
    if (inCountdown) return;
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
    didSwipe.current = false;
  }, [inCountdown]);

  const onTM = useCallback((e: React.TouchEvent) => {
    if (inCountdown || didSwipe.current) return;
    const dx = e.touches[0].clientX - touchX.current;
    const dy = e.touches[0].clientY - touchY.current;
    if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
    didSwipe.current = true;
    setIdx(i => dx < 0 ? Math.min(i + 1, VALUES.length - 1) : Math.max(i - 1, 0));
  }, [inCountdown]);

  /* ── Ring state from context ── */

  const sl = ctx?.state.secondsLeft ?? 0;
  const phase = ctx?.state.phases[ctx.state.activePhaseIndex];
  const totalPhase = phase?.duration ?? 1;
  const fraction = totalPhase > 0 ? (totalPhase - sl) / totalPhase : 0;
  const isPrepare = phase?.type === 'prepare';
  const isLast3 = sl > 0 && sl <= 3 && !isPrepare && isActive;

  // Ring color & offset
  let ringStroke: string;
  let ringOffset: number;
  let ringOpacity: number;

  if (showDone) {
    ringStroke = '#22c55e'; ringOffset = 0; ringOpacity = 1;
  } else if (isActive) {
    ringStroke = isPrepare ? '#6366f1' : '#f97316';
    ringOffset = CIRC * fraction; // depletes as time passes
    ringOpacity = 1;
  } else {
    ringStroke = 'currentColor'; ringOffset = 0; ringOpacity = 0.15;
  }

  const prevVal = idx > 0 ? VALUES[idx - 1] : null;
  const nextVal = idx < VALUES.length - 1 ? VALUES[idx + 1] : null;

  /* ─── Render ─── */

  return (
    <section className="page">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
        <button onClick={handleBack}
          className="text-[13px] text-white/70 mb-2 cursor-pointer bg-transparent border-none">
          ← Retour
        </button>
        <h1 className="text-[22px] font-bold text-white">{t('timer.presets.repos.name')}</h1>
        <p className="text-[12px] text-white/70 mt-0.5">Chrono de repos entre séries</p>
      </div>

      {/* ── Compact timer line — 70 px ── */}
      <div
        className="flex items-center mt-4 px-4"
        style={{ height: 70 }}
        onTouchStart={onTS}
        onTouchMove={onTM}
      >
        {/* Label */}
        <div className="flex-none text-[11px] font-semibold tracking-wider uppercase leading-tight mr-4"
          style={{ color: '#0891b2' }}>
          TIMER<br />REPOS
        </div>

        {/* Swipeable picker area */}
        <div className="flex-1 flex items-center justify-center">

          {/* Previous value */}
          <button
            className="font-mono text-[18px] font-bold transition-all duration-300 select-none bg-transparent border-none cursor-pointer p-0"
            style={{
              opacity: inCountdown ? 0 : (prevVal !== null ? 0.25 : 0),
              transform: `translateX(${inCountdown ? '-10px' : '0'})`,
              minWidth: 36, textAlign: 'right' as const,
              pointerEvents: inCountdown || prevVal === null ? 'none' : 'auto',
            }}
            onClick={() => prevVal !== null && setIdx(i => i - 1)}
            tabIndex={-1}
            aria-hidden
          >
            {prevVal ?? ''}
          </button>

          {/* ── Center circle (ring + value) ── */}
          <button
            onClick={handleTap}
            className="relative flex-none mx-3 cursor-pointer bg-transparent border-none p-0 select-none active:scale-95 transition-transform"
            style={{ width: SIZE, height: SIZE }}
            aria-label={showDone ? 'Terminé' : isActive ? 'Pause / Reprendre' : 'Démarrer le timer'}
          >
            <style>{`
              @keyframes cdp{0%,100%{transform:scale(1)}40%{transform:scale(1.3)}}
              @keyframes vpop{0%{transform:scale(0.85);opacity:.5}100%{transform:scale(1);opacity:1}}
            `}</style>

            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{ transform: 'rotate(-90deg)' }}>
              {/* Background track */}
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="currentColor" strokeWidth={STROKE} strokeOpacity={0.06} />
              {/* Active / progress arc */}
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke={ringStroke} strokeWidth={STROKE} strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={ringOffset}
                strokeOpacity={ringOpacity}
                style={{ transition: 'stroke-dashoffset .3s linear, stroke .3s ease, stroke-opacity .3s ease' }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              {showDone ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : isActive ? (
                <span
                  key={isLast3 ? `cd-${sl}` : 'stable'}
                  className="font-mono font-bold leading-none"
                  style={{
                    fontSize: isPrepare ? 24 : 15,
                    color: isPrepare ? '#6366f1' : isLast3 ? '#f97316' : undefined,
                    animation: isLast3 ? 'cdp .3s ease-out' : undefined,
                  }}
                >
                  {isPrepare ? sl : fmtTime(sl)}
                </span>
              ) : (
                <span key={duration} className="font-mono font-bold leading-none"
                  style={{ fontSize: 16, animation: 'vpop .2s ease-out' }}>
                  {duration}<span className="text-[9px] ml-px opacity-40">s</span>
                </span>
              )}
            </div>
          </button>

          {/* Next value — or stop button during countdown */}
          {isActive && !showDone ? (
            <button
              onClick={() => ctx?.stop()}
              className="flex-none w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer ml-1"
              style={{ background: 'rgba(239,68,68,.12)' }}
              aria-label="Stop"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="font-mono text-[18px] font-bold transition-all duration-300 select-none bg-transparent border-none cursor-pointer p-0"
              style={{
                opacity: inCountdown ? 0 : (nextVal !== null ? 0.25 : 0),
                transform: `translateX(${inCountdown ? '10px' : '0'})`,
                minWidth: 36, textAlign: 'left' as const,
                pointerEvents: inCountdown || nextVal === null ? 'none' : 'auto',
              }}
              onClick={() => nextVal !== null && setIdx(i => i + 1)}
              tabIndex={-1}
              aria-hidden
            >
              {nextVal ?? ''}
            </button>
          )}
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[11px] mt-1.5 text-zinc-400 dark:text-zinc-500">
        {showDone ? 'Terminé !'
          : isActive ? (isPaused ? 'Tap pour reprendre' : 'Tap pour pause')
          : 'Swipe ← → · Tap pour démarrer'}
      </p>

      {/* Voice selector */}
      <VoiceSelector />
    </section>
  );
}
