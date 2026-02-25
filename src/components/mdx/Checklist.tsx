"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type ChecklistProps = {
  slug: string;
  items: string[];
};

export function Checklist({ slug, items }: ChecklistProps) {
  const { t } = useI18n();
  const storageKey = `checklist-${slug}`;
  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(items.length).fill(false),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setChecked(
            items.map((_, i) => (typeof parsed[i] === "boolean" ? parsed[i] : false)),
          );
        }
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, items.length]);

  function toggle(index: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* quota */
      }
      return next;
    });
  }

  function reset() {
    const fresh = new Array(items.length).fill(false) as boolean[];
    setChecked(fresh);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  const anyChecked = mounted && checked.some(Boolean);

  return (
    <div className="my-4">
      <ul className="list-none space-y-2 pl-0">
        {items.map((item, i) => {
          const isChecked = mounted ? (checked[i] ?? false) : false;
          return (
            <li key={i} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(i)}
                className="mt-1 shrink-0 accent-[color:var(--accent)] cursor-pointer"
              />
              <span
                className={
                  isChecked
                    ? "line-through text-[color:var(--muted)] opacity-50"
                    : "text-[color:var(--muted)]"
                }
              >
                {item}
              </span>
            </li>
          );
        })}
      </ul>
      {anyChecked && (
        <button
          type="button"
          onClick={reset}
          className="mt-2 text-xs text-[color:var(--muted)] underline hover:text-[color:var(--ink)] transition-colors"
        >
          {t("checklist.reset")}
        </button>
      )}
    </div>
  );
}
