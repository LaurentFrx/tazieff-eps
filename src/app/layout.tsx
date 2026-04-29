import type { Metadata, Viewport } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import { resolveEnv } from "@/lib/env";
import "./globals.css";

// Sprint perf-quick-wins (29 avril 2026) — `display: "optional"` sur les
// 3 polices Google. Comportement : si la police est dans le cache navigateur,
// elle est utilisée immédiatement ; sinon le fallback système est conservé
// au premier paint et la police custom n'est appliquée qu'aux visites
// suivantes. Élimine le FOIT/FOUT qui contribuait au CLS 0.164 mesuré.
// `adjustFontFallback: true` (valeur par défaut Next.js) calibre les métriques
// du fallback pour minimiser le shift quand la police custom finit par s'appliquer.
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
  display: "optional",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "optional",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "700"],
  display: "optional",
});

const splashScript = readFileSync(join(process.cwd(), "public/splash.js"), "utf8");


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  // Sprint A1 — metadataBase suit l'environnement courant (preview/prod).
  metadataBase: new URL(resolveEnv().baseUrl.eleve),
  title: "Tazieff EPS",
  description: "Guide complet de musculation pour le BAC EPS : exercices, m\u00e9thodes d\u2019entra\u00eenement, anatomie et parcours d\u2019\u00e9valuation.",
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
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "es_ES"],
    siteName: "Tazieff EPS",
    title: "Tazieff EPS — Musculation au lycée",
    description: "Application pédagogique de musculation pour l'EPS. Exercices, méthodes d'entraînement, préparation BAC.",
    images: [{ url: "/images/og-default.webp", width: 1200, height: 630, alt: "Tazieff EPS — Musculation au lycée" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tazieff EPS — Musculation au lycée",
    description: "Application pédagogique de musculation pour l'EPS.",
    images: ["/images/og-default.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        {/* Sprint perf-quick-wins (29 avril 2026) — preconnect + dns-prefetch
            vers Supabase pour économiser ~80ms sur le LCP. Le projet
            zefkltkiigxkjcrdesrk est l'unique backend (élève + prof + admin).
            Cf. CLAUDE.md §13. */}
        <link
          rel="preconnect"
          href="https://zefkltkiigxkjcrdesrk.supabase.co"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://zefkltkiigxkjcrdesrk.supabase.co"
        />
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </head>
      <body className={`${bebasNeue.variable} ${dmSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
