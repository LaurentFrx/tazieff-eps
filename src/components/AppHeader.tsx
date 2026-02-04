"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logo from "../../public/media/branding/logo-eps.webp";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function AppHeader() {
  const { t, lang } = useI18n();
  const settingsLabel = t("settings.open");
  const pathname = usePathname();
  const router = useRouter();
  const isSettingsPage = pathname?.startsWith("/reglages");
  const headerConfig = (() => {
    if (!pathname) {
      return null;
    }

    if (pathname.startsWith("/reglages")) {
      return {
        title: t("pages.settings.title"),
        subtitle: t("pages.settings.eyebrow"),
      };
    }

    if (pathname === "/exercices") {
      return {
        title: "Bibliothèque d'exercices",
        subtitle: "EXERCICES & ETIREMENTS",
      };
    }

    if (pathname === "/seances") {
      return { title: "Plans de séance", subtitle: "Séances" };
    }

    if (pathname === "/apprendre") {
      return { title: "Apprendre", subtitle: "Apprendre" };
    }

    if (pathname === "/bac") {
      return { title: "Musculation au BAC", subtitle: "Bac" };
    }

    return null;
  })();
  const brandTitle = headerConfig?.title ?? "Tazieff";
  const brandTitleClass = `brand-title${
    headerConfig ? " brand-title--page" : ""
  }`;
  const brandSubtitle = headerConfig?.subtitle;
  const brandSubtitleClass = `brand-subtitle${
    headerConfig ? " brand-subtitle--page" : ""
  }`;
  const backLabel = lang === "en" ? "Back" : "Retour";

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="app-header">
      <div className="brand">
        <Link href="/" aria-label="Accueil">
          <Image src={logo} alt="EPS" className="h-20 w-auto" />
        </Link>
        <div className="brand-text">
          <span className={brandTitleClass}>{brandTitle}</span>
          {brandSubtitle ? (
            <span className={brandSubtitleClass}>{brandSubtitle}</span>
          ) : null}
        </div>
      </div>
      <div className="header-actions">
        {isSettingsPage ? (
          <button
            type="button"
            className="icon-button"
            aria-label={backLabel}
            title={backLabel}
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
                return;
              }
              router.push("/exercices");
            }}
          >
            <span aria-hidden="true">←</span>
          </button>
        ) : (
          <Link
            href="/reglages"
            className="icon-button"
            aria-label={settingsLabel}
            title={settingsLabel}
          >
            <span aria-hidden="true">⚙️</span>
          </Link>
        )}
      </div>
    </header>
  );
}
