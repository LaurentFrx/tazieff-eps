import type { ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";

interface DetailHeaderProps {
  title: string;
  gradient: string;
  backHref: string;
  backLabel: string;
  badges?: ReactNode;
  children?: ReactNode;
}

export function DetailHeader({
  title,
  gradient,
  backHref,
  backLabel,
  badges,
  children,
}: DetailHeaderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-5 pt-4 pb-5 min-h-[120px] flex flex-col gap-3 shadow-lg`}
    >
      <LocaleLink
        href={backHref}
        className="inline-flex items-center gap-1 text-white/80 hover:text-white text-xs font-medium transition-colors self-start min-h-[44px]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M12.5 15l-5-5 5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {backLabel}
      </LocaleLink>
      <div className="flex flex-col gap-2 mt-auto">
        <h1 className="text-2xl font-extrabold text-white drop-shadow-sm leading-tight">
          {title}
        </h1>
        {badges && (
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        )}
      </div>
      {children}
    </div>
  );
}
