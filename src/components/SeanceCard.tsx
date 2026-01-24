import DifficultyPill from "@/components/DifficultyPill";
import type { SeanceFrontmatter } from "@/lib/content/schema";

type SeanceCardProps = {
  seance: SeanceFrontmatter;
};

export function SeanceCard({ seance }: SeanceCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill">
          {seance.durationMin} min · {seance.blocks.length} blocs
        </span>
        {seance.level ? <DifficultyPill level={seance.level} /> : null}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{seance.title}</h2>
        <p className="text-sm text-[color:var(--muted)]">
          {seance.tags.join(" • ")}
        </p>
      </div>
    </div>
  );
}
