"use client";

// Sprint A5 — Page client /rejoindre.
//
// Comportement :
//   - Reçoit `initialCode` depuis le querystring `?code=XXX` (lu côté server
//     dans page.tsx puis transmis ici).
//   - Affiche un message d'introduction ("Tu rejoins la classe …") + le
//     formulaire JoinClassForm pré-rempli avec le code.
//   - Si onJoined est appelé (succès POST /api/me/classes/join), redirige
//     vers /ma-classe via router.push() (préfixe locale via clientLocalizedHref).
//
// Source : QR codes générés par les profs sur /prof/(authed)/mes-classes/[id].
// L'URL absolue du QR est `${baseUrl.eleve}/rejoindre?code=XXX` (cf A1).

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { JoinClassForm } from "@/app/[locale]/ma-classe/JoinClassForm";
import { clientLocalizedHref } from "@/lib/i18n/locale-path";
import type { Locale } from "@/lib/i18n/constants";

type Props = {
  initialCode: string;
};

export function RejoindreClient({ initialCode }: Props) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const handleJoined = useCallback(() => {
    router.push(clientLocalizedHref("/ma-classe", lang as Locale, pathname));
  }, [router, lang, pathname]);

  return (
    <section className="page pb-32">
      <div className="mx-auto max-w-md space-y-5">
        <header className="space-y-2">
          <h1
            className="text-3xl uppercase tracking-wider text-[color:var(--ink)]"
            style={{ fontFamily: "var(--font-bebas), sans-serif" }}
          >
            {t("rejoindre.title")}
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            {initialCode
              ? t("rejoindre.subtitleWithCode")
              : t("rejoindre.subtitleNoCode")}
          </p>
        </header>

        <JoinClassForm initialCode={initialCode} onJoined={handleJoined} />

        <p className="text-xs text-[color:var(--muted)] text-center">
          {t("rejoindre.help")}
        </p>
      </div>
    </section>
  );
}
