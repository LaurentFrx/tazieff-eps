"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import flyer from "../../public/media/branding/flyer-eps.webp";
import { useI18n } from "@/lib/i18n/I18nProvider";

// ---------------------------------------------------------------------------
// Pool of 24 accroches (FR-only, hardcoded)
// ---------------------------------------------------------------------------

const ACCROCHE_POOL = [
  "80 exos, 19 méthodes — ton guide muscu dans la poche",
  "Trouve ton exercice en 2 secondes chrono",
  "Endurance, volume ou puissance : à toi de jouer",
  "Chaque série te rapproche de ton objectif",
  "Pas d'excuse, que des résultats 💪",
  "Ton coach numérique pour le BAC EPS",
  "La salle t'attend — on y va ?",
  "Dépasse tes limites, une répétition à la fois",
  "Le secret ? La régularité 🔥",
  "Ta progression commence ici",
  "Un bon échauffement, et c'est parti !",
  "Objectif : être meilleur(e) qu'hier",
  "Chaque rep compte — donne tout !",
  "Prêt(e) à battre ton record ?",
  "L'effort d'aujourd'hui, les résultats de demain",
  "Muscles, méthode, motivation 💪",
  "Construis ton programme, séance par séance",
  "Le BAC EPS se prépare maintenant",
  "Cardio, force ou mixte — choisis ton style",
  "Aucune machine ne te résiste",
  "Transforme l'effort en habitude",
  "Ta meilleure version t'attend en salle",
  "Connais tes muscles, maîtrise tes mouvements",
  "Entraîne-toi malin, progresse vite",
];

const INTERVAL_MS = 5000;

// ---------------------------------------------------------------------------
// Time-based greeting key
// ---------------------------------------------------------------------------

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "pages.home.greetingMorning";
  if (hour >= 12 && hour < 18) return "pages.home.greetingAfternoon";
  if (hour >= 18 && hour < 22) return "pages.home.greetingEvening";
  return "pages.home.greetingNight";
}

// ---------------------------------------------------------------------------
// Fisher-Yates shuffle (pick first N from shuffled copy)
// ---------------------------------------------------------------------------

function pickRandom(pool: string[], count: number): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

// ---------------------------------------------------------------------------
// HomeFlyer
// ---------------------------------------------------------------------------

export function HomeFlyer() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  // Build the 3-phrase list once on mount
  const phrases = useMemo(() => {
    const greeting = t(getGreetingKey());
    const [a1, a2] = pickRandom(ACCROCHE_POOL, 2);
    return [greeting, a1, a2];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <Image
        src={flyer}
        alt="Flyer Muscu'Tazieff"
        priority
        className="h-auto w-full object-contain"
        sizes="(max-width: 768px) 100vw, 1280px"
      />
      <div className="absolute top-0 left-[20%] right-[20%] py-3 overflow-hidden pointer-events-none">
        <span
          key={index}
          className="inline-block whitespace-nowrap text-base md:text-lg font-bold text-white animate-scroll-text"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.5)" }}
        >
          {phrases[index]}
        </span>
      </div>
    </div>
  );
}
