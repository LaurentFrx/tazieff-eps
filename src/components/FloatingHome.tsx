"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function FloatingHome() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { t } = useI18n();

  /* Hide on home page */
  if (pathname === "/") return null;

  /* Nested = 2+ non-empty segments, e.g. /exercices/squat-barre */
  const segments = pathname.split("/").filter(Boolean);
  const isNested = segments.length >= 2;

  return (
    <div className="floating-home-wrap">
      <div className="floating-home-pill">
        {isNested && (
          <button
            type="button"
            className="floating-home-back"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            aria-label={t("header.back")}
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <Link href="/" className="floating-home-logo" aria-label={t("header.home")}>
          <Image
            src="/media/branding/logo-eps.webp"
            alt=""
            width={24}
            height={24}
            unoptimized
          />
        </Link>
      </div>
    </div>
  );
}
