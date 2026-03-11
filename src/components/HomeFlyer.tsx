"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import flyer from "../../public/media/branding/flyer-eps.webp";

const PHRASES = [
  "Prêt(e) à tout donner aujourd'hui ?",
  "80 exos, 19 méthodes — ton guide muscu dans la poche",
  "Trouve ton exercice en 2 secondes chrono",
  "Endurance, volume ou puissance : à toi de jouer",
  "Chaque série te rapproche de ton objectif",
  "Pas d'excuse, que des résultats \u{1F4AA}",
  "Ton coach numérique pour le BAC EPS",
  "La salle t'attend — on y va ?",
];

const INTERVAL_MS = 5000;

export function HomeFlyer() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

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
          {PHRASES[index]}
        </span>
      </div>
    </div>
  );
}
