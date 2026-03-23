"use client";

import { useEffect, useRef, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    try {
      if (sessionStorage.getItem("tazieff-splash-shown")) {
        setVisible(false);
        return;
      }
    } catch { /* ignore */ }

    const $ = (id: string) => document.getElementById(id);

    setTimeout(() => {
      const bb = $("sp-bb");
      if (bb) { bb.style.opacity = "1"; bb.style.transform = "scale(1) rotate(0deg)"; }
    }, 200);

    setTimeout(() => {
      const tt = $("sp-tt");
      if (tt) { tt.style.opacity = "1"; tt.style.transform = "translateY(0)"; }
    }, 600);

    setTimeout(() => {
      const su = $("sp-su");
      if (su) { su.style.opacity = "1"; su.style.transform = "translateY(0)"; }
    }, 900);

    setTimeout(() => {
      const bw = $("sp-bw");
      if (bw) bw.style.opacity = "1";
      setTimeout(() => {
        const bf = $("sp-bf");
        if (bf) bf.style.width = "100%";
      }, 50);
    }, 1100);

    setTimeout(() => {
      const sc = $("splash-screen");
      if (sc) { sc.style.transition = "opacity 500ms ease-out"; sc.style.opacity = "0"; }
    }, 2600);

    setTimeout(() => {
      try { sessionStorage.setItem("tazieff-splash-shown", "1"); } catch { /* ignore */ }
      setVisible(false);
    }, 3100);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="splash-screen"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#050507",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <svg
        id="sp-bb"
        viewBox="0 0 200 80"
        width={180}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          opacity: 0,
          transform: "scale(0.5) rotate(-10deg)",
          transition:
            "opacity 600ms cubic-bezier(0.34,1.56,0.64,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <defs>
          <radialGradient id="sp-sh" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#000" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="sp-br" x1={30} y1={0} x2={170} y2={0} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b0b0b0" />
            <stop offset="50%" stopColor="#909090" />
            <stop offset="100%" stopColor="#b0b0b0" />
          </linearGradient>
          <linearGradient id="sp-di" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor="#c44820" />
            <stop offset="50%" stopColor="#f05a2b" />
            <stop offset="100%" stopColor="#c44820" />
          </linearGradient>
          <linearGradient id="sp-do" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor="#a33a18" />
            <stop offset="50%" stopColor="#f05a2b" />
            <stop offset="100%" stopColor="#a33a18" />
          </linearGradient>
          <linearGradient id="sp-cp" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor="#aaa" />
            <stop offset="100%" stopColor="#888" />
          </linearGradient>
        </defs>
        {/* Ombre */}
        <ellipse cx={100} cy={72} rx={70} ry={4} fill="url(#sp-sh)" />
        {/* Embouts */}
        <rect x={0} y={35} width={6} height={10} rx={2} fill="url(#sp-cp)" />
        <rect x={194} y={35} width={6} height={10} rx={2} fill="url(#sp-cp)" />
        {/* Disques ext */}
        <rect x={4} y={15} width={14} height={50} rx={3} fill="url(#sp-do)" />
        <rect x={4} y={15} width={3} height={50} rx={1} fill="white" fillOpacity={0.15} />
        <rect x={15} y={15} width={1.5} height={50} fill="black" fillOpacity={0.2} />
        <rect x={182} y={15} width={14} height={50} rx={3} fill="url(#sp-do)" />
        <rect x={182} y={15} width={3} height={50} rx={1} fill="white" fillOpacity={0.15} />
        <rect x={193.5} y={15} width={1.5} height={50} fill="black" fillOpacity={0.2} />
        {/* Disques int */}
        <rect x={18} y={22} width={10} height={36} rx={2} fill="url(#sp-di)" />
        <rect x={18} y={22} width={3} height={36} rx={1} fill="white" fillOpacity={0.15} />
        <rect x={172} y={22} width={10} height={36} rx={2} fill="url(#sp-di)" />
        <rect x={172} y={22} width={3} height={36} rx={1} fill="white" fillOpacity={0.15} />
        {/* Colliers */}
        <rect x={28} y={32} width={5} height={16} rx={1} fill="#888" stroke="#666" strokeWidth={0.5} />
        <rect x={167} y={32} width={5} height={16} rx={1} fill="#888" stroke="#666" strokeWidth={0.5} />
        {/* Barre */}
        <rect x={30} y={37} width={140} height={6} rx={3} fill="url(#sp-br)" />
        <rect x={30} y={37} width={140} height={1.5} rx={1} fill="white" fillOpacity={0.1} />
      </svg>

      <div
        id="sp-tt"
        style={{
          marginTop: 24,
          fontWeight: 900,
          fontSize: 28,
          color: "white",
          letterSpacing: "-0.5px",
          opacity: 0,
          transform: "translateY(16px)",
          transition: "opacity 500ms ease-out, transform 500ms ease-out",
        }}
      >
        Tazieff<span style={{ color: "#f05a2b" }}>&apos;</span>EPS
      </div>

      <div
        id="sp-su"
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#a1a1aa",
          textTransform: "uppercase",
          letterSpacing: "1px",
          opacity: 0,
          transform: "translateY(12px)",
          transition: "opacity 400ms ease-out, transform 400ms ease-out",
        }}
      >
        Musculation au lycée
      </div>

      <div
        id="sp-bw"
        style={{
          marginTop: 32,
          width: 120,
          height: 3,
          background: "#27272a",
          borderRadius: 2,
          overflow: "hidden",
          opacity: 0,
          transition: "opacity 300ms ease-out",
        }}
      >
        <div
          id="sp-bf"
          style={{
            width: "0%",
            height: "100%",
            background: "linear-gradient(to right, #f05a2b, #f59e0b)",
            borderRadius: 2,
            transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
