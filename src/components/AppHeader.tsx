"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function AppHeader() {
  const { t } = useI18n();
  const settingsLabel = t("settings.title");

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">EPS</span>
        <div className="brand-text">
          <span className="brand-title">Tazieff</span>
          <span className="brand-subtitle">{t("header.subtitle")}</span>
        </div>
      </div>
      <div className="header-actions">
        <div className="status-chip">{t("header.status")}</div>
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
