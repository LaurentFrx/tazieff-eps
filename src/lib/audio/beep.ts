// Audio utilities — beep tones + haptic feedback (with iOS fallback)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // Resume if suspended (Safari requires user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Unlock AudioContext on first user gesture (required for iOS Safari) */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    // Create a silent buffer to unlock
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // Ignore errors on unlock attempt
  }
}

/** Play a beep tone */
export function playBeep(
  frequency = 880,
  duration = 0.15,
  volume = 0.5,
): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

/** Play a low-frequency "thump" — iOS vibration fallback */
function playThump(pattern: 'tap' | 'double' | 'heavy'): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const configs: Record<string, { dur: number; gain: number; count: number; gap: number }> = {
      tap: { dur: 0.06, gain: 0.6, count: 1, gap: 0 },
      double: { dur: 0.04, gain: 0.5, count: 2, gap: 0.06 },
      heavy: { dur: 0.15, gain: 0.9, count: 1, gap: 0 },
    };

    const cfg = configs[pattern];
    for (let i = 0; i < cfg.count; i++) {
      const offset = i * (cfg.dur + cfg.gap);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now + offset);
      gain.gain.setValueAtTime(cfg.gain, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + cfg.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + cfg.dur);
    }
  } catch {
    // Audio not available
  }
}

/** Haptic feedback — native vibration on Android, audio thump on iOS */
export function hapticFeedback(pattern: 'tap' | 'double' | 'heavy'): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    const patterns: Record<string, number[]> = {
      tap: [50],
      double: [80, 40, 80],
      heavy: [400],
    };
    navigator.vibrate(patterns[pattern]);
  } else {
    playThump(pattern);
  }
}

/** Countdown beeps — high pitch for 3/2/1, higher for GO */
export function playCountdownBeep(secondsLeft: number): void {
  if (secondsLeft > 0 && secondsLeft <= 3) {
    playBeep(660, 0.12, 0.4);
  } else if (secondsLeft === 0) {
    playBeep(1200, 0.25, 0.6);
  }
}

/** Phase transition beep */
export function playTransitionBeep(): void {
  playBeep(1000, 0.2, 0.55);
}
