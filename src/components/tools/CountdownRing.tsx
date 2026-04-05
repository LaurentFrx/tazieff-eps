'use client';

/* ─── CountdownRing ───
 * SVG circular ring showing progress arc for the current phase,
 * with central time display (countdown pulse at 3-2-1)
 * and a linear phase bar underneath.
 */

export interface RingPhase {
  type: string;
  duration: number;
  color: string;
}

export interface CountdownRingProps {
  /** Seconds remaining in the current phase */
  currentSeconds: number;
  /** Total duration of the current phase */
  totalPhaseSeconds: number;
  /** Seconds elapsed since the timer started */
  totalElapsed: number;
  /** Total duration of the entire timer */
  totalDuration: number;
  /** All phases with type, duration and color */
  phases: RingPhase[];
  /** Index of the currently active phase */
  currentPhaseIndex: number;
  /** Active phase color */
  phaseColor: string;
}

const SIZE = 260;
const CX = 130;
const CY = 130;
const R = 118;
const STROKE = 12;
const C = 2 * Math.PI * R; // ~741.4

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function CountdownRing({
  currentSeconds,
  totalPhaseSeconds,
  totalElapsed,
  totalDuration,
  phases,
  currentPhaseIndex,
  phaseColor,
}: CountdownRingProps) {
  // Progress arc: fraction of the CURRENT PHASE only
  const phaseElapsed = totalPhaseSeconds - currentSeconds;
  const phaseFraction = totalPhaseSeconds > 0 ? phaseElapsed / totalPhaseSeconds : 0;

  // Total remaining
  const totalRemaining = Math.max(0, totalDuration - totalElapsed);

  // Countdown pulse at 3, 2, 1
  const isCountdown = currentSeconds > 0 && currentSeconds <= 3;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Keyframes for countdown pulse */}
      <style>{`
        @keyframes cdp{0%,100%{transform:scale(1)}40%{transform:scale(1.3)}}
        @keyframes cdp0{0%,100%{transform:scale(1)}30%{transform:scale(1.5)}}
      `}</style>

      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track — simple gray ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeOpacity={isCountdown ? 0.15 : 0.08}
            style={{ transition: 'stroke-opacity 0.3s ease' }}
          />

          {/* Progress arc (current phase only) */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={phaseColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - phaseFraction)}
            style={{
              transition: isCountdown ? 'stroke 0.3s ease' : 'stroke-dashoffset 0.3s linear, stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Central text — overlaid on SVG */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <div
            key={isCountdown ? `cd-${currentSeconds}` : 'stable'}
            style={{
              animation: isCountdown ? 'cdp 0.3s ease-out' : currentSeconds === 0 ? 'cdp0 0.4s ease-out' : undefined,
            }}
          >
            <span className="font-mono text-[64px] font-bold leading-none text-zinc-900 dark:text-white">
              {formatTime(currentSeconds)}
            </span>
          </div>
          <span className="font-mono text-[12px] mt-1 text-zinc-400 dark:text-white/70">
            {formatTime(totalRemaining)} restant
          </span>
        </div>
      </div>

      {/* Phase bar — linear */}
      <div className="flex w-full max-w-[260px] gap-[4px]">
        {phases.map((p, i) => {
          let opacity: number;
          if (i < currentPhaseIndex) opacity = 1;
          else if (i === currentPhaseIndex) opacity = 0.25;
          else opacity = 0.15;

          return (
            <div
              key={i}
              className="h-[24px] rounded-[12px]"
              style={{
                flex: p.duration,
                background: p.color,
                opacity,
                transition: 'opacity 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
