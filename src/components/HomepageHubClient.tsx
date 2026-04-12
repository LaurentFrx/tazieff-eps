"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/LocaleLink";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFavorites } from "@/hooks/useFavorites";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import logo from "../../public/media/branding/logo-eps.webp";

/* ── Session definitions ─────────────────────────────────────────── */

type SessionDef = {
  id: string;
  title: string;
  prefix: string;
  color: string;
  icon: string;
  level: "debutant" | "intermediaire" | "avance";
};

const SESSIONS: SessionDef[] = [
  { id: "s1", title: "Gainage fondamental",        prefix: "s1-", color: "#f97316", icon: "🔥", level: "debutant" },
  { id: "s2", title: "Cardio et gainage dynamique", prefix: "s2-", color: "#ef4444", icon: "💨", level: "debutant" },
  { id: "s3", title: "Haut du corps haltères",      prefix: "s3-", color: "#3b82f6", icon: "💪", level: "intermediaire" },
  { id: "s4", title: "Bas du corps",                prefix: "s4-", color: "#22c55e", icon: "🦵", level: "intermediaire" },
  { id: "s5", title: "Fonctionnel",                 prefix: "s5-", color: "#a855f7", icon: "⚡", level: "avance" },
  { id: "s6", title: "Étirements",                  prefix: "s6-", color: "#ec4899", icon: "🧘", level: "debutant" },
];

/* ── Tips express ────────────────────────────────────────────────── */

const TIPS = [
  { text: "Le repos entre les séries est aussi important que l'effort.", link: "/apprendre/parametres", label: "Voir les paramètres" },
  { text: "Toujours s'échauffer 5-10 min avant de soulever une charge.", link: "/apprendre/securite", label: "Principes de sécurité" },
  { text: "Le 1RM (Répétition Maximale) est la base de tout programme.", link: "/apprendre/rm-rir-rpe", label: "Comprendre le 1RM" },
  { text: "Un muscle travaille toujours en paire : agoniste et antagoniste.", link: "/apprendre/muscles", label: "Voir l'anatomie" },
  { text: "En musculation, la respiration suit le mouvement : expire à l'effort.", link: "/apprendre/techniques", label: "Techniques de base" },
  { text: "La méthode Pyramidale est idéale pour progresser en charge.", link: "/methodes/pyramidale", label: "Découvrir la méthode" },
  { text: "Le gainage renforce la sangle abdominale sans mouvement.", link: "/exercices?session=s1", label: "Séance gainage" },
  { text: "L'échauffement réduit le risque de blessure de 50%.", link: "/apprendre/securite", label: "En savoir plus" },
];

/* ── Level badges ────────────────────────────────────────────────── */

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const LEVEL_COLORS: Record<string, string> = {
  debutant: "bg-green-500/20 text-green-400",
  intermediaire: "bg-amber-500/20 text-amber-400",
  avance: "bg-rose-500/20 text-rose-400",
};

/* ── Exercise count per session (hardcoded from MDX structure) ──── */

const SESSION_COUNTS: Record<string, number> = {
  s1: 10, s2: 15, s3: 20, s4: 15, s5: 10, s6: 10,
};

/* ── Continue last exercise ──────────────────────────────────────── */

function getLastExercise(): { slug: string; title: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("eps_last_exercise");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

/* ── Main component ──────────────────────────────────────────────── */

type Props = {
  exerciseCount: number;
  methodeCount: number;
  learnCount: number;
};

export function HomepageHubClient({ exerciseCount, methodeCount, learnCount }: Props) {
  const { t } = useI18n();
  const { favorites } = useFavorites();
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const lastExercise = useMemo(getLastExercise, []);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-28">
      <HomeJsonLd />

      {/* ─── A. BANDEAU ACCUEIL ─── */}
      <header>
        <h1 className="text-xl font-bold text-white">
          Choisis ta séance
        </h1>
      </header>

      {/* ─── B. LES 6 SÉANCES (bloc principal, au-dessus de la flottaison) ─── */}
      <section>
        <div className="grid grid-cols-2 gap-3">
          {SESSIONS.map((s) => (
            <Link
              key={s.id}
              href={`/exercices?session=${s.id}`}
              className="flex flex-col gap-1.5 rounded-2xl p-3 text-left transition-all min-h-[44px] tap-feedback"
              style={{
                background: `${s.color}15`,
                border: `1.5px solid ${s.color}40`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-bold text-white/70 uppercase">{s.id.toUpperCase()}</span>
              </div>
              <p className="text-[12px] font-semibold text-white/80 leading-tight">
                {s.title}
              </p>
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-[10px] text-white/40">{SESSION_COUNTS[s.id]} exos</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${LEVEL_COLORS[s.level]}`}>
                  {LEVEL_LABELS[s.level]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── C. CONTINUE TA SÉANCE (conditionnel) ─── */}
      {lastExercise && (
        <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Reprends où tu en étais</p>
          <Link
            href={`/exercices/${lastExercise.slug}`}
            className="flex items-center gap-3 tap-feedback"
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-1 ring-white/10 flex-none bg-zinc-800">
              <Image
                src={`/images/exos/thumb-${lastExercise.slug}.webp`}
                alt={lastExercise.title}
                fill
                sizes="56px"
                className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = logo.src; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{lastExercise.title}</p>
              <p className="text-xs text-orange-400">Continuer →</p>
            </div>
          </Link>
        </section>
      )}

      {/* ─── D. RAPPEL EXPRESS ─── */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/15 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-400/60 mb-1.5">Le savais-tu ?</p>
        <p className="text-sm text-white/70 leading-relaxed">{tip.text}</p>
        <Link href={tip.link} className="inline-block mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          {tip.label} →
        </Link>
      </section>

      {/* ─── E. ACCÈS RAPIDES (grille 2×2 compact) ─── */}
      <section>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/exercices" className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] tap-feedback">
            <span className="text-lg">🏋️</span>
            <div>
              <p className="text-xs font-bold text-white/80">{exerciseCount} Exercices</p>
            </div>
          </Link>
          <Link href="/methodes" className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] tap-feedback">
            <span className="text-lg">📋</span>
            <div>
              <p className="text-xs font-bold text-white/80">{methodeCount} Méthodes</p>
            </div>
          </Link>
          <Link href="/apprendre" className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] tap-feedback">
            <span className="text-lg">📖</span>
            <div>
              <p className="text-xs font-bold text-white/80">{learnCount} Apprendre</p>
            </div>
          </Link>
          <Link href="/parcours-bac" className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] tap-feedback">
            <span className="text-lg">🎓</span>
            <div>
              <p className="text-xs font-bold text-white/80">Parcours BAC</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── F. OUTILS (ligne horizontale) ─── */}
      <section className="flex gap-2">
        <Link href="/outils/timer" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-white/60 tap-feedback">
          ⏱ Timer
        </Link>
        <Link href="/outils/calculateur-rm" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-white/60 tap-feedback">
          🔢 Calculateur RM
        </Link>
        {favorites.length > 0 && (
          <Link href="/exercices?favs=1" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-white/60 tap-feedback">
            ★ Favoris ({favorites.length})
          </Link>
        )}
      </section>
    </div>
  );
}
