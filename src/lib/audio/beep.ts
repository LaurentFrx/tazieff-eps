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

/** Countdown beeps — pitch rises at 2s, 1s, 0s */
export function playCountdownBeep(secondsLeft: number): void {
  if (secondsLeft === 2) playBeep(600, 0.1, 0.4);
  else if (secondsLeft === 1) playBeep(800, 0.1, 0.5);
  else if (secondsLeft === 0) playBeep(1000, 0.15, 0.6);
}

/** Phase transition beep — slightly louder */
export function playTransitionBeep(): void {
  playBeep(1000, 0.2, 0.65);
}

/** Double beep at end of a round */
export function playRoundEndBeep(): void {
  playBeep(880, 0.12, 0.5);
  setTimeout(() => playBeep(1100, 0.12, 0.5), 150);
}

/** Expressive finish sound — ascending triad Do5-Mi5-Sol5 */
export function playFinishSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    const freqs = [523, 659, 784]; // C5, E5, G5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.6, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.4);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.4);
    });
  } catch {
    // Audio not available
  }
}
