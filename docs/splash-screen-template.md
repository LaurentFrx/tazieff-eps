# Splash Screen Template — Next.js App Router

> Script IIFE bloquant qui crée le splash dynamiquement via JavaScript pur.
> Zero HTML statique dans le JSX = zero erreur d'hydration React (#418).

---

## Principe

1. Un `<script>` inline bloquant dans le `<body>` du root layout
2. Le script crée tous les elements DOM via `document.createElement`
3. Le splash est injecte comme premier enfant du `<body>`
4. Les animations se declenchent via `setTimeout` + transitions CSS
5. Le splash se supprime lui-meme a la fin
6. `sessionStorage` empeche le rejeu dans la meme session

---

## Integration dans layout.tsx

```tsx
// src/app/layout.tsx

const SPLASH_SCRIPT = `(function(){
  // --- CONFIG ---
  var BG_COLOR   = "#04040A";           // fond du splash
  var ACCENT     = "#00E5FF";           // couleur accent
  var TITLE      = "MON APP";           // titre principal
  var SUBTITLE   = "sous-titre";        // sous-titre
  var DURATION   = 3000;                // duree totale (ms) avant fade out
  var FADE_OUT   = 600;                 // duree du fade out (ms)
  var SESSION_KEY = "splash-done";      // cle sessionStorage

  // --- GUARD ---
  try { if (sessionStorage.getItem(SESSION_KEY) === "true") return; } catch(e) {}

  // --- HELPERS ---
  function h(tag, css, attrs) {
    var el = document.createElement(tag);
    if (css) el.style.cssText = css;
    if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // --- SPLASH CONTAINER ---
  var splash = h("div",
    "position:fixed;inset:0;z-index:99999;" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "background:" + BG_COLOR + ";overflow:hidden;" +
    "transition:opacity " + FADE_OUT + "ms ease,transform " + FADE_OUT + "ms ease;",
    { id: "splash-screen", "aria-hidden": "true" }
  );

  // --- LOGO / ICONE (remplacer par votre visuel) ---
  var logo = h("div",
    "width:80px;height:80px;border-radius:20px;" +
    "background:linear-gradient(135deg," + ACCENT + "," + ACCENT + "80);" +
    "opacity:0;transform:scale(0.8);" +
    "transition:opacity 0.6s ease,transform 0.6s cubic-bezier(0.34,1.56,0.64,1);"
  );
  splash.appendChild(logo);

  // --- TITRE ---
  var title = h("h1",
    "margin-top:24px;font-family:system-ui,-apple-system,sans-serif;" +
    "font-size:clamp(1.4rem,6vw,2rem);font-weight:800;letter-spacing:-0.02em;" +
    "color:#F0F0F5;opacity:0;transform:translateY(16px);" +
    "transition:opacity 0.5s ease,transform 0.5s ease;"
  );
  title.textContent = TITLE;
  splash.appendChild(title);

  // --- SOUS-TITRE ---
  var sub = h("p",
    "margin-top:8px;font-family:system-ui,-apple-system,sans-serif;" +
    "font-size:0.85rem;color:rgba(255,255,255,0.4);letter-spacing:0.05em;" +
    "opacity:0;transform:translateY(12px);" +
    "transition:opacity 0.4s ease,transform 0.4s ease;"
  );
  sub.textContent = SUBTITLE;
  splash.appendChild(sub);

  // --- BARRE DE PROGRESSION ---
  var barWrap = h("div",
    "margin-top:32px;width:120px;height:3px;border-radius:2px;" +
    "background:rgba(255,255,255,0.08);overflow:hidden;opacity:0;" +
    "transition:opacity 0.3s ease;"
  );
  var barFill = h("div",
    "width:0%;height:100%;border-radius:2px;" +
    "background:linear-gradient(90deg," + ACCENT + "," + ACCENT + "80);"
  );
  barWrap.appendChild(barFill);
  splash.appendChild(barWrap);

  // --- INJECTION ---
  document.body.prepend(splash);
  splash.offsetHeight; // force reflow

  // --- CHOREOGRAPHIE ---

  // t=200ms : logo apparait
  setTimeout(function() {
    logo.style.opacity = "1";
    logo.style.transform = "scale(1)";
  }, 200);

  // t=500ms : titre apparait
  setTimeout(function() {
    title.style.opacity = "1";
    title.style.transform = "translateY(0)";
  }, 500);

  // t=700ms : sous-titre apparait
  setTimeout(function() {
    sub.style.opacity = "1";
    sub.style.transform = "translateY(0)";
  }, 700);

  // t=900ms : barre de progression
  setTimeout(function() {
    barWrap.style.opacity = "1";
    // animation fluide de la barre
    var start = performance.now();
    var dur = DURATION - 900 - FADE_OUT - 200; // temps restant pour la barre
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      barFill.style.width = (eased * 100) + "%";
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, 900);

  // t=DURATION : fade out
  setTimeout(function() {
    splash.style.opacity = "0";
    splash.style.transform = "scale(1.04)";
    setTimeout(function() {
      splash.remove();
      try { sessionStorage.setItem(SESSION_KEY, "true"); } catch(e) {}
    }, FADE_OUT);
  }, DURATION);
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
```

---

## Personnalisation

### Variables a modifier

| Variable | Description | Defaut |
|----------|-------------|--------|
| `BG_COLOR` | Couleur de fond du splash | `#04040A` |
| `ACCENT` | Couleur accent (logo, barre) | `#00E5FF` |
| `TITLE` | Texte du titre | `MON APP` |
| `SUBTITLE` | Texte du sous-titre | `sous-titre` |
| `DURATION` | Duree totale avant fade out (ms) | `3000` |
| `FADE_OUT` | Duree du fade out (ms) | `600` |
| `SESSION_KEY` | Cle sessionStorage | `splash-done` |

### Remplacer le logo par une image

```js
var logo = h("img",
  "height:80px;width:auto;opacity:0;transform:scale(0.8);" +
  "transition:opacity 0.6s ease,transform 0.6s cubic-bezier(0.34,1.56,0.64,1);",
  { src: "/logo.png", alt: "" }
);
```

### Remplacer le logo par un SVG inline

```js
var NS = "http://www.w3.org/2000/svg";
function sv(tag, attrs) {
  var el = document.createElementNS(NS, tag);
  if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

var svg = sv("svg", { viewBox: "0 0 100 100", width: "80", height: "80" });
svg.style.cssText = "opacity:0;transform:scale(0.8);" +
  "transition:opacity 0.6s ease,transform 0.6s cubic-bezier(0.34,1.56,0.64,1);";
var circle = sv("circle", { cx: "50", cy: "50", r: "45", fill: ACCENT });
svg.appendChild(circle);
splash.appendChild(svg);
// reference svg au lieu de logo dans le setTimeout
```

### Ajouter des keyframes CSS

```js
var style = document.createElement("style");
style.textContent = "@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}";
document.head.appendChild(style);
// ...
// dans le cleanup final :
// style.remove();
```

---

## Choreographie — Timeline

```
t=0ms       Splash injecte (fond visible immediatement)
t=200ms     Logo apparait (scale + opacity)
t=500ms     Titre apparait (slide up + opacity)
t=700ms     Sous-titre apparait (slide up + opacity)
t=900ms     Barre de progression demarre
t=DURATION  Fade out du splash (opacity 0, scale 1.04)
t=DURATION+FADE_OUT  splash.remove() + sessionStorage
```

---

## Points critiques

1. **`suppressHydrationWarning`** sur `<html>` et `<body>` — obligatoire car le script modifie le DOM avant l'hydration React

2. **`splash.offsetHeight`** apres `document.body.prepend(splash)` — force un reflow pour que le navigateur peigne l'etat initial avant les transitions

3. **`sessionStorage`** (pas `localStorage`) — le splash se rejoue a chaque nouvelle session navigateur, mais pas lors de navigations internes

4. **`position:fixed; z-index:99999`** — le splash couvre tout, y compris les modals et les overlays de l'app

5. **`aria-hidden="true"`** — le splash n'est pas lu par les lecteurs d'ecran

6. **`splash.remove()`** — supprime completement le DOM du splash, zero footprint apres l'animation

7. **Pas de `document.createElement` pour SVG** — utiliser `document.createElementNS("http://www.w3.org/2000/svg", ...)` pour tous les elements SVG

---

## Variante : splash conditionnel (premiere visite uniquement)

Remplacer `sessionStorage` par `localStorage` :

```js
try { if (localStorage.getItem("splash-seen") === "1") return; } catch(e) {}
// ...
// dans le cleanup :
try { localStorage.setItem("splash-seen", "1"); } catch(e) {}
```

---

## Variante : splash qui attend le chargement complet

Ajouter un listener `load` au lieu d'un timer fixe :

```js
var ready = false;
window.addEventListener("load", function() { ready = true; });

// remplacer le setTimeout(DURATION) par :
function checkReady() {
  if (ready) {
    // fade out
    splash.style.opacity = "0";
    splash.style.transform = "scale(1.04)";
    setTimeout(function() { splash.remove(); /* ... */ }, FADE_OUT);
  } else {
    setTimeout(checkReady, 100);
  }
}
setTimeout(checkReady, 1500); // minimum 1.5s d'affichage
```
