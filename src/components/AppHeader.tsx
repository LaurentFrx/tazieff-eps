"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../public/media/branding/logo-eps.webp";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function AppHeader() {
  const { t } = useI18n();
  const settingsLabel = t("settings.open");
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="app-header">
      <div className="brand">
        <Link href="/" aria-label="Accueil">
          <Image src={logo} alt="EPS" className="h-9 w-auto" />
        </Link>
        <div className="brand-text">
          <span className="brand-title">Tazieff</span>
        </div>
      </div>
      <div className="header-actions">
        <Link
          href="/reglages"
          className="icon-button"
          aria-label={settingsLabel}
          title={settingsLabel}
        >
          <span aria-hidden="true">⚙️</span>
        </Link>
      </div>
    </header>
  );
}
