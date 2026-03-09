/* ── Synthetic beep via Web Audio API ─────────────────────────────────── */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function vibrate(pattern: number[]): void {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

/** Play a synthetic beep (sine oscillator, no audio file needed). */
export function playBeep(freq = 880, durationMs = 100, volume = 0.4): void {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

/** Countdown 3-2-1 tick. */
export function beepCountdown(): void {
  playBeep(880, 100);
  vibrate([50]);
}

/** Work phase starts. */
export function beepWork(): void {
  playBeep(880, 200);
  vibrate([200]);
}

/** Rest phase starts. */
export function beepRest(): void {
  playBeep(660, 150);
  setTimeout(() => playBeep(660, 150), 200);
  vibrate([100, 50, 100]);
}

/** Timer done. */
export function beepDone(): void {
  playBeep(880, 300);
  setTimeout(() => playBeep(660, 300), 350);
  setTimeout(() => playBeep(440, 600), 700);
  vibrate([500]);
}
