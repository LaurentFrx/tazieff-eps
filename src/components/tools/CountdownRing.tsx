'use client';

/* ─── CountdownRing ───
 * SVG circular ring showing phase segments + progress arc,
 * with central time display and a linear phase bar underneath.
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
  // Precompute cumulative offsets for background segments
  const segments: { offset: number; len: number; color: string }[] = [];
  let cumulative = 0;
  for (const p of phases) {
    const frac = p.duration / totalDuration;
    const len = frac * C;
    segments.push({ offset: cumulative, len, color: p.color });
    cumulative += len;
  }

  // Progress arc: fraction of the CURRENT PHASE only
  const phaseElapsed = totalPhaseSeconds - currentSeconds;
  const phaseFraction = totalPhaseSeconds > 0 ? phaseElapsed / totalPhaseSeconds : 0;

  // Total remaining
  const totalRemaining = Math.max(0, totalDuration - totalElapsed);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Layer 1 — Background segments (low opacity) */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeOpacity={0.15}
              strokeDasharray={`${seg.len} ${C - seg.len}`}
              strokeDashoffset={-seg.offset}
            />
          ))}

          {/* Layer 2 — Progress arc (current phase only) */}
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
              transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Central text — overlaid on SVG */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span className="font-mono text-[64px] font-bold leading-none text-zinc-900 dark:text-white">
            {formatTime(currentSeconds)}
          </span>
          <span className="font-mono text-[12px] mt-1 text-zinc-400 dark:text-white/35">
            {formatTime(totalRemaining)} restant
          </span>
        </div>
      </div>

      {/* Phase bar — linear */}
      <div className="flex w-full max-w-[260px] gap-[3px]">
        {phases.map((p, i) => {
          let opacity: number;
          if (i < currentPhaseIndex) opacity = 1;
          else if (i === currentPhaseIndex) opacity = 0.7;
          else opacity = 0.15;

          return (
            <div
              key={i}
              className="h-[8px] rounded-[4px]"
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
