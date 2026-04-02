// Timer audio system — single source of truth
// 5 functions + 1 state: playCountdownBeep, speakCountdown, playFinishSound, playSkipBeep, unlockAudio + voiceEnabled

type AnyAudioContext = typeof AudioContext;

function getCtxClass(): AnyAudioContext {
  return window.AudioContext || (window as unknown as { webkitAudioContext: AnyAudioContext }).webkitAudioContext;
}

/* ─── State : voiceEnabled ─── */

let voiceEnabled = true;

export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

export function toggleVoice(): boolean {
  voiceEnabled = !voiceEnabled;
  return voiceEnabled;
}

/** Unlock AudioContext on first user gesture (required for iOS Safari) */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (getCtxClass())();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    setTimeout(() => ctx.close(), 100);
  } catch { /* ignore */ }
}

/* ─── Countdown beeps (voix OFF uniquement) ─── */

const GO_PHRASES = ["Go!", "C'est parti!", "Allez!", "On y va!", "Top!"];

export function playCountdownBeep(secondsRemaining: number): void {
  if (voiceEnabled) return;
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (getCtxClass())();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (secondsRemaining === 3) {
      osc.frequency.value = 660;
      gain.gain.value = 0.4;
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
    } else if (secondsRemaining === 2) {
      osc.frequency.value = 880;
      gain.gain.value = 0.5;
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
    } else if (secondsRemaining === 1) {
      osc.frequency.value = 1100;
      gain.gain.value = 0.55;
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
    } else if (secondsRemaining === 0) {
      osc.frequency.value = 1320;
      gain.gain.value = 0.6;
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      ctx.close();
      return;
    }
    setTimeout(() => ctx.close(), 300);
  } catch { /* ignore */ }
}

/* ─── Speak countdown (voix ON uniquement) ─── */

export function speakCountdown(secondsRemaining: number): void {
  if (!voiceEnabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  let text = '';
  if (secondsRemaining === 3) text = '3';
  else if (secondsRemaining === 2) text = '2';
  else if (secondsRemaining === 1) text = '1';
  else if (secondsRemaining === 0) {
    text = GO_PHRASES[Math.floor(Math.random() * GO_PHRASES.length)];
  } else {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

/* ─── Finish sound (toujours) ─── */

export function playFinishSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (getCtxClass())();
    const freqs = [523, 659, 784]; // Do5, Mi5, Sol5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.5;
      osc.start(ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.35);
      osc.stop(ctx.currentTime + i * 0.2 + 0.35);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch { /* ignore */ }
}

/* ─── Skip beep (toujours) ─── */

export function playSkipBeep(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (getCtxClass())();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.4;
    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 200);
  } catch { /* ignore */ }
}
