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

// Splash screen — pure DOM creation avoids React hydration mismatch (#418)
const SPLASH_SCRIPT = `(function(){
try{if(sessionStorage.getItem("splash-done")==="true")return}catch(e){}
var NS="http://www.w3.org/2000/svg";
function h(t,c,a){var e=document.createElement(t);if(c)e.style.cssText=c;if(a)for(var k in a)e.setAttribute(k,a[k]);return e}
function sv(t,a){var e=document.createElementNS(NS,t);if(a)for(var k in a)e.setAttribute(k,a[k]);return e}
var ks=document.createElement("style");
ks.textContent="@keyframes sp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
var splash=h("div","position:fixed;inset:0;z-index:9999;background:#04040A;overflow:hidden",{id:"splash-screen","aria-hidden":"true"});
splash.appendChild(h("div","position:absolute;inset:0;background:radial-gradient(ellipse 50% 40% at 35% 25%,#00E5FF05,transparent),radial-gradient(ellipse 40% 50% at 65% 75%,#FF006E04,transparent)"));
var grain=h("div","position:absolute;inset:0;opacity:0.025;background-size:200px;mix-blend-mode:overlay",{id:"sp-grain"});
splash.appendChild(grain);
var svg=sv("svg",{viewBox:"-160 -160 320 320",width:"320",height:"320"});
svg.style.cssText="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1";
var defs=sv("defs");
var cg=sv("linearGradient",{id:"sp-cg",x1:"0%",y1:"0%",x2:"100%",y2:"100%"});
cg.appendChild(sv("stop",{offset:"0%","stop-color":"#00E5FF","stop-opacity":"0.45"}));
cg.appendChild(sv("stop",{offset:"50%","stop-color":"#FF006E","stop-opacity":"0.25"}));
cg.appendChild(sv("stop",{offset:"100%","stop-color":"#7B2FFF","stop-opacity":"0.45"}));
defs.appendChild(cg);
var sg=sv("linearGradient",{id:"sp-sg",x1:"0%",y1:"0%",x2:"100%",y2:"100%"});
sg.appendChild(sv("stop",{offset:"0%","stop-color":"#7B2FFF","stop-opacity":"0.35"}));
sg.appendChild(sv("stop",{offset:"50%","stop-color":"#00E5FF","stop-opacity":"0.2"}));
sg.appendChild(sv("stop",{offset:"100%","stop-color":"#FF006E","stop-opacity":"0.35"}));
defs.appendChild(sg);
var flt=sv("filter",{id:"sp-glow"});
flt.appendChild(sv("feGaussianBlur",{stdDeviation:"2",result:"blur"}));
flt.appendChild(sv("feComposite",{"in":"SourceGraphic",in2:"blur",operator:"over"}));
defs.appendChild(flt);
svg.appendChild(defs);
var circleGlow=sv("circle",{cx:"0",cy:"0",r:"140",fill:"none",stroke:"url(#sp-cg)","stroke-width":"3","stroke-dasharray":"879.65","stroke-dashoffset":"879.65",opacity:"0.12",style:"filter:blur(5px)"});
svg.appendChild(circleGlow);
var circle=sv("circle",{cx:"0",cy:"0",r:"140",fill:"none",stroke:"url(#sp-cg)","stroke-width":"0.8","stroke-dasharray":"879.65","stroke-dashoffset":"879.65",filter:"url(#sp-glow)"});
svg.appendChild(circle);
var square=sv("rect",{x:"-130",y:"-130",width:"260",height:"260",fill:"none",stroke:"url(#sp-sg)","stroke-width":"0.6","stroke-dasharray":"1040","stroke-dashoffset":"1040"});
svg.appendChild(square);
var crossH=sv("line",{x1:"-140",y1:"0",x2:"140",y2:"0",stroke:"rgba(255,255,255,0.03)","stroke-width":"0.5","stroke-dasharray":"4 8",opacity:"0"});
svg.appendChild(crossH);
var crossV=sv("line",{x1:"0",y1:"-140",x2:"0",y2:"140",stroke:"rgba(255,255,255,0.03)","stroke-width":"0.5","stroke-dasharray":"4 8",opacity:"0"});
svg.appendChild(crossV);
var diag1=sv("line",{x1:"-130",y1:"-130",x2:"130",y2:"130",stroke:"rgba(255,255,255,0.015)","stroke-width":"0.4",opacity:"0"});
svg.appendChild(diag1);
var diag2=sv("line",{x1:"130",y1:"-130",x2:"-130",y2:"130",stroke:"rgba(255,255,255,0.015)","stroke-width":"0.4",opacity:"0"});
svg.appendChild(diag2);
var ticks=[];
[[0,-136,0,-144],[136,0,144,0],[0,136,0,144],[-136,0,-144,0]].forEach(function(d){var t=sv("line",{x1:""+d[0],y1:""+d[1],x2:""+d[2],y2:""+d[3],stroke:"#00E5FF","stroke-width":"0.8",opacity:"0"});svg.appendChild(t);ticks.push(t)});
var ic=sv("circle",{cx:"0",cy:"0",r:"22",fill:"none",stroke:"rgba(255,255,255,0.04)","stroke-width":"0.5","stroke-dasharray":"5 5"});
ic.style.cssText="transform-origin:center;animation:sp-spin 25s linear infinite";
svg.appendChild(ic);
splash.appendChild(svg);
var mw=h("div","position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3");
var mann=h("img","height:260px;width:auto;object-fit:contain;opacity:0;filter:brightness(0.5) contrast(1.1);mix-blend-mode:screen",{id:"sp-mannequin",src:"/images/anatomy/mini-mannequin.webp",alt:""});
mw.appendChild(mann);
mw.appendChild(h("div","position:absolute;inset:-30px;background:radial-gradient(ellipse 65% 75% at 50% 50%,transparent 35%,#04040A 100%);pointer-events:none"));
splash.appendChild(mw);
var scan=h("div","position:absolute;top:5%;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent 5%,#00E5FF80 30%,#00E5FF 50%,#00E5FF80 70%,transparent 95%);box-shadow:0 0 20px #00E5FF99,0 0 40px #00E5FF33;opacity:0;z-index:5",{id:"sp-scan"});
splash.appendChild(scan);
var tw=h("div","position:absolute;top:calc(50% + 180px);left:50%;transform:translateX(-50%);text-align:center;z-index:4;display:flex;flex-direction:column;align-items:center;gap:8px");
var tc=h("div","overflow:hidden");
var title=h("h1","font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,6vw,2.2rem);font-weight:400;letter-spacing:0.2em;color:#F0F0F5;line-height:1;margin:0;white-space:nowrap;transform:translateY(120%);opacity:0",{id:"sp-title"});
title.textContent="MUSCU - EPS";tc.appendChild(title);tw.appendChild(tc);
var gl=h("div","width:0;height:1px;background:linear-gradient(90deg,#00E5FF00,#00E5FFCC,#FF006ECC,#FF006E00)",{id:"sp-grad-line"});
tw.appendChild(gl);
var sc=h("div","overflow:hidden");
var sub=h("span","font-family:'DM Sans',sans-serif;font-size:0.6rem;font-weight:500;letter-spacing:0.5em;color:rgba(255,255,255,0.22);display:block;transform:translateY(100%);opacity:0",{id:"sp-subtitle"});
sub.textContent="TAZIEFF";sc.appendChild(sub);tw.appendChild(sc);
splash.appendChild(tw);
var ctl=h("div","position:absolute;top:15%;left:8%;opacity:0;z-index:4",{id:"sp-corner-tl"});
ctl.appendChild(h("div","width:14px;height:14px;border-top:1px solid #00E5FF20;border-left:1px solid #00E5FF20;margin-bottom:6px"));
var ctlt=h("span","font-family:'JetBrains Mono',monospace;font-size:0.4rem;color:rgba(255,255,255,0.08)");ctlt.textContent="5 GROUPES";ctl.appendChild(ctlt);
splash.appendChild(ctl);
var ctr=h("div","position:absolute;top:15%;right:8%;opacity:0;z-index:4;text-align:right",{id:"sp-corner-tr"});
ctr.appendChild(h("div","width:14px;height:14px;border-top:1px solid #FF006E20;border-right:1px solid #FF006E20;margin-bottom:6px;margin-left:auto"));
var ctrt=h("span","font-family:'JetBrains Mono',monospace;font-size:0.4rem;color:rgba(255,255,255,0.08)");ctrt.textContent="80 EXERCICES";ctr.appendChild(ctrt);
splash.appendChild(ctr);
var bw=h("div","position:absolute;bottom:8%;left:50%;transform:translateX(-50%);text-align:center;z-index:4;display:flex;flex-direction:column;align-items:center;gap:8px");
var pt=h("div","width:100px;height:1px;background:rgba(255,255,255,0.04);overflow:hidden");
var pb=h("div","width:0%;height:100%;background:linear-gradient(90deg,#00E5FF,#FF006E)",{id:"sp-progress"});
pt.appendChild(pb);bw.appendChild(pt);
var bt=h("span","font-family:'JetBrains Mono',monospace;font-size:0.42rem;color:rgba(255,255,255,0.07)");
bt.textContent="LYC\\u00C9E HAROUN TAZIEFF";bw.appendChild(bt);
splash.appendChild(bw);
grain.style.backgroundImage="url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\\")";
document.head.appendChild(ks);
document.documentElement.appendChild(splash);
splash.offsetHeight;
setTimeout(function(){
circle.style.transition="stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)";circle.style.strokeDashoffset="0";
circleGlow.style.transition="stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)";circleGlow.style.strokeDashoffset="0";
setTimeout(function(){square.style.transition="stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1)";square.style.strokeDashoffset="0"},300);
setTimeout(function(){mann.style.transition="opacity 1.2s ease, filter 1s ease";mann.style.opacity="1"},600);
},400);
setTimeout(function(){
scan.style.transition="top 2s ease-in-out, opacity 0.3s ease";scan.style.opacity="1";scan.style.top="90%";
mann.style.filter="brightness(0.9) contrast(1.2) drop-shadow(0 0 12px #00E5FF40) drop-shadow(0 0 25px #7B2FFF1F)";
crossH.style.transition="opacity 0.8s ease";crossH.style.opacity="1";
crossV.style.transition="opacity 0.8s ease";crossV.style.opacity="1";
diag1.style.transition="opacity 0.8s ease";diag1.style.opacity="1";
diag2.style.transition="opacity 0.8s ease";diag2.style.opacity="1";
},1400);
setTimeout(function(){
title.style.transition="transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease";title.style.transform="translateY(0)";title.style.opacity="1";
setTimeout(function(){gl.style.transition="width 0.9s cubic-bezier(0.16,1,0.3,1)";gl.style.width="44px"},200);
setTimeout(function(){sub.style.transition="transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease";sub.style.transform="translateY(0)";sub.style.opacity="1"},300);
setTimeout(function(){ctl.style.transition="opacity 0.6s ease";ctl.style.opacity="1"},400);
setTimeout(function(){ctr.style.transition="opacity 0.6s ease";ctr.style.opacity="1"},500);
ticks.forEach(function(t){t.style.transition="opacity 0.6s ease";t.style.opacity="0.35"});
var start=performance.now(),dur=1400;
function tick(now){var p=Math.min((now-start)/dur,1);pb.style.width=(1-Math.pow(1-p,3))*100+"%";if(p<1)requestAnimationFrame(tick)}
requestAnimationFrame(tick);
},2800);
setTimeout(function(){
splash.style.transition="opacity 0.8s ease, transform 0.8s ease";splash.style.opacity="0";splash.style.transform="scale(1.06)";
setTimeout(function(){splash.remove();ks.remove();try{sessionStorage.setItem("splash-done","true")}catch(e){}},800);
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
      className="dark"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" href="/images/anatomy/mini-mannequin.webp" as="image" />
      </head>
      <body className={`${spaceGrotesk.variable} ${sora.variable} ${spaceMono.variable} ${orbitron.variable}`} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
