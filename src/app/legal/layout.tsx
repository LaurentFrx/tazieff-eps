import type { Metadata } from "next";
import Link from "next/link";

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
          <Link
            href="/"
            className="text-[13px] text-zinc-500 transition-colors hover:text-[#00E5FF]"
          >
            &larr; Retour &agrave; l&rsquo;accueil
          </Link>
        </nav>

        <article className="font-['DM_Sans'] text-[14px] leading-relaxed">
          {children}
        </article>

        <footer className="mt-16 border-t border-white/10 pt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-zinc-500">
          <Link
            href="/legal/mentions-legales"
            className="transition-colors hover:text-[#00E5FF]"
          >
            Mentions l&eacute;gales
          </Link>
          <Link
            href="/legal/confidentialite"
            className="transition-colors hover:text-[#00E5FF]"
          >
            Confidentialit&eacute;
          </Link>
          <Link
            href="/legal/cgu"
            className="transition-colors hover:text-[#00E5FF]"
          >
            CGU
          </Link>
        </footer>
      </div>
    </div>
  );
}
