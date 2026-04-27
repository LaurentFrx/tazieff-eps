import { headers } from "next/headers";
import { BottomTabBar } from "@/components/BottomTabBar";
import { TopBar } from "@/components/TopBar";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppProviders } from "@/components/providers/AppProviders";
import { PageTransition } from "@/components/PageTransition";
import { isAdminHost } from "@/lib/admin-hosts";
import type { Lang } from "@/lib/i18n/messages";

const VALID_LOCALES: Lang[] = ["fr", "en", "es"];

function isValidLocale(value: string): value is Lang {
  return VALID_LOCALES.includes(value as Lang);
}

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Lang = isValidLocale(rawLocale) ? rawLocale : "fr";

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
