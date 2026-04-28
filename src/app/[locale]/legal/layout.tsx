// Sprint A5 — Layout des pages legal, déplacé sous /[locale]/legal/.
// Auparavant : /legal/layout.tsx (non-localisé). Le doublon a été supprimé.
//
// Toutes les navigations internes passent par LocaleLink (PS2). L'exception
// "/" qui pointe vers la home utilise aussi LocaleLink (qui retourne href tel
// quel sur l'élève en fr, et préfixe en miroir admin / autres locales).

import type { Metadata } from "next";
import { LocaleLink } from "@/components/LocaleLink";

export const metadata: Metadata = {
  robots: "noindex",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#04040A] text-zinc-300">
      <div className="mx-auto max-w-[720px] px-4 py-12 md:px-8 md:py-16">
        <nav className="mb-10">
          <LocaleLink
            href="/"
            className="text-[13px] text-zinc-500 transition-colors hover:text-[#00E5FF]"
          >
            &larr; Retour &agrave; l&rsquo;accueil
          </LocaleLink>
        </nav>

        <article className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-relaxed">
          {children}
        </article>

        <footer className="mt-16 border-t border-white/10 pt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-zinc-500">
          <LocaleLink
            href="/legal/mentions-legales"
            className="transition-colors hover:text-[#00E5FF]"
          >
            Mentions l&eacute;gales
          </LocaleLink>
          <LocaleLink
            href="/legal/confidentialite"
            className="transition-colors hover:text-[#00E5FF]"
          >
            Confidentialit&eacute;
          </LocaleLink>
          <LocaleLink
            href="/legal/cgu"
            className="transition-colors hover:text-[#00E5FF]"
          >
            CGU
          </LocaleLink>
        </footer>
      </div>
    </div>
  );
}
