/**
 * Voice Coach — MP3-based coaching audio for timers
 * Replaces speechSynthesis (broken on iOS) with pre-generated MP3s
 */

// ─── Types ───

interface VoiceEntry {
  file: string;
  rarity: 'normal' | 'rare' | 'epic' | 'super-epic';
  text: string;
}

type ManifestData = Record<string, Record<string, VoiceEntry[]>>;

// ─── Constants ───

const VOICES = ['Paul', 'Koraly'] as const;
export type VoiceName = (typeof VOICES)[number];

const RARITY_WEIGHTS: Record<string, number> = {
  'normal': 75,
  'rare': 14,
  'epic': 8,
  'super-epic': 3,
};

const LS_VOICE_KEY = 'eps_coach_voice';
const LS_VOICE_ENABLED = 'eps_coach_enabled';

// ─── State ───

let currentVoice: VoiceName = (() => {
  if (typeof window === 'undefined') return 'Paul';
  const saved = localStorage.getItem(LS_VOICE_KEY);
  if (saved && VOICES.includes(saved as VoiceName)) return saved as VoiceName;
  return 'Paul';
})();

let voiceEnabled: boolean = (() => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(LS_VOICE_ENABLED) !== 'false';
})();

const manifests: Partial<Record<VoiceName, ManifestData>> = {};
const lastPlayed: Record<string, number> = {}; // anti-repetition

// ─── Public API ───

export function getVoice(): VoiceName { return currentVoice; }
export function getAvailableVoices(): readonly string[] { return VOICES; }

export function setVoice(name: VoiceName): void {
  currentVoice = name;
  if (typeof window !== 'undefined') localStorage.setItem(LS_VOICE_KEY, name);
}

export function isCoachEnabled(): boolean { return voiceEnabled; }

export function setCoachEnabled(enabled: boolean): void {
  voiceEnabled = enabled;
  if (typeof window !== 'undefined') localStorage.setItem(LS_VOICE_ENABLED, String(enabled));
}

export function toggleCoach(): boolean {
  const next = !voiceEnabled;
  setCoachEnabled(next);
  return next;
}

// ─── Manifest loading (lazy, cached) ───

async function loadManifest(voice: VoiceName): Promise<ManifestData | null> {
  if (manifests[voice]) return manifests[voice]!;
  try {
    const resp = await fetch(`/audio/coaching/${voice}/manifest.json`);
    if (!resp.ok) return null;
    const data = await resp.json();
    manifests[voice] = data;
    return data;
  } catch { return null; }
}

// Preload on init
if (typeof window !== 'undefined') {
  loadManifest(currentVoice);
}

// ─── Weighted random with anti-repetition ───

function pickEntry(entries: VoiceEntry[], category: string): VoiceEntry | null {
  if (!entries || entries.length === 0) return null;
  if (entries.length === 1) return entries[0];

  // Build weighted pool
  const weighted: { entry: VoiceEntry; idx: number; weight: number }[] = [];
  entries.forEach((entry, idx) => {
    weighted.push({ entry, idx, weight: RARITY_WEIGHTS[entry.rarity] || 75 });
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  const lastIdx = lastPlayed[category] ?? -1;

  // Try up to 5 times to avoid repeating
  for (let attempt = 0; attempt < 5; attempt++) {
    let rand = Math.random() * totalWeight;
    for (const w of weighted) {
      rand -= w.weight;
      if (rand <= 0) {
        if (w.idx !== lastIdx || entries.length === 1) {
          lastPlayed[category] = w.idx;
          return w.entry;
        }
        break; // retry
      }
    }
  }

  // Fallback: just pick any different one
  const fallbackIdx = (lastIdx + 1) % entries.length;
  lastPlayed[category] = fallbackIdx;
  return entries[fallbackIdx];
}

// ─── Play audio ───

let currentAudio: HTMLAudioElement | null = null;

function playMP3(url: string): void {
  try {
    // Stop previous if still playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    const audio = new Audio(url);
    audio.volume = 1.0;
    currentAudio = audio;
    audio.play().catch(() => {});
    audio.onended = () => { if (currentAudio === audio) currentAudio = null; };
  } catch { /* ignore */ }
}

// ─── Main function: play a coaching event ───

export async function playCoachEvent(category: string, lang: string = 'fr'): Promise<void> {
  if (!voiceEnabled) return;
  if (typeof window === 'undefined') return;

  const manifest = manifests[currentVoice] || await loadManifest(currentVoice);
  if (!manifest) return;

  // Try requested language, fallback to FR
  const langData = manifest[lang] || manifest['fr'];
  if (!langData) return;

  const entries = langData[category];
  if (!entries || entries.length === 0) return;

  const entry = pickEntry(entries, `${currentVoice}-${lang}-${category}`);
  if (!entry) return;

  const url = `/audio/coaching/${currentVoice}/${lang}/${entry.file}`;
  playMP3(url);
}

// ─── Convenience: stop current audio ───

export function stopCoachAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
