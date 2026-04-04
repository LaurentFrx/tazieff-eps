"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { search, type SearchResultGroup } from "@/lib/search/search";
import type { SearchEntry } from "@/lib/search/search-index";
import { ExoThumb } from "@/components/ExoThumb";

/* ── Type icons (inline SVG, pas de dep lucide) ──────────────────── */

const TYPE_ICONS: Record<SearchEntry["type"], () => React.ReactNode> = {
  exercice: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
    </svg>
  ),
  methode: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" />
    </svg>
  ),
  apprendre: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
    </svg>
  ),
  glossaire: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  ),
};

const TYPE_LABEL_KEYS: Record<SearchEntry["type"], string> = {
  exercice: "search.typeExercice",
  methode: "search.typeMethode",
  apprendre: "search.typeApprendre",
  glossaire: "search.typeGlossaire",
};

/* ── Component ───────────────────────────────────────────────────── */

export function HomeSearchBar() {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [open, setOpen] = useState(false);

  // Debounced search (200ms)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => setResults(search(query)), 200);
    return () => clearTimeout(id);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
      setQuery("");
    },
    [router],
  );

  const hasResults = results.length > 0;
  const showEmpty = open && query.trim().length >= 2 && !hasResults;
  const showDropdown = open && (hasResults || showEmpty);

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur transition-colors focus-within:border-white/25 focus-within:bg-white/10">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[color:var(--muted)]">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent text-sm text-[color:var(--ink)] placeholder:text-[color:var(--muted)] outline-none"
          placeholder={t("pages.home.searchPlaceholder")}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="shrink-0 text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors bg-transparent border-none cursor-pointer p-0"
            aria-label="Clear"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-white/10 bg-[#0f1024] shadow-2xl shadow-black/50 overflow-hidden max-h-[60vh] overflow-y-auto">
          {showEmpty && (
            <p className="px-4 py-3 text-sm text-[color:var(--muted)]">
              {t("search.noResults")}
            </p>
          )}
          {results.map((group) => {
            const Icon = TYPE_ICONS[group.type];
            return (
              <div key={group.type}>
                <div className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted)]">
                  <Icon />
                  {t(TYPE_LABEL_KEYS[group.type])}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-[color:var(--ink)] hover:bg-white/8 transition-colors cursor-pointer bg-transparent border-none flex items-center gap-3"
                    onClick={() => navigate(item.href)}
                  >
                    {group.type === "exercice" && <ExoThumb slug={item.slug} size={32} />}
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
