"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/exos", label: "Exos", meta: "Moves" },
  { href: "/seances", label: "Seances", meta: "Plan" },
  { href: "/apprendre", label: "Apprendre", meta: "Learn" },
  { href: "/progres", label: "Progres", meta: "Track" },
];

export function TabNav() {
  const pathname = usePathname() ?? "";

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
            <span className="tab-label">{tab.label}</span>
            <span className="tab-meta">{tab.meta}</span>
          </Link>
        );
      })}
    </nav>
  );
}
