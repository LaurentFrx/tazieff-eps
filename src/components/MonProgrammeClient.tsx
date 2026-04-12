"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/LocaleLink";
import {
  getGuidedProgress,
  isSessionUnlocked,
  getSessionVisitedCount,
  markSessionCompleted,
  SESSION_ORDER,
  type GuidedProgress,
} from "@/lib/modeStore";
import type { LiveExerciseListItem } from "@/lib/live/types";
import logo from "../../public/media/branding/logo-eps.webp";

/* ── Session definitions ─────────────────────────────────────────── */

type SessionDef = {
  id: string;
  title: string;
  prefix: string;
  color: string;
  icon: string;
  level: string;
};

const SESSIONS: SessionDef[] = [
  { id: "s1", title: "Gainage fondamental",        prefix: "s1-", color: "#f97316", icon: "🔥", level: "Débutant" },
  { id: "s2", title: "Cardio et gainage dynamique", prefix: "s2-", color: "#ef4444", icon: "💨", level: "Débutant" },
  { id: "s3", title: "Haut du corps haltères",      prefix: "s3-", color: "#3b82f6", icon: "💪", level: "Intermédiaire" },
  { id: "s4", title: "Bas du corps",                prefix: "s4-", color: "#22c55e", icon: "🦵", level: "Intermédiaire" },
  { id: "s5", title: "Fonctionnel",                 prefix: "s5-", color: "#a855f7", icon: "⚡", level: "Avancé" },
  { id: "s6", title: "Étirements",                  prefix: "s6-", color: "#ec4899", icon: "🧘", level: "Débutant" },
];

const UNLOCK_THRESHOLD = 0.8; // 80% of exercises visited to unlock next session

/* ── Exercise thumbnail ──────────────────────────────────────────── */

function ExoThumb({ exercise, visited }: { exercise: LiveExerciseListItem; visited: boolean }) {
  const [errored, setErrored] = useState(false);
  return (
    <Link href={`/exercices/${exercise.slug}?guided=1`} className="flex-none w-[110px] snap-start">
      <div className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 bg-zinc-800">
        <Image
          src={errored ? logo : `/images/exos/thumb-${exercise.slug}.webp`}
          alt={exercise.title}
          fill
          sizes="110px"
          className={`object-cover ${errored ? "grayscale opacity-60" : ""}`}
          onError={() => setErrored(true)}
        />
        {visited && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>
      <p className="mt-1 text-[10px] font-semibold text-white/70 leading-tight line-clamp-2">
        {exercise.title}
      </p>
    </Link>
  );
}

/* ── Session card ────────────────────────────────────────────────── */

function SessionCard({
  session,
  exercises,
  progress,
  isActive,
  unlocked,
  onComplete,
}: {
  session: SessionDef;
  exercises: LiveExerciseListItem[];
  progress: GuidedProgress;
  isActive: boolean;
  unlocked: boolean;
  onComplete: () => void;
}) {
  const visitedCount = getSessionVisitedCount(session.id, progress);
  const total = exercises.length;
  const pct = total > 0 ? Math.round((visitedCount / total) * 100) : 0;
  const isCompleted = progress.completed.includes(session.id);

  // Auto-complete if threshold reached
  if (!isCompleted && total > 0 && visitedCount >= Math.ceil(total * UNLOCK_THRESHOLD)) {
    markSessionCompleted(session.id);
    onComplete();
  }

  const firstUnvisited = exercises.find((ex) => !progress.visited.includes(ex.slug));

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: unlocked ? `${session.color}10` : "rgba(255,255,255,0.02)",
        border: isActive ? `2px solid ${session.color}` : unlocked ? `1.5px solid ${session.color}30` : "1.5px solid rgba(255,255,255,0.06)",
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{unlocked ? session.icon : "🔒"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white truncate">
              {session.id.toUpperCase()} — {session.title}
            </h3>
            {isCompleted && <span className="text-green-400 text-xs">✓</span>}
          </div>
          <p className="text-[11px] text-white/40">
            {total} exercices • {session.level}
          </p>
        </div>
        {unlocked && !isCompleted && (
          <Link
            href={firstUnvisited ? `/exercices/${firstUnvisited.slug}?guided=1&session=${session.id}` : `/exercices?session=${session.id}`}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white min-h-[44px] flex items-center"
            style={{ background: session.color }}
          >
            {visitedCount > 0 ? "Continuer" : "Commencer"}
          </Link>
        )}
      </div>

      {/* Progress bar */}
      {unlocked && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: session.color }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-1">{visitedCount}/{total} exercices consultés</p>
        </div>
      )}

      {/* Exercise thumbnails (only for active/unlocked sessions) */}
      {unlocked && isActive && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
          {exercises.map((ex) => (
            <ExoThumb key={ex.slug} exercise={ex} visited={progress.visited.includes(ex.slug)} />
          ))}
        </div>
      )}

      {/* Locked message */}
      {!unlocked && (
        <p className="text-[11px] text-white/25">
          Termine {SESSION_ORDER[SESSION_ORDER.indexOf(session.id as typeof SESSION_ORDER[number]) - 1]?.toUpperCase()} pour débloquer
        </p>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

type Props = {
  exercises: LiveExerciseListItem[];
};

export function MonProgrammeClient({ exercises }: Props) {
  const [progress, setProgress] = useState(getGuidedProgress);
  const [, forceUpdate] = useState(0);

  const sessionExercises = useMemo(() => {
    const map: Record<string, LiveExerciseListItem[]> = {};
    for (const s of SESSIONS) {
      map[s.id] = exercises.filter((ex) => ex.slug.startsWith(s.prefix)).sort((a, b) => a.slug.localeCompare(b.slug));
    }
    return map;
  }, [exercises]);

  // Find first incomplete session
  const activeSessionId = SESSIONS.find(
    (s) => !progress.completed.includes(s.id) && isSessionUnlocked(s.id, progress),
  )?.id ?? SESSIONS[SESSIONS.length - 1].id;

  const handleComplete = () => {
    setProgress(getGuidedProgress());
    forceUpdate((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-28">
      <header>
        <h1 className="text-xl font-bold text-white">Mon programme</h1>
        <p className="text-xs text-white/40 mt-0.5">
          {progress.completed.length}/{SESSIONS.length} séances terminées
        </p>
      </header>

      {SESSIONS.map((s) => (
        <SessionCard
          key={s.id}
          session={s}
          exercises={sessionExercises[s.id] ?? []}
          progress={progress}
          isActive={s.id === activeSessionId}
          unlocked={isSessionUnlocked(s.id, progress)}
          onComplete={handleComplete}
        />
      ))}
    </div>
  );
}
