"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    href: "/bac",
    labelKey: "nav.bac.label",
    metaKey: "nav.bac.meta",
  },
];

export function TabNav() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();
  const [hideBottomNav, setHideBottomNav] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(max-width: 767px) and (orientation: landscape)",
    );
    const compute = () => {
      setHideBottomNav(media.matches);
    };
    compute();

    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", compute);
    } else {
      media.addListener(compute);
    }

    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", compute);
      } else {
        media.removeListener(compute);
      }
    };
  }, []);

  if (hideBottomNav) {
    return null;
  }

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
