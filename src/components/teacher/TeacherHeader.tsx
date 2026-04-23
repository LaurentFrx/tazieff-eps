"use client";

// Phase E.2.3.3 — Header de navigation de l'espace enseignant.
// Présent sur toutes les pages du groupe `(authed)` (tableau-de-bord,
// mes-classes, mes-annotations, exercices…). Affiche la nav horizontale,
// l'email du prof et le bouton de déconnexion.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTeacherSession } from "@/hooks/useTeacherSession";
import { TEACHER_NAV } from "@/lib/teacher/display";
import styles from "./TeacherHeader.module.css";

export default function TeacherHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useTeacherSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const email = user?.email ?? "";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/connexion");
    } finally {
      setSigningOut(false);
      setMenuOpen(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/tableau-de-bord" className={styles.brand} aria-label="Tazieff EPS — Espace enseignant">
          <span className={styles.brandTitle}>MUSCU-EPS</span>
          <span className={styles.brandSubtitle}>TAZIEFF</span>
        </Link>

        <nav className={styles.nav} aria-label="Navigation enseignant">
          {TEACHER_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.account}>
          <button
            type="button"
            className={styles.accountBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className={styles.avatar} aria-hidden="true">
              {email.charAt(0).toUpperCase() || "?"}
            </span>
            <span className={styles.accountEmail}>{email}</span>
            <svg
              className={styles.chev}
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="5 8 10 13 15 8" />
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              <p className={styles.menuEmail}>{email}</p>
              <button
                type="button"
                role="menuitem"
                className={styles.signOut}
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Déconnexion…" : "Se déconnecter"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
