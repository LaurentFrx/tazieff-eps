"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const STORAGE_KEY = "pwa_install_banner_dismissed_v1";
const EVENT_NAME = "pwa-banner-change";

type NavigatorStandalone = Navigator & { standalone?: boolean };

function getSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
  if (dismissed) {
    return false;
  }

  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);

  if (!isIos) {
    return false;
  }

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorStandalone).standalone === true;

  return !standalone;
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const media = window.matchMedia("(display-mode: standalone)");
  const handleChange = () => callback();

  media.addEventListener?.("change", handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener(EVENT_NAME, handleChange);

  return () => {
    media.removeEventListener?.("change", handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(EVENT_NAME, handleChange);
  };
}

export function InstallPwaBanner() {
  const { t } = useI18n();
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event(EVENT_NAME));
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-auto fixed left-1/2 z-20 w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 rounded-2xl border border-[color:var(--border)] bg-[var(--card)] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow)] backdrop-blur-xl"
      style={{ bottom: "calc(var(--tabbar-offset) + var(--tabbar-height))" }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <div className="text-sm font-semibold text-[color:var(--ink)]">
            {t("pwaBanner.title")}
          </div>
          <div className="text-xs leading-snug text-[color:var(--muted)]">
            {t("pwaBanner.body")}
          </div>
          <div className="text-xs leading-snug text-[color:var(--muted)]">
            {t("pwaBanner.hint")}
          </div>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-[var(--card)] text-sm text-[color:var(--ink)] shadow-[var(--shadow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
          aria-label={t("pwaBanner.close")}
          onClick={handleDismiss}
        >
          <span aria-hidden="true">X</span>
        </button>
      </div>
    </div>
  );
}
