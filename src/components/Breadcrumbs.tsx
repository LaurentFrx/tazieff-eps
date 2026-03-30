"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-[var(--muted)] overflow-hidden">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && (
                <span aria-hidden="true" className="shrink-0">
                  ›
                </span>
              )}
              {isLast || !item.href ? (
                <span className="truncate font-medium text-[var(--ink)]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="shrink-0 hover:underline hover:text-[var(--accent)] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
