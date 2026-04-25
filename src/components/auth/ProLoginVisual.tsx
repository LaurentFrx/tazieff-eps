// Phase E.2.2.5 — Visuel de la page login prof.
// Recomposition des éléments du splash (cercles SVG, mannequin, scan line,
// typographie "MUSCU - EPS / TAZIEFF"), adaptée à un contexte de page login :
// corners "ESPACE" / "ENSEIGNANT", bandeau bas 2 lignes, scan en loop infinie.
//
// NE TOUCHE PAS à public/splash.js (fichier protégé, règle skill splash-animations).
// Animations CSS pures, pas de JS, pas de framer-motion, pas de Three.js.
// Respect prefers-reduced-motion via @media dans le module CSS.

import Image from "next/image";
import styles from "./ProLoginVisual.module.css";

type Props = {
  className?: string;
};

export default function ProLoginVisual({ className }: Props) {
  const rootClass = className
    ? `${styles.root} ${className}`
    : styles.root;

  return (
    <div className={rootClass} aria-hidden="true">
      {/* Fond radial glow */}
      <div className={styles.backdrop} />

      {/* SVG central : cercles concentriques + carré vignette + ticks */}
      <svg
        viewBox="-160 -160 320 320"
        width="min(320px, 40vmin)"
        height="min(320px, 40vmin)"
        className={styles.svgCore}
      >
        <defs>
          <linearGradient id="pl-cg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FF006E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7B2FFF" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="pl-sg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B2FFF" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF006E" stopOpacity="0.35" />
          </linearGradient>
          <filter id="pl-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Cercle flou (glow) */}
        <circle
          cx="0"
          cy="0"
          r="140"
          fill="none"
          stroke="url(#pl-cg)"
          strokeWidth="3"
          opacity="0.12"
          style={{ filter: "blur(5px)" }}
        />
        {/* Cercle net */}
        <circle
          cx="0"
          cy="0"
          r="140"
          fill="none"
          stroke="url(#pl-cg)"
          strokeWidth="0.8"
          filter="url(#pl-glow)"
        />
        {/* Carré vignette */}
        <rect
          x="-130"
          y="-130"
          width="260"
          height="260"
          fill="none"
          stroke="url(#pl-sg)"
          strokeWidth="0.6"
        />
        {/* Ticks cardinaux */}
        {[
          [0, -136, 0, -144],
          [136, 0, 144, 0],
          [0, 136, 0, 144],
          [-136, 0, -144, 0],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#00E5FF"
            strokeWidth="0.8"
            opacity="0.35"
          />
        ))}
        {/* Cercle intérieur tireté */}
        <circle
          cx="0"
          cy="0"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.5"
          strokeDasharray="5 5"
        />
      </svg>

      {/* Mannequin anatomique */}
      <div className={styles.mannequinWrap}>
        <Image
          src="/images/anatomy/mini-mannequin.webp"
          alt=""
          width={260}
          height={260}
          className={styles.mannequin}
          priority
        />
        <div className={styles.mannequinMask} />
      </div>

      {/* Ligne de scan */}
      <div className={styles.scanLine} />

      {/* Film grain overlay */}
      <div className={styles.grain} />

      {/* Typographie "MUSCU - EPS / gradient / TAZIEFF" */}
      <div className={styles.typo}>
        <h1 className={styles.title}>MUSCU - EPS</h1>
        <div className={styles.gradLine} />
        <span className={styles.subtitle}>TAZIEFF</span>
      </div>

      {/* Corners TL / TR */}
      <div className={styles.cornerTL}>
        <div className={styles.cornerDecoTL} />
        <span className={styles.cornerText}>ESPACE</span>
      </div>
      <div className={styles.cornerTR}>
        <div className={styles.cornerDecoTR} />
        <span className={styles.cornerText}>ENSEIGNANT</span>
      </div>

      {/* Bandeau bas 2 lignes */}
      <div className={styles.footer}>
        <span className={styles.footerLine1}>
          OUTIL PÉDAGOGIQUE • BAC EPS • GRATUIT ENSEIGNANTS
        </span>
        <span className={styles.footerLine2}>
          CONFORME RGPD • HÉBERGEMENT UE
        </span>
      </div>

      {/* Effet lumière bas */}
      <div className={styles.bottomGlow} />
    </div>
  );
}
