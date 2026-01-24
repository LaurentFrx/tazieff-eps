"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

const tabs = [
  { href: "/exercices", labelKey: "nav.exos.label", metaKey: "nav.exos.meta" },
  {
    href: "/seances",
    labelKey: "nav.seances.label",
    metaKey: "nav.seances.meta",
  },
  {
    href: "/apprendre",
    labelKey: "nav.apprendre.label",
    metaKey: "nav.apprendre.meta",
  },
  {
    href: "/progres",
    labelKey: "nav.progres.label",
    metaKey: "nav.progres.meta",
  },
];

export function TabNav() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  return (
    <nav className="tab-nav" aria-label="Primary">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab-link${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="tab-icon" aria-hidden="true" />
            <span className="tab-label">{t(tab.labelKey)}</span>
            <span className="tab-meta">{t(tab.metaKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
