'use client';

import { useState, useCallback, useEffect } from 'react';
import Picker from 'react-mobile-picker';
import { useTimerContext, type TimerDisplayConfig } from '@/contexts/TimerContext';
import type { TimerPreset } from '@/hooks/useTimer';
import { unlockAudio } from '@/lib/timer-audio';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { VoiceSelector } from '@/components/timer/VoiceSelector';

/* ─── Constants ─── */

const VALUES = [15, 30, 45, 60, 90, 120];

/** SVG ring */
const SIZE = 60;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 25;
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
  const [pickerValue, setPickerValue] = useState<{ dur: number }>({ dur: 60 });
  const [showDone, setShowDone] = useState(false);

  const duration = pickerValue.dur;

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

  /* ── Actions ── */

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

  /* ── Ring calculations ── */

  const sl = ctx?.state.secondsLeft ?? 0;
  const phase = ctx?.state.phases[ctx.state.activePhaseIndex];
  const totalPhase = phase?.duration ?? 1;
  const fraction = totalPhase > 0 ? (totalPhase - sl) / totalPhase : 0;
  const isPrepare = phase?.type === 'prepare';
  const isLast3 = sl > 0 && sl <= 3 && !isPrepare && isActive;

  let ringStroke: string;
  let ringOffset: number;
  let ringOpacity: number;

  if (showDone) {
    ringStroke = '#22c55e'; ringOffset = 0; ringOpacity = 1;
  } else if (isActive) {
    ringStroke = isPrepare ? '#6366f1' : '#f97316';
    ringOffset = CIRC * fraction;
    ringOpacity = 1;
  } else {
    ringStroke = '#f97316'; ringOffset = 0; ringOpacity = 0.15;
  }

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

      {/* ── Compact timer block ── */}
      <div className="mt-4 mx-1 rounded-2xl overflow-hidden bg-zinc-900/90 border border-zinc-700/30">

        <style>{`
          @keyframes cdp{0%,100%{transform:scale(1)}40%{transform:scale(1.3)}}
          @keyframes vpop{0%{transform:scale(.85);opacity:.5}100%{transform:scale(1);opacity:1}}
          .rest-picker > div:last-child {
            background: rgba(249,115,22,0.06) !important;
            border-radius: 6px !important;
          }
          .rest-picker > div:last-child > div {
            background: rgba(249,115,22,0.3) !important;
          }
        `}</style>

        <div className="flex items-center px-3" style={{ height: 80 }}>

          {/* Label */}
          <div className="flex-none text-[11px] font-semibold tracking-wider uppercase leading-tight"
            style={{ color: '#0891b2', minWidth: 48 }}>
            TIMER<br />REPOS
          </div>

          {/* Picker zone — or stop button during countdown */}
          <div className="flex-1 relative" style={{ height: 80 }}>
            {!inCountdown ? (
              <Picker
                className="rest-picker"
                value={pickerValue}
                onChange={(val) => setPickerValue(val)}
                height={80}
                itemHeight={34}
                wheelMode="natural"
              >
                <Picker.Column name="dur">
                  {VALUES.map(v => (
                    <Picker.Item key={v} value={v}>
                      {({ selected }) => (
                        <span
                          className="font-mono font-bold"
                          style={{
                            fontSize: selected ? 20 : 14,
                            color: selected ? '#f97316' : 'rgba(255,255,255,0.25)',
                            transition: 'all .15s ease',
                          }}
                        >
                          {v}<span className="text-[10px] ml-0.5 opacity-60">s</span>
                        </span>
                      )}
                    </Picker.Item>
                  ))}
                </Picker.Column>
              </Picker>
            ) : isActive && !showDone ? (
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={() => ctx?.stop()}
                  className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.12)' }}
                  aria-label="Stop"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>

          {/* Circle with SVG ring */}
          <button
            onClick={handleTap}
            className="relative flex-none cursor-pointer bg-transparent border-none p-0 select-none active:scale-95 transition-transform ml-2"
            style={{ width: SIZE, height: SIZE }}
            aria-label={showDone ? 'Terminé' : isActive ? 'Pause / Reprendre' : 'Démarrer'}
          >
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{ transform: 'rotate(-90deg)' }}>
              {/* Background track */}
              <circle cx={CX} cy={CY} r={R} fill="none"
                stroke="white" strokeWidth={STROKE} strokeOpacity={0.06} />
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : isActive ? (
                <span
                  key={isLast3 ? `cd-${sl}` : 'stable'}
                  className="font-mono font-bold leading-none"
                  style={{
                    fontSize: isPrepare ? 22 : 15,
                    color: isPrepare ? '#6366f1' : isLast3 ? '#f97316' : '#fff',
                    animation: isLast3 ? 'cdp .3s ease-out' : undefined,
                  }}
                >
                  {isPrepare ? sl : fmtTime(sl)}
                </span>
              ) : (
                <span key={duration} className="font-mono font-bold leading-none"
                  style={{ fontSize: 16, color: '#fff', animation: 'vpop .2s ease-out' }}>
                  {duration}<span className="text-[9px] ml-px opacity-50">s</span>
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] pb-2 -mt-0.5"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {showDone ? 'Terminé !'
            : isActive ? (isPaused ? 'Tap le cercle pour reprendre' : 'Tap le cercle pour pause')
            : 'Tap le cercle pour démarrer'}
        </p>
      </div>

      {/* Voice selector */}
      <VoiceSelector />
    </section>
  );
}
