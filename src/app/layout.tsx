import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Sora, Orbitron } from "next/font/google";
import { BottomTabBar } from "@/components/BottomTabBar";
import { TopBar } from "@/components/TopBar";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppProviders } from "@/components/providers/AppProviders";
import { SplashScreen } from "@/components/SplashScreen";
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

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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

/**
 * Root layout — NO cookies() or headers() calls here so that
 * child pages under [locale] can be statically generated.
 *
 * Language and theme are resolved at build time via defaults ("fr" / "dark")
 * and hydrated client-side by I18nProvider and next-themes from
 * localStorage / the eps_lang cookie.
 *
 * suppressHydrationWarning on <html> silences the brief flash when the
 * client-side values differ from the SSG defaults.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defaults for SSG — client-side providers override immediately
  const initialLang = "fr";
  const initialTheme = "dark" as const;

  return (
    <html
      lang={initialLang}
      data-theme={initialTheme}
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${spaceGrotesk.variable} ${sora.variable} ${spaceMono.variable} ${orbitron.variable}`}>
        <SplashScreen />
        <AppProviders initialLang={initialLang} initialTheme={initialTheme}>
          <div className="app-shell">
            <main className="app-main">{children}</main>
          </div>
          <BottomTabBar />
          <TopBar />
          <ScrollToTop />
          <OnlineStatus />
          <InstallPwaBanner />
        </AppProviders>
      </body>
    </html>
  );
}
