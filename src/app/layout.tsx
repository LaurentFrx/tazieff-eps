import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import { cookies } from "next/headers";
import { AppHeader } from "@/components/AppHeader";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { TabNav } from "@/components/TabNav";
import { AppProviders } from "@/components/providers/AppProviders";
import { getServerLang } from "@/lib/i18n/server";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tazieff EPS",
  description: "Guide mobile avec navigation a quatre onglets.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

type ThemePreference = "system" | "light" | "dark";

const THEME_COOKIE = "eps_theme";

function getInitialTheme(value?: string): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "dark";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLang = await getServerLang();
  const initialTheme = getInitialTheme(cookieStore.get(THEME_COOKIE)?.value);
  const htmlClassName = initialTheme === "dark" ? "dark" : undefined;
  const dataTheme = initialTheme !== "system" ? initialTheme : undefined;

  return (
    <html
      lang={initialLang}
      data-theme={dataTheme}
      className={htmlClassName}
      suppressHydrationWarning
    >
      <body className={`${spaceGrotesk.variable} ${sora.variable}`}>
        <AppProviders initialLang={initialLang} initialTheme={initialTheme}>
          <div className="app-shell">
            <AppHeader />
            <main className="app-main">{children}</main>
          </div>
          <TabNav />
          <InstallPwaBanner />
        </AppProviders>
      </body>
    </html>
  );
}
