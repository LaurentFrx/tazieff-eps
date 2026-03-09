/* ── Coaching vocal via SpeechSynthesis API ───────────────────────────── */

const MESSAGES = {
  prepare: { fr: "Préparez-vous", en: "Get ready", es: "Prepárense" },
  work: { fr: "C'est parti !", en: "Go!", es: "¡Vamos!" },
  rest: { fr: "Repos", en: "Rest", es: "Descanso" },
  recovery: { fr: "Récupération", en: "Recovery", es: "Recuperación" },
  three: { fr: "Trois", en: "Three", es: "Tres" },
  two: { fr: "Deux", en: "Two", es: "Dos" },
  one: { fr: "Un", en: "One", es: "Uno" },
  lastRound: {
    fr: "Dernière série !",
    en: "Last round!",
    es: "¡Última serie!",
  },
  done: {
    fr: "Bravo, c'est fini !",
    en: "Great job, you're done!",
    es: "¡Buen trabajo, terminaste!",
  },
} as const;

const LOCALE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

export type SpeechKey = keyof typeof MESSAGES;

/** Speak a coaching message using browser SpeechSynthesis. */
export function speak(key: SpeechKey, locale: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const lang = locale in MESSAGES.prepare ? locale : "fr";
  const text = MESSAGES[key][lang as "fr" | "en" | "es"];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LOCALE_MAP[lang] || "fr-FR";
  utterance.rate = 1.1;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

/** Speak countdown number (3, 2, 1). */
export function speakCountdown(seconds: number, locale: string): void {
  if (seconds === 3) speak("three", locale);
  else if (seconds === 2) speak("two", locale);
  else if (seconds === 1) speak("one", locale);
}
