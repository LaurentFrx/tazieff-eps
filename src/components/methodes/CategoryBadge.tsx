import type { CategorieMethode } from "@/lib/content/schema";

const CATEGORY_STYLES: Record<CategorieMethode, string> = {
  "endurance-de-force": "bg-orange-500/15 text-orange-500 ring-orange-500/30",
  "gain-de-volume": "bg-blue-500/15 text-blue-500 ring-blue-500/30",
  "gain-de-puissance": "bg-green-500/15 text-green-500 ring-green-500/30",
};

type CategoryBadgeProps = {
  categorie: CategorieMethode;
  label: string;
};

export function CategoryBadge({ categorie, label }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${CATEGORY_STYLES[categorie]}`}
    >
      {label}
    </span>
  );
}
