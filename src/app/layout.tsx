import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import { TabNav } from "@/components/TabNav";
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
  description: "Mobile first training guide with four tabs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${spaceGrotesk.variable} ${sora.variable}`}>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="brand-mark">EPS</span>
              <div className="brand-text">
                <span className="brand-title">Tazieff</span>
                <span className="brand-subtitle">App Router</span>
              </div>
            </div>
            <div className="status-chip">Mobile First</div>
          </header>
          <main className="app-main">{children}</main>
        </div>
        <TabNav />
      </body>
    </html>
  );
}
