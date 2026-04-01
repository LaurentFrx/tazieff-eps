// Coaching vocal — diversified speech pools with anti-repetition
// Preferences persisted in localStorage (eps_tts_*)

const SPEECH_POOLS: Record<string, Record<string, string[]>> = {
  fr: {
    prepare: [
      "Préparez-vous",
      "On se met en place",
      "C'est bientôt à vous",
      "Concentration",
      "Allez, on y va bientôt",
      "Positionnez-vous",
      "Attention, ça démarre",
      "En position",
    ],
    work_start: [
      "C'est parti !",
      "Go go go !",
      "Allez, on donne tout !",
      "Envoyez !",
      "C'est maintenant !",
      "À fond !",
      "On y va !",
      "Top départ !",
    ],
    rest_start: [
      "Repos",
      "Soufflez",
      "Récupérez",
      "Pause bien méritée",
      "On reprend son souffle",
      "Relâchez",
      "Hydratez-vous",
      "Détendez-vous",
    ],
    last_round: [
      "Dernière série !",
      "C'est la dernière !",
      "Plus qu'une !",
      "Ultime round !",
      "La der des der !",
      "Tout donner, c'est la dernière !",
      "Allez, dernier effort !",
    ],
    halfway: [
      "Mi-parcours !",
      "La moitié, bravo !",
      "On est à la moitié, courage !",
      "50 pourcent, continuez !",
    ],
    done: [
      "Bravo, c'est fini !",
      "Excellent travail !",
      "Séance terminée, bien joué !",
      "Vous avez tout donné !",
      "C'est dans la boîte !",
      "Chapeau, belle séance !",
      "Mission accomplie !",
    ],
    countdown_3: ["Trois"],
    countdown_2: ["Deux"],
    countdown_1: ["Un"],
  },
  en: {
    prepare: [
      "Get ready",
      "Here we go soon",
      "Stand by",
      "Focus up",
      "Almost time",
      "Get in position",
      "Brace yourself",
      "Lock in",
    ],
    work_start: [
      "Go!",
      "Let's go!",
      "Push it!",
      "Send it!",
      "Time to work!",
      "Give it all!",
      "Now!",
      "Full power!",
    ],
    rest_start: [
      "Rest",
      "Breathe",
      "Take a break",
      "Easy now",
      "Recover",
      "Shake it off",
      "Catch your breath",
      "Chill for a sec",
    ],
    last_round: [
      "Last round!",
      "Final push!",
      "One more!",
      "This is it!",
      "Finish strong!",
      "The last one!",
      "Everything you've got!",
    ],
    halfway: [
      "Halfway there!",
      "50 percent done!",
      "Half done, keep going!",
      "Midpoint, nice work!",
    ],
    done: [
      "Great job, you're done!",
      "Awesome workout!",
      "Session complete!",
      "Crushed it!",
      "You did it!",
      "Beast mode complete!",
      "Nailed it!",
    ],
    countdown_3: ["Three"],
    countdown_2: ["Two"],
    countdown_1: ["One"],
  },
  es: {
    prepare: [
      "Prepárense",
      "Casi empezamos",
      "En posición",
      "Concentración",
      "Listos",
      "Atención, ya casi",
      "A prepararse",
      "En sus marcas",
    ],
    work_start: [
      "¡Vamos!",
      "¡A darle!",
      "¡Ya!",
      "¡Con todo!",
      "¡Ahora!",
      "¡Fuego!",
      "¡Dale con fuerza!",
      "¡Arriba!",
    ],
    rest_start: [
      "Descanso",
      "Respira",
      "Recupera",
      "Relájate",
      "Tómate un respiro",
      "Pausa",
      "Hidrátate",
      "Suelta la tensión",
    ],
    last_round: [
      "¡Última serie!",
      "¡La última!",
      "¡Queda una!",
      "¡Último esfuerzo!",
      "¡A terminar con todo!",
      "¡La final!",
    ],
    halfway: [
      "¡Mitad del camino!",
      "¡50 por ciento!",
      "¡Vamos, la mitad ya!",
      "¡Medio recorrido!",
    ],
    done: [
      "¡Buen trabajo, terminaste!",
      "¡Excelente sesión!",
      "¡Sesión completada!",
      "¡Lo lograste!",
      "¡Increíble esfuerzo!",
      "¡Misión cumplida!",
    ],
    countdown_3: ["Tres"],
    countdown_2: ["Dos"],
    countdown_1: ["Uno"],
  },
};

/* ─── localStorage keys ─── */

const LS_ENABLED = 'eps_tts_enabled';
const LS_VOICE = 'eps_tts_voice';
const LS_RATE = 'eps_tts_rate';

function isBrowser() {
  return typeof window !== 'undefined';
}

/* ─── Enabled state (persisted) ─── */

let speechEnabled: boolean = (() => {
  if (!isBrowser()) return true;
  const raw = localStorage.getItem(LS_ENABLED);
  return raw !== 'false'; // default true
})();

export function setSpeechEnabled(enabled: boolean): void {
  speechEnabled = enabled;
  if (isBrowser()) localStorage.setItem(LS_ENABLED, String(enabled));
}

export function isSpeechEnabled(): boolean {
  return speechEnabled;
}

/* ─── Rate (persisted) ─── */

export function getSpeechRate(): number {
  if (!isBrowser()) return 1.1;
  const raw = localStorage.getItem(LS_RATE);
  if (raw) {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= 0.5 && n <= 2) return n;
  }
  return 1.1;
}

export function setSpeechRate(rate: number): void {
  if (isBrowser()) localStorage.setItem(LS_RATE, String(rate));
}

/* ─── Voice URI (persisted) ─── */

export function getSpeechVoiceURI(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LS_VOICE);
}

export function setSpeechVoiceURI(uri: string | null): void {
  if (!isBrowser()) return;
  if (uri) localStorage.setItem(LS_VOICE, uri);
  else localStorage.removeItem(LS_VOICE);
}

/* ─── Voice resolution ─── */

function resolveVoice(locale: string): SpeechSynthesisVoice | undefined {
  if (!isBrowser() || !window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;

  // Try user-preferred voice
  const savedURI = getSpeechVoiceURI();
  if (savedURI) {
    const found = voices.find((v) => v.voiceURI === savedURI);
    if (found) return found;
  }

  // Fallback: best match for locale
  const langTag = locale === 'es' ? 'es' : locale === 'en' ? 'en' : 'fr';
  return voices.find((v) => v.lang.startsWith(langTag)) || undefined;
}

/* ─── Core speak function ─── */

const lastSpoken: Record<string, number> = {};

function speak(text: string, locale: string): void {
  if (!isBrowser() || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === 'es' ? 'es-ES' : locale === 'en' ? 'en-US' : 'fr-FR';
  utterance.rate = getSpeechRate();
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voice = resolveVoice(locale);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function speakEvent(event: string, locale = 'fr'): void {
  if (!speechEnabled) return;

  const pool = SPEECH_POOLS[locale]?.[event] || SPEECH_POOLS['fr']?.[event];
  if (!pool || pool.length === 0) return;

  const lastIndex = lastSpoken[event] ?? -1;
  let index: number;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (index === lastIndex && pool.length > 1);

  lastSpoken[event] = index;
  speak(pool[index], locale);
}

/** Speak arbitrary text (for preview in settings) */
export function speakPreview(text: string, locale = 'fr'): void {
  speak(text, locale);
}

/** Get a random "done" message for the end screen */
export function getRandomDoneMessage(locale = 'fr'): string {
  const pool = SPEECH_POOLS[locale]?.done || SPEECH_POOLS['fr'].done;
  return pool[Math.floor(Math.random() * pool.length)];
}
