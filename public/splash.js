(function(){
/* ─────────────────────────────────────────────────────────────────────────
 * Tazieff EPS — Splash screen (sprint splash-reduction, 29 avril 2026)
 *
 * Durée totale : 2000 ms (réduction 5400→2000, gain SEO/UX 3400 ms).
 * Investigation préalable : rapport CC du 29 avril (LCP/TTI/INP dégradés
 * + risque dépassement Googlebot rendering budget 5 s).
 *
 * Chronologie en 3 phases :
 *   Phase A — Apparition       T = 0    → 600  (halo + mannequin)
 *   Phase B — Marque           T = 600  → 1500 (titre + subtitle + hold)
 *   Phase C — Fade-out         T = 1500 → 2000
 *
 * Éléments préservés (identité visuelle Sport Vibrant) :
 *   - Fond #04040A + radial-gradients cyan/magenta/violet
 *   - Halo circulaire dégradé (signature)
 *   - Mini-mannequin anatomie (LCP candidate)
 *   - Titre « MUSCU - EPS » en Bebas Neue
 *   - Subtitle « TAZIEFF »
 *   - Signature « LYCÉE HAROUN TAZIEFF »
 *
 * Éléments supprimés (gain perf, peu d'apport identitaire à 2 s) :
 *   carré décoratif, scan-line, crosses/diags, ticks, glow animé mannequin,
 *   corners textuels, progress bar, inner-circle spin, grain noise overlay.
 *
 * Skip mechanism : sessionStorage.splash_shown reste actif (visite 2+ → 0 ms).
 * Le splash est injecté APRÈS un requestAnimationFrame pour ne pas bloquer
 * l'hydratation React (pas de DOM change synchrone qui déclenche #418).
 * ──────────────────────────────────────────────────────────────────────── */

try { if (sessionStorage.getItem("splash_shown")) return; } catch (e) {}
try { sessionStorage.setItem("splash_shown", "1"); } catch (e) {}

/* ── Step 1: Hide body immediately (no DOM change = no React #418) ── */
var hideStyle = document.createElement("style");
hideStyle.id = "splash-hide";
hideStyle.textContent = "body{visibility:hidden!important}";
document.head.appendChild(hideStyle);

/* ── Step 2: Build splash off-DOM (in memory, not attached yet) ── */
var NS = "http://www.w3.org/2000/svg";
function h(t, c, a) {
  var e = document.createElement(t);
  if (c) e.style.cssText = c;
  if (a) for (var k in a) e.setAttribute(k, a[k]);
  return e;
}
function sv(t, a) {
  var e = document.createElementNS(NS, t);
  if (a) for (var k in a) e.setAttribute(k, a[k]);
  return e;
}

var splash = h(
  "div",
  "position:fixed;inset:0;z-index:99999;background:#04040A;overflow:hidden;opacity:0;transition:opacity 0.25s ease",
  { id: "splash-screen", "aria-hidden": "true" }
);

/* Fond : radial-gradients discrets (cyan + magenta) */
splash.appendChild(h(
  "div",
  "position:absolute;inset:0;background:radial-gradient(ellipse 50% 40% at 35% 25%,#00E5FF08,transparent),radial-gradient(ellipse 40% 50% at 65% 75%,#FF006E06,transparent)"
));

/* Halo circulaire — SVG avec un seul gradient */
var svg = sv("svg", { viewBox: "-160 -160 320 320", width: "320", height: "320" });
svg.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1";

var defs = sv("defs");
var cg = sv("linearGradient", { id: "sp-cg", x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
cg.appendChild(sv("stop", { offset: "0%", "stop-color": "#00E5FF", "stop-opacity": "0.45" }));
cg.appendChild(sv("stop", { offset: "50%", "stop-color": "#FF006E", "stop-opacity": "0.25" }));
cg.appendChild(sv("stop", { offset: "100%", "stop-color": "#7B2FFF", "stop-opacity": "0.45" }));
defs.appendChild(cg);
svg.appendChild(defs);

/* Cercle-halo : trait fin, opacity initiale 0 (apparition phase A) */
var circle = sv("circle", {
  cx: "0", cy: "0", r: "140",
  fill: "none", stroke: "url(#sp-cg)",
  "stroke-width": "0.8", opacity: "0"
});
svg.appendChild(circle);
splash.appendChild(svg);

/* Mannequin anatomie — LCP candidate, opacity 0 au montage */
var mw = h("div", "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3");
var mann = h(
  "img",
  "height:260px;width:auto;object-fit:contain;opacity:0;filter:brightness(0.85) contrast(1.15) drop-shadow(0 0 12px #00E5FF40);mix-blend-mode:screen",
  { id: "sp-mannequin", src: "/images/anatomy/mini-mannequin.webp", alt: "" }
);
mw.appendChild(mann);
mw.appendChild(h(
  "div",
  "position:absolute;inset:-30px;background:radial-gradient(ellipse 65% 75% at 50% 50%,transparent 35%,#04040A 100%);pointer-events:none"
));
splash.appendChild(mw);

/* Titre + subtitle */
var tw = h(
  "div",
  "position:absolute;top:calc(50% + 180px);left:50%;transform:translateX(-50%);text-align:center;z-index:4;display:flex;flex-direction:column;align-items:center;gap:8px"
);
var tc = h("div", "overflow:hidden");
var title = h(
  "h1",
  "font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,6vw,2.2rem);font-weight:400;letter-spacing:0.2em;color:#F0F0F5;line-height:1;margin:0;white-space:nowrap;transform:translateY(120%);opacity:0",
  { id: "sp-title" }
);
title.textContent = "MUSCU - EPS";
tc.appendChild(title);
tw.appendChild(tc);

var sc = h("div", "overflow:hidden");
var sub = h(
  "span",
  "font-family:'DM Sans',sans-serif;font-size:0.6rem;font-weight:500;letter-spacing:0.5em;color:rgba(255,255,255,0.22);display:block;transform:translateY(100%);opacity:0",
  { id: "sp-subtitle" }
);
sub.textContent = "TAZIEFF";
sc.appendChild(sub);
tw.appendChild(sc);
splash.appendChild(tw);

/* Signature bas de splash */
var bw = h(
  "div",
  "position:absolute;bottom:8%;left:50%;transform:translateX(-50%);text-align:center;z-index:4;opacity:0;transition:opacity 0.4s ease 0.2s"
);
var bt = h(
  "span",
  "font-family:'JetBrains Mono',monospace;font-size:0.42rem;color:rgba(255,255,255,0.07);letter-spacing:0.2em"
);
bt.textContent = "LYCÉE HAROUN TAZIEFF";
bw.appendChild(bt);
splash.appendChild(bw);

/* ── Step 3: Inject splash AFTER React hydration (next paint) ── */
requestAnimationFrame(function () {
  document.body.appendChild(splash);
  hideStyle.remove();
  // Force layout pour garantir l'apparition du transition opacity → 1.
  splash.offsetHeight;

  /* ── Phase A — Apparition (T = 0 → 600 ms) ─────────────────────────── */
  // Conteneur splash : fade-in 250 ms (quasi instantané, évite le flash)
  splash.style.opacity = "1";
  // Halo cercle : opacity 0 → 0.6 sur 600 ms
  circle.style.transition = "opacity 0.6s cubic-bezier(0.16,1,0.3,1)";
  circle.style.opacity = "0.6";
  // Mannequin : opacity 0 → 1 sur 500 ms (commence à T=100 pour étalonner)
  setTimeout(function () {
    mann.style.transition = "opacity 0.5s ease";
    mann.style.opacity = "1";
  }, 100);

  /* ── Phase B — Marque (T = 600 → 1500 ms) ──────────────────────────── */
  // Titre MUSCU - EPS apparaît à T=600 (transition 350 ms)
  setTimeout(function () {
    title.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease";
    title.style.transform = "translateY(0)";
    title.style.opacity = "1";
  }, 600);
  // Subtitle TAZIEFF apparaît à T=900 (transition 300 ms, fin à T=1200)
  setTimeout(function () {
    sub.style.transition = "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease";
    sub.style.transform = "translateY(0)";
    sub.style.opacity = "1";
  }, 900);
  // Signature bas à T=1100 (sa propre transition 0.4s + delay 0.2s côté CSS)
  setTimeout(function () {
    bw.style.opacity = "1";
  }, 1100);

  /* ── Phase C — Fade-out (T = 1500 → 2000 ms) ───────────────────────── */
  setTimeout(function () {
    splash.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    splash.style.opacity = "0";
    splash.style.transform = "scale(1.04)";
  }, 1500);
  setTimeout(function () {
    splash.remove();
  }, 2000);
});
})();
