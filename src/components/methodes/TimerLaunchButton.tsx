"use client";

import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { clientLocalizedHref } from "@/lib/i18n/locale-path";
import type { Locale } from "@/lib/i18n/constants";

type Props = {
  /** Rest duration in seconds from method frontmatter, or default 120 */
  restSeconds: number;
  /** Method slug for tracking */
  methodSlug: string;
};

export function TimerLaunchButton({ restSeconds, methodSlug }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang } = useI18n();

  function handleClick() {
    try {
      localStorage.setItem(
        "eps_timer_preconfig",
        JSON.stringify({ preset: "repos", duration: restSeconds, from: methodSlug }),
      );
    } catch { /* quota */ }
    // Sprint A2 — préfixe locale pour fonctionner sur miroir admin.
    router.push(clientLocalizedHref("/outils/timer", lang as Locale, pathname));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-cyan-400 rounded-xl bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 transition-colors w-full"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      {t("methodes.timer.launchTimer")}
    </button>
  );
}
