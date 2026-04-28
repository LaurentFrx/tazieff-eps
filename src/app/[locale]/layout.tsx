import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BottomTabBar } from "@/components/BottomTabBar";
import { TopBar } from "@/components/TopBar";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppProviders } from "@/components/providers/AppProviders";
import { PageTransition } from "@/components/PageTransition";
import { isAdminHost } from "@/lib/admin-hosts";
import { SUPPORTED_LOCALES, isLocale } from "@/lib/i18n/constants";
import type { Lang } from "@/lib/i18n/messages";

// Sprint A5.1 — Guard explicite sur params.locale.
//
// Bug constaté par audit visuel A5 (Claude Chrome 2026-04-28) : /auth et
// /callback (apres suppression A5 des routes OAuth GitHub legacy) répondaient
// HTTP 200 avec une app élève dégradée (compteurs à zéro). Cause racine :
// le segment dynamique [locale] acceptait toute string et fallback-ait
// silencieusement vers "fr", générant une UI cassée silencieusement.
//
// Fix : si params.locale n'est pas dans SUPPORTED_LOCALES (fr/en/es), on
// appelle notFound() pour retourner un vrai 404. Couvre tout futur faux
// locale (/lol, /test, /admin/legacy, etc.).
//
// generateStaticParams ci-dessous limite déjà les routes pré-générées aux 3
// locales supportées, mais Next.js 16 rend aussi à la volée les segments
// dynamiques pour les chemins non-générés — d'où la nécessité du guard
// runtime explicite.

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  // Sprint A5.1 — refuse explicitement les locales invalides.
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Lang = rawLocale;

  // P0.7-septies — Sur le miroir admin (admin.muscu-eps.fr / design-admin.*),
  // on désactive le fallback signInAnonymously du AuthProvider pour empêcher
  // l'écrasement des cookies admin posés par /auth/callback. La détection
  // du host vit côté server uniquement, pas de hardcode dans le client.
  const requestHost = (await headers()).get("host") ?? "";
  const onAdminHost = isAdminHost(requestHost);

  return (
    <AppProviders
      initialLang={locale}
      initialTheme="dark"
      disableAnonymousFallback={onAdminHost}
    >
      <div className="app-shell">
        <main className="app-main"><PageTransition>{children}</PageTransition></main>
      </div>
      <BottomTabBar />
      <TopBar />
      <ScrollToTop />
      <OnlineStatus />
      <InstallPwaBanner />
    </AppProviders>
  );
}
