import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Sora, Orbitron } from "next/font/google";
import { cookies } from "next/headers";
import { BottomTabBar } from "@/components/BottomTabBar";
import { TopBar } from "@/components/TopBar";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppProviders } from "@/components/providers/AppProviders";
// RSC: useI18n() unavailable — read lang from cookie via getServerLang()
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
      <body className={`${spaceGrotesk.variable} ${sora.variable} ${spaceMono.variable} ${orbitron.variable}`}>
        {/* ── Splash screen (HTML/CSS/JS pur, pré-hydratation) ── */}
        <div
          id="splash-screen"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "#050507",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            #splash-screen { font-family: system-ui, -apple-system, sans-serif; }
            #splash-screen * { box-sizing: border-box; }
          `}} />

          {/* Haltère SVG */}
          <svg
            id="sp-barbell"
            viewBox="0 0 200 80"
            width="180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0, transform: "scale(0.5) rotate(-10deg)", transition: "opacity 600ms cubic-bezier(0.34,1.56,0.64,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            {/* Ombre portée */}
            <defs>
              <radialGradient id="sp-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sp-bar" x1="30" y1="0" x2="170" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#b0b0b0" />
                <stop offset="50%" stopColor="#909090" />
                <stop offset="100%" stopColor="#b0b0b0" />
              </linearGradient>
              <linearGradient id="sp-disc-in" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c44820" />
                <stop offset="50%" stopColor="#f05a2b" />
                <stop offset="100%" stopColor="#c44820" />
              </linearGradient>
              <linearGradient id="sp-disc-out" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a33a18" />
                <stop offset="50%" stopColor="#f05a2b" />
                <stop offset="100%" stopColor="#a33a18" />
              </linearGradient>
              <linearGradient id="sp-cap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#aaa" />
                <stop offset="100%" stopColor="#888" />
              </linearGradient>
            </defs>

            <ellipse cx="100" cy="72" rx="70" ry="4" fill="url(#sp-shadow)" />

            {/* Embouts */}
            <rect x="0" y="35" width="6" height="10" rx="2" fill="url(#sp-cap)" />
            <rect x="194" y="35" width="6" height="10" rx="2" fill="url(#sp-cap)" />

            {/* Disques extérieurs */}
            <rect x="4" y="15" width="14" height="50" rx="3" fill="url(#sp-disc-out)" />
            <rect x="4" y="15" width="3" height="50" rx="1" fill="white" fillOpacity="0.15" />
            <rect x="15" y="15" width="1.5" height="50" fill="black" fillOpacity="0.2" />

            <rect x="182" y="15" width="14" height="50" rx="3" fill="url(#sp-disc-out)" />
            <rect x="182" y="15" width="3" height="50" rx="1" fill="white" fillOpacity="0.15" />
            <rect x="193.5" y="15" width="1.5" height="50" fill="black" fillOpacity="0.2" />

            {/* Disques intérieurs */}
            <rect x="18" y="22" width="10" height="36" rx="2" fill="url(#sp-disc-in)" />
            <rect x="18" y="22" width="3" height="36" rx="1" fill="white" fillOpacity="0.15" />

            <rect x="172" y="22" width="10" height="36" rx="2" fill="url(#sp-disc-in)" />
            <rect x="172" y="22" width="3" height="36" rx="1" fill="white" fillOpacity="0.15" />

            {/* Colliers */}
            <rect x="28" y="32" width="5" height="16" rx="1" fill="#888" stroke="#666" strokeWidth="0.5" />
            <rect x="167" y="32" width="5" height="16" rx="1" fill="#888" stroke="#666" strokeWidth="0.5" />

            {/* Barre */}
            <rect x="30" y="37" width="140" height="6" rx="3" fill="url(#sp-bar)" />
            <rect x="30" y="37" width="140" height="1.5" rx="1" fill="white" fillOpacity="0.10" />
          </svg>

          {/* Nom app */}
          <div
            id="sp-title"
            style={{ marginTop: 24, fontWeight: 900, fontSize: 28, color: "white", letterSpacing: "-0.5px", opacity: 0, transform: "translateY(16px)", transition: "opacity 500ms ease-out, transform 500ms ease-out" }}
          >
            Tazieff<span style={{ color: "#f05a2b" }}>&apos;</span>EPS
          </div>

          {/* Sous-titre */}
          <div
            id="sp-sub"
            style={{ marginTop: 8, fontSize: 13, color: "#a1a1aa", textTransform: "uppercase" as const, letterSpacing: "1px", opacity: 0, transform: "translateY(12px)", transition: "opacity 400ms ease-out, transform 400ms ease-out" }}
          >
            Musculation au lycée
          </div>

          {/* Barre de progression */}
          <div
            id="sp-bar-wrap"
            style={{ marginTop: 32, width: 120, height: 3, background: "#27272a", borderRadius: 2, overflow: "hidden", opacity: 0, transition: "opacity 300ms ease-out" }}
          >
            <div
              id="sp-bar-fill"
              style={{ width: "0%", height: "100%", background: "linear-gradient(to right, #f05a2b, #f59e0b)", borderRadius: 2, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }}
            />
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var s=document.getElementById('splash-screen');
            if(!s)return;
            function hide(){s.style.display='none';s.style.pointerEvents='none';}
            try{if(sessionStorage.getItem('tazieff-splash-shown')){hide();return;}}catch(e){}
            setTimeout(function(){
              var b=document.getElementById('sp-barbell');
              if(b){b.style.opacity='1';b.style.transform='scale(1) rotate(0deg)';}
            },200);
            setTimeout(function(){
              var t=document.getElementById('sp-title');
              if(t){t.style.opacity='1';t.style.transform='translateY(0)';}
            },600);
            setTimeout(function(){
              var u=document.getElementById('sp-sub');
              if(u){u.style.opacity='1';u.style.transform='translateY(0)';}
            },900);
            setTimeout(function(){
              var w=document.getElementById('sp-bar-wrap');
              if(w)w.style.opacity='1';
              setTimeout(function(){
                var f=document.getElementById('sp-bar-fill');
                if(f)f.style.width='100%';
              },50);
            },1100);
            setTimeout(function(){
              if(s){s.style.transition='opacity 500ms ease-out';s.style.opacity='0';}
            },2600);
            setTimeout(function(){
              try{sessionStorage.setItem('tazieff-splash-shown','1');}catch(e){}
              hide();
            },3100);
          })();
        `}} />

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
