"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function ScrollToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("nav.scrollToTop")}
    >
      <ChevronUp size={20} />
    </button>
  );
}
