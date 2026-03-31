"use client";

import { useState, useMemo } from "react";
import { LocaleLink } from "@/components/LocaleLink";

type Term = { term: string; definition: string; link?: string };
type Props = { terms: Term[] };

export function LearnGlossary({ terms }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return terms;
    const q = query.toLowerCase();
    return terms.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    );
  }, [terms, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      const arr = map.get(letter) ?? [];
      arr.push(t);
      map.set(letter, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un terme..."
          className="w-full rounded-xl py-[10px] pl-10 pr-[14px] text-[13px] bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-cyan-500/40 transition-colors"
        />
      </div>

      {/* Terms */}
      <div className="rounded-2xl border border-white/[0.06] dark:border-white/[0.06] bg-white/[0.02] dark:bg-white/[0.02] overflow-hidden">
        {grouped.length === 0 && (
          <p className="p-4 text-[12px] text-zinc-500 text-center">Aucun terme trouv\u00e9.</p>
        )}
        {grouped.map(([letter, items]) => (
          <div key={letter}>
            <div className="sticky top-0 z-10 p-[8px_16px] font-mono text-[18px] font-medium text-cyan-600 dark:text-cyan-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              {letter}
            </div>
            {items.map((t) => (
              <div
                key={t.term}
                className="p-[12px_16px]"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <p className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">{t.term}</p>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug mt-1">{t.definition}</p>
                {t.link && (
                  <LocaleLink href={t.link} className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 inline-block hover:underline">
                    En savoir plus \u2192
                  </LocaleLink>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
