"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function BackToAnatomy() {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  if (searchParams.get("from") !== "anatomie") return null;

  return (
    <Link
      href="/apprendre/anatomie"
      className="back-to-anatomy"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="13" y1="8" x2="3" y2="8"/>
        <polyline points="7,4 3,8 7,12"/>
      </svg>
      {t("anatomy.backToMannequin")}
    </Link>
  );
}
