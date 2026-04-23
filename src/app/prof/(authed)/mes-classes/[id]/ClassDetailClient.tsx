"use client";

// Phase E.2.3.4 — Interactif : affichage du code + QR et régénération.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import styles from "./detail.module.css";

type Props = {
  classId: string;
  initialCode: string;
  expiresAt: string | null;
};

function buildJoinUrl(code: string): string {
  return `https://muscu-eps.fr/rejoindre?code=${encodeURIComponent(code)}`;
}

export default function ClassDetailClient({ classId, initialCode }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const url = buildJoinUrl(code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard error
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/teacher/classes/${classId}/regenerate-code`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.details?.message ?? body.error ?? `HTTP ${res.status}`);
        setRegenerating(false);
        return;
      }
      const updated = (await res.json()) as { join_code: string };
      setCode(updated.join_code);
      setConfirmOpen(false);
      // Refresh le RSC pour mettre à jour les autres champs si besoin.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <section className={styles.codeSection}>
      <div className={styles.codeBlock}>
        <p className={styles.codeLabel}>Code d&apos;accès</p>
        <p className={styles.codeDisplay} aria-label="Code de classe">
          {code}
        </p>
        <div className={styles.codeActions}>
          <button type="button" onClick={handleCopy} className={styles.secondaryBtn}>
            {copied ? "Copié ✓" : "Copier le code"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={styles.dangerBtn}
          >
            Régénérer
          </button>
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.qrBlock} aria-label="QR code de rattachement">
        <div className={styles.qrWrapper}>
          <QRCodeSVG
            value={url}
            size={280}
            level="M"
            bgColor="#f0f0f5"
            fgColor="#04040a"
          />
        </div>
        <p className={styles.qrHint}>Projetez ce QR code en classe.</p>
      </div>

      {confirmOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="regen-title"
        >
          <div className={styles.modal}>
            <h3 id="regen-title" className={styles.modalTitle}>
              Régénérer le code ?
            </h3>
            <p className={styles.modalBody}>
              L&apos;ancien code deviendra immédiatement invalide. Les élèves
              déjà inscrits restent dans la classe, mais les nouveaux devront
              utiliser le nouveau code.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setConfirmOpen(false)}
                disabled={regenerating}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.dangerBtnSolid}
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? "Génération…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
