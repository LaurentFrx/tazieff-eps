"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { ExoThumb } from "@/components/ExoThumb";

type Props = {
  exercises: { slug: string; title: string }[];
  heading: string;
};

export function SessionExercises({ exercises, heading }: Props) {
  if (exercises.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        <span className="border-b-2 border-cyan-400 pb-1">{heading}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {exercises.map((exercise) => (
          <Link
            key={exercise.slug}
            href={`/exercices/${exercise.slug}`}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:bg-white/10"
          >
            <ExoThumb slug={exercise.slug} />
            <div className="min-w-0">
              <span className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">
                {exercise.slug.toUpperCase()}
              </span>
              <span className="block text-sm font-medium text-zinc-200 line-clamp-2">
                {exercise.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
