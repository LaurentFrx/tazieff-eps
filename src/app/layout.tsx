import type { Metadata, Viewport } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "700"],
});

const splashScript = readFileSync(join(process.cwd(), "public/splash.js"), "utf8");


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://muscu-eps.fr"),
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
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </head>
      <body className={`${bebasNeue.variable} ${dmSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
