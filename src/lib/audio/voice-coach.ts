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

// ─── AudioContext singleton (shared, cohabits with background music) ───

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

// ─── AudioBuffer cache (decoded MP3s) ───

const bufferCache = new Map<string, AudioBuffer>();
const fetchingUrls = new Set<string>();

async function fetchAndDecode(url: string): Promise<AudioBuffer | null> {
  if (bufferCache.has(url)) return bufferCache.get(url)!;
  if (fetchingUrls.has(url)) return null;
  fetchingUrls.add(url);
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const arrayBuf = await resp.arrayBuffer();
    const ctx = getAudioContext();
    const decoded = await ctx.decodeAudioData(arrayBuf);
    bufferCache.set(decoded ? url : '', decoded);
    if (decoded) bufferCache.set(url, decoded);
    // Limit cache to 30 entries
    if (bufferCache.size > 30) {
      const firstKey = bufferCache.keys().next().value;
      if (firstKey) bufferCache.delete(firstKey);
    }
    return decoded;
  } catch {
    return null;
  } finally {
    fetchingUrls.delete(url);
  }
}

function preloadMP3(url: string): void {
  if (bufferCache.has(url)) return;
  fetchAndDecode(url);
}

// ─── Play audio via AudioContext (does NOT interrupt background music) ───

let currentSource: AudioBufferSourceNode | null = null;

function playMP3(url: string): void {
  try {
    if (currentSource) {
      currentSource.stop();
      currentSource = null;
    }
    const cached = bufferCache.get(url);
    if (cached) {
      playBuffer(cached);
    } else {
      fetchAndDecode(url).then((buf) => { if (buf) playBuffer(buf); });
    }
  } catch { /* ignore */ }
}

function playBuffer(buffer: AudioBuffer): void {
  try {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    currentSource = source;
    source.onended = () => { if (currentSource === source) currentSource = null; };
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

// ─── Preload next events ───

export async function preloadNextEvents(categories: string[], lang: string = 'fr'): Promise<void> {
  if (!voiceEnabled) return;
  const manifest = manifests[currentVoice] || await loadManifest(currentVoice);
  if (!manifest) return;
  const langData = manifest[lang] || manifest['fr'];
  if (!langData) return;

  for (const category of categories) {
    const entries = langData[category];
    if (!entries || entries.length === 0) continue;
    const entry = entries[0];
    const url = `/audio/coaching/${currentVoice}/${lang}/${entry.file}`;
    preloadMP3(url);
  }
}

// ─── Convenience: stop current audio ───

export function stopCoachAudio(): void {
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }
}
