import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Sora, Orbitron } from "next/font/google";
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

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const SPLASH_SCRIPT = `(function(){
  var s=document.getElementById('splash-screen');
  if(!s)return;
  try{if(sessionStorage.getItem('splash-done')==='true'){s.remove();return;}}catch(e){}

  var circle=document.getElementById('sp-circle');
  var circleGlow=document.getElementById('sp-circle-glow');
  var square=document.getElementById('sp-square');
  var mannequin=document.getElementById('sp-mannequin');
  var scan=document.getElementById('sp-scan');
  var crossH=document.getElementById('sp-cross-h');
  var crossV=document.getElementById('sp-cross-v');
  var diag1=document.getElementById('sp-diag1');
  var diag2=document.getElementById('sp-diag2');
  var title=document.getElementById('sp-title');
  var gradLine=document.getElementById('sp-grad-line');
  var subtitle=document.getElementById('sp-subtitle');
  var cornerTL=document.getElementById('sp-corner-tl');
  var cornerTR=document.getElementById('sp-corner-tr');
  var progressBar=document.getElementById('sp-progress');
  var ticks=document.querySelectorAll('.sp-tick');

  setTimeout(function(){
    circle.style.transition='stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)';
    circle.style.strokeDashoffset='0';
    circleGlow.style.transition='stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)';
    circleGlow.style.strokeDashoffset='0';
    setTimeout(function(){
      square.style.transition='stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1)';
      square.style.strokeDashoffset='0';
    },300);
    setTimeout(function(){
      mannequin.style.transition='opacity 1.2s ease, filter 1s ease';
      mannequin.style.opacity='1';
    },600);
  },400);

  setTimeout(function(){
    scan.style.transition='top 2s ease-in-out, opacity 0.3s ease';
    scan.style.opacity='1';
    scan.style.top='90%';
    mannequin.style.filter='brightness(0.9) contrast(1.2) drop-shadow(0 0 12px #00E5FF40) drop-shadow(0 0 25px #7B2FFF1F)';
    crossH.style.transition='opacity 0.8s ease';
    crossH.style.opacity='1';
    crossV.style.transition='opacity 0.8s ease';
    crossV.style.opacity='1';
    diag1.style.transition='opacity 0.8s ease';
    diag1.style.opacity='1';
    diag2.style.transition='opacity 0.8s ease';
    diag2.style.opacity='1';
  },1400);

  setTimeout(function(){
    title.style.transition='transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease';
    title.style.transform='translateY(0)';
    title.style.opacity='1';
    setTimeout(function(){
      gradLine.style.transition='width 0.9s cubic-bezier(0.16,1,0.3,1)';
      gradLine.style.width='44px';
    },200);
    setTimeout(function(){
      subtitle.style.transition='transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease';
      subtitle.style.transform='translateY(0)';
      subtitle.style.opacity='1';
    },300);
    setTimeout(function(){
      cornerTL.style.transition='opacity 0.6s ease';
      cornerTL.style.opacity='1';
    },400);
    setTimeout(function(){
      cornerTR.style.transition='opacity 0.6s ease';
      cornerTR.style.opacity='1';
    },500);
    ticks.forEach(function(tick){
      tick.style.transition='opacity 0.6s ease';
      tick.style.opacity='0.35';
    });
    var start=performance.now();
    var duration=1400;
    function tick(now){
      var t=Math.min((now-start)/duration,1);
      var eased=1-Math.pow(1-t,3);
      progressBar.style.width=(eased*100)+'%';
      if(t<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  },2800);

  setTimeout(function(){
    s.style.transition='opacity 0.8s ease, transform 0.8s ease';
    s.style.opacity='0';
    s.style.transform='scale(1.06)';
    setTimeout(function(){
      s.remove();
      try{sessionStorage.setItem('splash-done','true');}catch(e){}
    },800);
  },4600);
})();`;

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${sora.variable} ${spaceMono.variable} ${orbitron.variable}`}>

        {/* ── Splash Screen ── */}
        <div id="splash-screen" aria-hidden="true" style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#04040A",
          overflow: "hidden",
        }}>
          <style>{`@keyframes sp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

          {/* Ambiance */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 50% 40% at 35% 25%, #00E5FF05, transparent), radial-gradient(ellipse 40% 50% at 65% 75%, #FF006E04, transparent)",
          }} />

          {/* Film grain */}
          <div style={{
            position: "absolute",
            inset: 0,
            opacity: 0.025,
            backgroundImage: GRAIN_BG,
            backgroundSize: "200px",
            mixBlendMode: "overlay",
          }} />

          {/* Vitruvian geometry */}
          <svg viewBox="-160 -160 320 320" width={320} height={320} style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 1,
          }}>
            <defs>
              <linearGradient id="sp-cg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#FF006E" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#7B2FFF" stopOpacity={0.45} />
              </linearGradient>
              <linearGradient id="sp-sg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B2FFF" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#00E5FF" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF006E" stopOpacity={0.35} />
              </linearGradient>
              <filter id="sp-glow">
                <feGaussianBlur stdDeviation={2} result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Circle glow (behind, CSS blur) */}
            <circle id="sp-circle-glow" cx={0} cy={0} r={140}
              fill="none" stroke="url(#sp-cg)" strokeWidth={3}
              strokeDasharray={879.65} strokeDashoffset={879.65}
              opacity={0.12} style={{ filter: "blur(5px)" }}
            />

            {/* Circle (main) */}
            <circle id="sp-circle" cx={0} cy={0} r={140}
              fill="none" stroke="url(#sp-cg)" strokeWidth={0.8}
              strokeDasharray={879.65} strokeDashoffset={879.65}
              filter="url(#sp-glow)"
            />

            {/* Square */}
            <rect id="sp-square" x={-130} y={-130} width={260} height={260}
              fill="none" stroke="url(#sp-sg)" strokeWidth={0.6}
              strokeDasharray={1040} strokeDashoffset={1040}
            />

            {/* Cross (dashed) */}
            <line id="sp-cross-h" x1={-140} y1={0} x2={140} y2={0}
              stroke="rgba(255,255,255,0.03)" strokeWidth={0.5}
              strokeDasharray="4 8" opacity={0}
            />
            <line id="sp-cross-v" x1={0} y1={-140} x2={0} y2={140}
              stroke="rgba(255,255,255,0.03)" strokeWidth={0.5}
              strokeDasharray="4 8" opacity={0}
            />

            {/* Diagonals */}
            <line id="sp-diag1" x1={-130} y1={-130} x2={130} y2={130}
              stroke="rgba(255,255,255,0.015)" strokeWidth={0.4} opacity={0}
            />
            <line id="sp-diag2" x1={130} y1={-130} x2={-130} y2={130}
              stroke="rgba(255,255,255,0.015)" strokeWidth={0.4} opacity={0}
            />

            {/* Cardinal ticks (0°, 90°, 180°, 270°) */}
            <line className="sp-tick" x1={0} y1={-136} x2={0} y2={-144}
              stroke="#00E5FF" strokeWidth={0.8} opacity={0}
            />
            <line className="sp-tick" x1={136} y1={0} x2={144} y2={0}
              stroke="#00E5FF" strokeWidth={0.8} opacity={0}
            />
            <line className="sp-tick" x1={0} y1={136} x2={0} y2={144}
              stroke="#00E5FF" strokeWidth={0.8} opacity={0}
            />
            <line className="sp-tick" x1={-136} y1={0} x2={-144} y2={0}
              stroke="#00E5FF" strokeWidth={0.8} opacity={0}
            />

            {/* Inner circle (rotating) */}
            <circle cx={0} cy={0} r={22}
              fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}
              strokeDasharray="5 5"
              style={{ transformOrigin: "center", animation: "sp-spin 25s linear infinite" }}
            />
          </svg>

          {/* Mannequin */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 3,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              id="sp-mannequin"
              src="/images/anatomy/mini-mannequin.webp"
              alt=""
              style={{
                height: "260px",
                width: "auto",
                objectFit: "contain",
                opacity: 0,
                filter: "brightness(0.5) contrast(1.1)",
                mixBlendMode: "screen",
              }}
            />
            <div style={{
              position: "absolute",
              inset: "-30px",
              background: "radial-gradient(ellipse 65% 75% at 50% 50%, transparent 35%, #04040A 100%)",
              pointerEvents: "none",
            }} />
          </div>

          {/* Scan line */}
          <div id="sp-scan" style={{
            position: "absolute",
            top: "5%",
            left: 0,
            width: "100%",
            height: "2px",
            background: "linear-gradient(90deg, transparent 5%, #00E5FF80 30%, #00E5FF 50%, #00E5FF80 70%, transparent 95%)",
            boxShadow: "0 0 20px #00E5FF99, 0 0 40px #00E5FF33",
            opacity: 0,
            zIndex: 5,
          }} />

          {/* Title block */}
          <div style={{
            position: "absolute",
            top: "calc(50% + 180px)",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{ overflow: "hidden" }}>
              <h1 id="sp-title" style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2.2rem",
                fontWeight: 400,
                letterSpacing: "0.2em",
                color: "#F0F0F5",
                lineHeight: 1,
                margin: 0,
                transform: "translateY(120%)",
                opacity: 0,
              }}>
                MUSCU - EPS
              </h1>
            </div>
            <div id="sp-grad-line" style={{
              width: 0,
              height: "1px",
              background: "linear-gradient(90deg, #00E5FF00, #00E5FFCC, #FF006ECC, #FF006E00)",
            }} />
            <div style={{ overflow: "hidden" }}>
              <span id="sp-subtitle" style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.6rem",
                fontWeight: 500,
                letterSpacing: "0.5em",
                color: "rgba(255,255,255,0.22)",
                display: "block",
                transform: "translateY(100%)",
                opacity: 0,
              }}>
                TAZIEFF
              </span>
            </div>
          </div>

          {/* Corner top-left */}
          <div id="sp-corner-tl" style={{
            position: "absolute",
            top: "15%",
            left: "8%",
            opacity: 0,
            zIndex: 4,
          }}>
            <div style={{
              width: "14px",
              height: "14px",
              borderTop: "1px solid #00E5FF20",
              borderLeft: "1px solid #00E5FF20",
              marginBottom: "6px",
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.4rem",
              color: "rgba(255,255,255,0.08)",
            }}>5 GROUPES</span>
          </div>

          {/* Corner top-right */}
          <div id="sp-corner-tr" style={{
            position: "absolute",
            top: "15%",
            right: "8%",
            opacity: 0,
            zIndex: 4,
            textAlign: "right",
          }}>
            <div style={{
              width: "14px",
              height: "14px",
              borderTop: "1px solid #FF006E20",
              borderRight: "1px solid #FF006E20",
              marginBottom: "6px",
              marginLeft: "auto",
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.4rem",
              color: "rgba(255,255,255,0.08)",
            }}>80 EXERCICES</span>
          </div>

          {/* Bottom center — progress + label */}
          <div style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{
              width: "100px",
              height: "1px",
              background: "rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}>
              <div id="sp-progress" style={{
                width: "0%",
                height: "100%",
                background: "linear-gradient(90deg, #00E5FF, #FF006E)",
              }} />
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.42rem",
              color: "rgba(255,255,255,0.07)",
            }}>LYCÉE HAROUN TAZIEFF</span>
          </div>
        </div>

        {/* Splash animation script */}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />

        {children}
      </body>
    </html>
  );
}
