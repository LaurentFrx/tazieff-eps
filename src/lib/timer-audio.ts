// Timer audio system — beeps & tones only
// Voice coaching is handled by @/lib/audio/speech

import { isSpeechEnabled } from '@/lib/audio/speech';

/* ─── Singleton AudioContext ─── */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
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
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch { /* ignore */ }
}

/* ─── Helper: play a sine tone on the singleton ctx ─── */

function playTone(frequency: number, duration: number, volume: number): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* ignore */ }
}

/* ─── Countdown beeps (voix OFF uniquement) ─── */

export function playCountdownBeep(secondsRemaining: number): void {
  if (isSpeechEnabled()) return; // voix ON = pas de bips
  if (typeof window === 'undefined') return;
  if (secondsRemaining === 3) playTone(660, 0.12, 0.4);
  else if (secondsRemaining === 2) playTone(880, 0.12, 0.5);
  else if (secondsRemaining === 1) playTone(1100, 0.12, 0.55);
  else if (secondsRemaining === 0) playTone(1320, 0.25, 0.6);
}

/* ─── Finish sound (toujours) ─── */

export function playFinishSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    const freqs = [523, 659, 784]; // Do5, Mi5, Sol5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
      gain.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.35);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.35);
    });
  } catch { /* ignore */ }
}

/* ─── Skip beep (toujours) ─── */

export function playSkipBeep(): void {
  if (typeof window === 'undefined') return;
  playTone(880, 0.15, 0.4);
}
