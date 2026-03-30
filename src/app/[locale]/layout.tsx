import { BottomTabBar } from "@/components/BottomTabBar";
import { TopBar } from "@/components/TopBar";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppProviders } from "@/components/providers/AppProviders";
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

  return (
    <AppProviders initialLang={locale} initialTheme="dark">
      <div className="app-shell">
        <main className="app-main">{children}</main>
      </div>
      <BottomTabBar />
      <TopBar />
      <ScrollToTop />
      <OnlineStatus />
      <InstallPwaBanner />
    </AppProviders>
  );
}
