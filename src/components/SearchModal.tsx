"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, BookOpen, Dumbbell, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { search, type SearchResultGroup } from "@/lib/search/search";
import type { SearchEntry } from "@/lib/search/search-index";
import { ExoThumb } from "@/components/ExoThumb";

const TYPE_ICONS: Record<SearchEntry["type"], typeof Search> = {
  exercice: Dumbbell,
  methode: BookOpen,
  apprendre: BookMarked,
  glossaire: Search,
};

const TYPE_LABEL_KEYS: Record<SearchEntry["type"], string> = {
  exercice: "search.typeExercice",
  methode: "search.typeMethode",
  apprendre: "search.typeApprendre",
  glossaire: "search.typeGlossaire",
};

export function SearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultGroup[]>([]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      setResults(search(query));
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose],
  );

  const hasResults = results.length > 0;
  const showEmpty = query.trim().length >= 2 && !hasResults;

  return (
    <div className="search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t("search.open")}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <Search size={18} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="search-kbd">Esc</kbd>
        </div>

        <div className="search-results">
          {showEmpty && (
            <p className="search-empty">{t("search.noResults")}</p>
          )}
          {results.map((group) => {
            const Icon = TYPE_ICONS[group.type];
            return (
              <div key={group.type} className="search-group">
                <h3 className="search-group-title">
                  <Icon size={14} />
                  {t(TYPE_LABEL_KEYS[group.type])}
                </h3>
                {group.items.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    className="search-result-item"
                    onClick={() => navigate(item.href)}
                  >
                    {group.type === "exercice" && <ExoThumb slug={item.slug} size={32} />}
                    {item.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
