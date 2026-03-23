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
        {/* ── Splash screen : créé par script, invisible pour React ── */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  try{if(sessionStorage.getItem('tazieff-splash-shown'))return;}catch(e){}
  var d=document,b=d.body;
  var s=d.createElement('div');s.id='splash-screen';
  s.style.cssText='position:fixed;inset:0;z-index:9999;background:#050507;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif';
  s.innerHTML='<svg id="sp-bb" viewBox="0 0 200 80" width="180" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0;transform:scale(0.5) rotate(-10deg);transition:opacity 600ms cubic-bezier(0.34,1.56,0.64,1),transform 600ms cubic-bezier(0.34,1.56,0.64,1)"><defs><radialGradient id="sp-sh" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#000" stop-opacity="0.15"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient><linearGradient id="sp-br" x1="30" y1="0" x2="170" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#b0b0b0"/><stop offset="50%" stop-color="#909090"/><stop offset="100%" stop-color="#b0b0b0"/></linearGradient><linearGradient id="sp-di" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c44820"/><stop offset="50%" stop-color="#f05a2b"/><stop offset="100%" stop-color="#c44820"/></linearGradient><linearGradient id="sp-do" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a33a18"/><stop offset="50%" stop-color="#f05a2b"/><stop offset="100%" stop-color="#a33a18"/></linearGradient><linearGradient id="sp-cp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#aaa"/><stop offset="100%" stop-color="#888"/></linearGradient></defs><ellipse cx="100" cy="72" rx="70" ry="4" fill="url(#sp-sh)"/><rect x="0" y="35" width="6" height="10" rx="2" fill="url(#sp-cp)"/><rect x="194" y="35" width="6" height="10" rx="2" fill="url(#sp-cp)"/><rect x="4" y="15" width="14" height="50" rx="3" fill="url(#sp-do)"/><rect x="4" y="15" width="3" height="50" rx="1" fill="white" fill-opacity="0.15"/><rect x="15" y="15" width="1.5" height="50" fill="black" fill-opacity="0.2"/><rect x="182" y="15" width="14" height="50" rx="3" fill="url(#sp-do)"/><rect x="182" y="15" width="3" height="50" rx="1" fill="white" fill-opacity="0.15"/><rect x="193.5" y="15" width="1.5" height="50" fill="black" fill-opacity="0.2"/><rect x="18" y="22" width="10" height="36" rx="2" fill="url(#sp-di)"/><rect x="18" y="22" width="3" height="36" rx="1" fill="white" fill-opacity="0.15"/><rect x="172" y="22" width="10" height="36" rx="2" fill="url(#sp-di)"/><rect x="172" y="22" width="3" height="36" rx="1" fill="white" fill-opacity="0.15"/><rect x="28" y="32" width="5" height="16" rx="1" fill="#888" stroke="#666" stroke-width="0.5"/><rect x="167" y="32" width="5" height="16" rx="1" fill="#888" stroke="#666" stroke-width="0.5"/><rect x="30" y="37" width="140" height="6" rx="3" fill="url(#sp-br)"/><rect x="30" y="37" width="140" height="1.5" rx="1" fill="white" fill-opacity="0.10"/></svg><div id="sp-tt" style="margin-top:24px;font-weight:900;font-size:28px;color:white;letter-spacing:-0.5px;opacity:0;transform:translateY(16px);transition:opacity 500ms ease-out,transform 500ms ease-out">Tazieff<span style="color:#f05a2b">\\u2019</span>EPS</div><div id="sp-su" style="margin-top:8px;font-size:13px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;opacity:0;transform:translateY(12px);transition:opacity 400ms ease-out,transform 400ms ease-out">Musculation au lyc\\u00e9e</div><div id="sp-bw" style="margin-top:32px;width:120px;height:3px;background:#27272a;border-radius:2px;overflow:hidden;opacity:0;transition:opacity 300ms ease-out"><div id="sp-bf" style="width:0%;height:100%;background:linear-gradient(to right,#f05a2b,#f59e0b);border-radius:2px;transition:width 1.2s cubic-bezier(0.4,0,0.2,1)"></div></div>';
  b.insertBefore(s,b.firstChild);
  setTimeout(function(){var e=d.getElementById('sp-bb');if(e){e.style.opacity='1';e.style.transform='scale(1) rotate(0deg)';}},200);
  setTimeout(function(){var e=d.getElementById('sp-tt');if(e){e.style.opacity='1';e.style.transform='translateY(0)';}},600);
  setTimeout(function(){var e=d.getElementById('sp-su');if(e){e.style.opacity='1';e.style.transform='translateY(0)';}},900);
  setTimeout(function(){var e=d.getElementById('sp-bw');if(e)e.style.opacity='1';setTimeout(function(){var f=d.getElementById('sp-bf');if(f)f.style.width='100%';},50);},1100);
  setTimeout(function(){s.style.transition='opacity 500ms ease-out';s.style.opacity='0';},2600);
  setTimeout(function(){try{sessionStorage.setItem('tazieff-splash-shown','1');}catch(x){}s.remove();},3100);
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
