"use client";

import { setNavMode, type NavMode } from "@/lib/modeStore";

type Props = {
  onChoose: (mode: NavMode) => void;
};

export function ModeChooser({ onChoose }: Props) {
  const choose = (mode: NavMode) => {
    setNavMode(mode);
    onChoose(mode);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 px-6">
      <h1 className="text-xl font-bold text-white text-center mb-2">
        Comment veux-tu utiliser l'app ?
      </h1>
      <p className="text-sm text-white/40 text-center mb-8">Tu pourras changer dans les réglages</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Mode guidé — card principale */}
        <button
          type="button"
          onClick={() => choose("guide")}
          className="flex flex-col gap-3 rounded-2xl p-5 text-left transition-all tap-feedback min-h-[44px]"
          style={{ background: "rgba(249,115,22,0.12)", border: "2px solid rgba(249,115,22,0.5)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-base font-bold text-white">Mode guidé</p>
              <p className="text-xs text-orange-400 font-semibold">L'app te guide pas à pas</p>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Suis un programme adapté à ton niveau. L'app te dit quoi faire à chaque séance.
          </p>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            Pour les débutants
          </span>
        </button>

        {/* Mode libre — card secondaire */}
        <button
          type="button"
          onClick={() => choose("libre")}
          className="flex flex-col gap-2 rounded-2xl p-4 text-left transition-all tap-feedback min-h-[44px]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.15)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <p className="text-sm font-bold text-white">Mode libre</p>
              <p className="text-xs text-white/50">Tu choisis toi-même</p>
            </div>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Explore tous les exercices et méthodes librement.
          </p>
          <span className="text-[10px] text-white/25 uppercase tracking-wider">
            Pour les expérimentés
          </span>
        </button>
      </div>
    </div>
  );
}
