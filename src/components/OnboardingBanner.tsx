"use client";

import { LocaleLink as Link } from "@/components/LocaleLink";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useIsAdminMirror } from "@/hooks/useIsAdminMirror";

const LS_DONE = "eps_onboarding_done";
const LS_DISMISSED = "eps_onboarding_dismissed";

export function OnboardingBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  // Sprint hotfix admin-mirror-elements (28 avril 2026) — masqué sur le
  // miroir admin (l'admin connecté n'a pas besoin de l'onboarding élève).
  const isAdminMirror = useIsAdminMirror();

  useEffect(() => {
    try {
      const done = localStorage.getItem(LS_DONE);
      const dismissed = localStorage.getItem(LS_DISMISSED);
      if (!done && !dismissed) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  if (!visible || isAdminMirror) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(LS_DISMISSED, "true"); } catch { /* ignore */ }
  };

  return (
    <div className="onboarding-banner">
      <div className="flex-1">
        <p className="font-semibold text-[color:var(--ink)] text-sm">{t("onboarding.bannerTitle")}</p>
        <p className="text-xs text-[color:var(--muted)] mt-1">{t("onboarding.bannerBody")}</p>
      </div>
      <Link href="/onboarding" className="primary-button text-xs" onClick={dismiss}>
        {t("onboarding.bannerCta")}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
      </Link>
      <button type="button" className="onboarding-banner-close" onClick={dismiss} aria-label={t("onboarding.bannerClose")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}
