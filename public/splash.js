(function(){
if(window.__splashStarted)return;
window.__splashStarted=true;

/* ── Helpers ── */
var NS="http://www.w3.org/2000/svg";
function el(t,s,a){var e=document.createElement(t);if(s)e.style.cssText=s;if(a)for(var k in a)e.setAttribute(k,a[k]);return e}
function sv(t,a){var e=document.createElementNS(NS,t);if(a)for(var k in a)e.setAttribute(k,a[k]);return e}
function reveal(){var h=document.getElementById("splash-hide");if(h)h.remove()}

/* ── Navigation type ── */
var nt="navigate";
try{var ne=performance.getEntriesByType("navigation")[0];if(ne)nt=ne.type}catch(e){}

/* ── Device detection ── */
var ua=navigator.userAgent;
var mobile=navigator.maxTouchPoints>1||/Mobi|Android|iPhone|iPod/i.test(ua);

/* ── Skip guards ── */
// Reload (pull-to-refresh) or back/forward: never show splash
if(nt!=="navigate"){reveal();return}
// Desktop: show once per browser session
if(!mobile){try{if(sessionStorage.getItem("_sp")){reveal();return}sessionStorage.setItem("_sp","1")}catch(e){}}

/* ── Theme detection (cookie > prefers-color-scheme > default dark) ── */
var dk=true;
try{var cm=document.cookie.match(/eps_theme=(\w+)/);if(cm&&cm[1]==="light")dk=false;else if(!cm&&window.matchMedia&&window.matchMedia("(prefers-color-scheme:light)").matches)dk=false}catch(e){}

/* ── Palette ── */
var BG=dk?"#0b1020":"#f5efe6";
var TX=dk?"rgba(240,240,245,":"rgba(30,26,22,";
var FN=dk?"rgba(255,255,255,":"rgba(30,26,22,";
var CYAN="#00E5FF",PINK="#FF006E",PURPLE="#7B2FFF";
var MF=dk?"brightness(0.5) contrast(1.1)":"brightness(1.1) contrast(0.9) saturate(0.7)";
var MB=dk?"screen":"multiply";
var MA=dk
  ?"brightness(0.9) contrast(1.2) drop-shadow(0 0 12px "+CYAN+"40) drop-shadow(0 0 25px "+PURPLE+"1F)"
  :"brightness(1.0) contrast(1.05) drop-shadow(0 0 8px rgba(0,229,255,0.25)) drop-shadow(0 0 20px rgba(123,47,255,0.08))";
var GBG=dk
  ?"radial-gradient(ellipse 50% 40% at 35% 25%,#00E5FF05,transparent),radial-gradient(ellipse 40% 50% at 65% 75%,#FF006E04,transparent)"
  :"radial-gradient(ellipse 50% 40% at 35% 25%,rgba(0,229,255,0.02),transparent),radial-gradient(ellipse 40% 50% at 65% 75%,rgba(255,0,110,0.02),transparent)";
var GRO=dk?"0.025":"0.015";
var SSH=dk?"0 0 20px "+CYAN+"99,0 0 40px "+CYAN+"33":"0 0 12px rgba(0,229,255,0.4),0 0 24px rgba(0,229,255,0.13)";
var cA=dk?"0.03":"0.06", dA=dk?"0.015":"0.03", rA=dk?"0.04":"0.08";
var sA=dk?"0.22":"0.35", coA=dk?"0.08":"0.15", boA=dk?"0.07":"0.12";
var tkA=dk?"0.35":"0.5";

/* ── Safety net: force-reveal after 8s if something goes wrong ── */
var safety=setTimeout(function(){reveal();var s=document.getElementById("splash-screen");if(s)s.remove()},8000);

/* ── Build splash DOM (off-DOM, in memory) ── */
var ks=el("style");
ks.textContent="@keyframes sp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";

var splash=el("div","position:fixed;inset:0;z-index:99999;background:"+BG+";overflow:hidden",{id:"splash-screen","aria-hidden":"true"});
splash.appendChild(el("div","position:absolute;inset:0;background:"+GBG));

var grain=el("div","position:absolute;inset:0;opacity:"+GRO+";background-size:200px;mix-blend-mode:overlay");
splash.appendChild(grain);

/* SVG geometry */
var svg=sv("svg",{viewBox:"-160 -160 320 320",width:"320",height:"320"});
svg.style.cssText="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1";

var defs=sv("defs");
var cg=sv("linearGradient",{id:"sp-cg",x1:"0%",y1:"0%",x2:"100%",y2:"100%"});
cg.appendChild(sv("stop",{offset:"0%","stop-color":CYAN,"stop-opacity":"0.45"}));
cg.appendChild(sv("stop",{offset:"50%","stop-color":PINK,"stop-opacity":"0.25"}));
cg.appendChild(sv("stop",{offset:"100%","stop-color":PURPLE,"stop-opacity":"0.45"}));
defs.appendChild(cg);

var sg=sv("linearGradient",{id:"sp-sg",x1:"0%",y1:"0%",x2:"100%",y2:"100%"});
sg.appendChild(sv("stop",{offset:"0%","stop-color":PURPLE,"stop-opacity":"0.35"}));
sg.appendChild(sv("stop",{offset:"50%","stop-color":CYAN,"stop-opacity":"0.2"}));
sg.appendChild(sv("stop",{offset:"100%","stop-color":PINK,"stop-opacity":"0.35"}));
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

var crossH=sv("line",{x1:"-140",y1:"0",x2:"140",y2:"0",stroke:FN+cA+")","stroke-width":"0.5","stroke-dasharray":"4 8",opacity:"0"});
svg.appendChild(crossH);
var crossV=sv("line",{x1:"0",y1:"-140",x2:"0",y2:"140",stroke:FN+cA+")","stroke-width":"0.5","stroke-dasharray":"4 8",opacity:"0"});
svg.appendChild(crossV);
var diag1=sv("line",{x1:"-130",y1:"-130",x2:"130",y2:"130",stroke:FN+dA+")","stroke-width":"0.4",opacity:"0"});
svg.appendChild(diag1);
var diag2=sv("line",{x1:"130",y1:"-130",x2:"-130",y2:"130",stroke:FN+dA+")","stroke-width":"0.4",opacity:"0"});
svg.appendChild(diag2);

var ticks=[];
[[0,-136,0,-144],[136,0,144,0],[0,136,0,144],[-136,0,-144,0]].forEach(function(d){
  var t=sv("line",{x1:""+d[0],y1:""+d[1],x2:""+d[2],y2:""+d[3],stroke:CYAN,"stroke-width":"0.8",opacity:"0"});
  svg.appendChild(t);ticks.push(t);
});

var ic=sv("circle",{cx:"0",cy:"0",r:"22",fill:"none",stroke:FN+rA+")","stroke-width":"0.5","stroke-dasharray":"5 5"});
ic.style.cssText="transform-origin:center;animation:sp-spin 25s linear infinite";
svg.appendChild(ic);
splash.appendChild(svg);

/* Mannequin */
var mw=el("div","position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3");
var mann=el("img","height:260px;width:auto;object-fit:contain;opacity:0;filter:"+MF+";mix-blend-mode:"+MB,{src:"/images/anatomy/mini-mannequin.webp",alt:""});
mw.appendChild(mann);
mw.appendChild(el("div","position:absolute;inset:-30px;background:radial-gradient(ellipse 65% 75% at 50% 50%,transparent 35%,"+BG+" 100%);pointer-events:none"));
splash.appendChild(mw);

/* Scan line */
var scan=el("div","position:absolute;top:5%;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent 5%,"+CYAN+"80 30%,"+CYAN+" 50%,"+CYAN+"80 70%,transparent 95%);box-shadow:"+SSH+";opacity:0;z-index:5");
splash.appendChild(scan);

/* Text block */
var tw=el("div","position:absolute;top:calc(50% + 180px);left:50%;transform:translateX(-50%);text-align:center;z-index:4;display:flex;flex-direction:column;align-items:center;gap:8px");
var tc=el("div","overflow:hidden");
var title=el("h1","font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,6vw,2.2rem);font-weight:400;letter-spacing:0.2em;color:"+TX+"1);line-height:1;margin:0;white-space:nowrap;transform:translateY(120%);opacity:0");
title.textContent="MUSCU - EPS";tc.appendChild(title);tw.appendChild(tc);

var gl=el("div","width:0;height:1px;background:linear-gradient(90deg,"+CYAN+"00,"+CYAN+"CC,"+PINK+"CC,"+PINK+"00)");
tw.appendChild(gl);

var sc=el("div","overflow:hidden");
var sub=el("span","font-family:'DM Sans',sans-serif;font-size:0.6rem;font-weight:500;letter-spacing:0.5em;color:"+TX+sA+");display:block;transform:translateY(100%);opacity:0");
sub.textContent="TAZIEFF";sc.appendChild(sub);tw.appendChild(sc);
splash.appendChild(tw);

/* Corners */
var ctl=el("div","position:absolute;top:15%;left:8%;opacity:0;z-index:4");
ctl.appendChild(el("div","width:14px;height:14px;border-top:1px solid "+CYAN+"20;border-left:1px solid "+CYAN+"20;margin-bottom:6px"));
var ctlt=el("span","font-family:'JetBrains Mono',monospace;font-size:0.4rem;color:"+TX+coA+")");
ctlt.textContent="5 GROUPES";ctl.appendChild(ctlt);
splash.appendChild(ctl);

var ctr=el("div","position:absolute;top:15%;right:8%;opacity:0;z-index:4;text-align:right");
ctr.appendChild(el("div","width:14px;height:14px;border-top:1px solid "+PINK+"20;border-right:1px solid "+PINK+"20;margin-bottom:6px;margin-left:auto"));
var ctrt=el("span","font-family:'JetBrains Mono',monospace;font-size:0.4rem;color:"+TX+coA+")");
ctrt.textContent="80 EXERCICES";ctr.appendChild(ctrt);
splash.appendChild(ctr);

/* Progress bar */
var bw=el("div","position:absolute;bottom:8%;left:50%;transform:translateX(-50%);text-align:center;z-index:4;display:flex;flex-direction:column;align-items:center;gap:8px");
var pt=el("div","width:100px;height:1px;background:"+FN+"0.04);overflow:hidden");
var pb=el("div","width:0%;height:100%;background:linear-gradient(90deg,"+CYAN+","+PINK+")");
pt.appendChild(pb);bw.appendChild(pt);
var bt=el("span","font-family:'JetBrains Mono',monospace;font-size:0.42rem;color:"+TX+boA+")");
bt.textContent="LYC\u00C9E HAROUN TAZIEFF";bw.appendChild(bt);
splash.appendChild(bw);

/* Grain texture */
grain.style.backgroundImage='url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")';

/* ── Inject with double-RAF (guarantees splash is painted before body reveals) ── */
requestAnimationFrame(function(){requestAnimationFrame(function(){
  document.head.appendChild(ks);
  document.body.appendChild(splash);
  reveal();
  splash.offsetHeight; /* force reflow */

  /* ── Choreography ── */
  setTimeout(function(){
    circle.style.transition="stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)";circle.style.strokeDashoffset="0";
    circleGlow.style.transition="stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)";circleGlow.style.strokeDashoffset="0";
    setTimeout(function(){square.style.transition="stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1)";square.style.strokeDashoffset="0"},300);
    setTimeout(function(){mann.style.transition="opacity 1.2s ease, filter 1s ease";mann.style.opacity="1"},600);
  },400);

  setTimeout(function(){
    scan.style.transition="top 2s ease-in-out, opacity 0.3s ease";scan.style.opacity="1";scan.style.top="90%";
    mann.style.filter=MA;
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
    ticks.forEach(function(t){t.style.transition="opacity 0.6s ease";t.style.opacity=tkA});
    var start=performance.now(),dur=1400;
    function tick(now){var p=Math.min((now-start)/dur,1);pb.style.width=(1-Math.pow(1-p,3))*100+"%";if(p<1)requestAnimationFrame(tick)}
    requestAnimationFrame(tick);
  },2800);

  /* Fade out + cleanup */
  setTimeout(function(){
    splash.style.transition="opacity 0.8s ease, transform 0.8s ease";splash.style.opacity="0";splash.style.transform="scale(1.06)";
    setTimeout(function(){splash.remove();ks.remove();clearTimeout(safety)},800);
  },4600);
})});
})();
