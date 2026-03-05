"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { SearchModal } from "@/components/SearchModal";

const navItems = [
  { href: "/exercices", labelKey: "nav.exos.label" },
  { href: "/seances", labelKey: "nav.seances.label" },
  { href: "/methodes", labelKey: "nav.methodes.label" },
  { href: "/apprendre", labelKey: "nav.apprendre.label" },
  { href: "/bac", labelKey: "nav.bac.label" },
  { href: "/outils", labelKey: "nav.outils.label" },
];

export function FloatingNav() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();
  const { unlocked: teacherUnlocked } = useTeacherMode();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── Cmd/Ctrl+K shortcut for search ──────────────────────────────── */
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  /* ── Close on click outside ─────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  /* ── Close on navigation ────────────────────────────────────────────── */
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div className="floating-nav-wrap" ref={wrapRef}>
      <button
        type="button"
        className="floating-nav-btn"
        onClick={() => setSearchOpen(true)}
        aria-label={t("search.open")}
      >
        <Search size={20} />
      </button>
      <button
        type="button"
        className="floating-nav-btn"
        onClick={toggle}
        aria-label={open ? t("anatomy.closeMenu") : t("anatomy.openMenu")}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav className="floating-nav-dropdown" aria-label="Navigation">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`floating-nav-item${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
          <div className="floating-nav-divider" />
          <Link
            href="/reglages"
            className={`floating-nav-item${pathname.startsWith("/reglages") ? " is-active" : ""}`}
            aria-current={pathname.startsWith("/reglages") ? "page" : undefined}
          >
            {t("pages.settings.title")}
          </Link>
          {teacherUnlocked && (
            <Link
              href="/enseignant"
              className={`floating-nav-item${pathname.startsWith("/enseignant") ? " is-active" : ""}`}
              aria-current={pathname.startsWith("/enseignant") ? "page" : undefined}
            >
              {t("enseignant.navLabel")}
            </Link>
          )}
        </nav>
      )}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
