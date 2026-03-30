"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const STORAGE_DONE = "tazieff-onboarding-done";
const STORAGE_DISMISSED = "tazieff-onboarding-dismissed";

export function OnboardingBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_DONE);
      const dismissed = localStorage.getItem(STORAGE_DISMISSED);
      if (!done && !dismissed) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_DISMISSED, "true"); } catch { /* ignore */ }
  };

  return (
    <div className="onboarding-banner">
      <div className="flex-1">
        <p className="font-semibold text-[color:var(--ink)] text-sm">{t("onboarding.bannerTitle")}</p>
        <p className="text-xs text-[color:var(--muted)] mt-1">{t("onboarding.bannerBody")}</p>
      </div>
      <Link href="/onboarding" className="primary-button text-xs" onClick={dismiss}>
        {t("onboarding.bannerCta")} <ArrowRight size={14} />
      </Link>
      <button type="button" className="onboarding-banner-close" onClick={dismiss} aria-label={t("onboarding.bannerClose")}>
        <X size={16} />
      </button>
    </div>
  );
}
