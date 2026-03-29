"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEnseignantLabels } from "../labels";

type DecodedSession = {
  t: string;       // titre
  n: string;       // niveau
  o: string;       // objectif
  c: string;       // consignes
  m: string[];     // methodes
  e: string[];     // exercices
};

export function SharedSession() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<DecodedSession | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const encoded = searchParams.get("seance");
    if (!encoded) { setError(true); return; }
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(encoded))) as DecodedSession;
      if (!decoded.t) throw new Error("invalid");
      setSession(decoded);
    } catch {
      setError(true);
    }
  }, [searchParams]);

  if (error) {
    return (
      <section className="page">
        <header className="page-header">
          <h1>{t("enseignant.sharedTitle")}</h1>
          <p className="lede">{t("enseignant.sharedError")}</p>
        </header>
        <Link href="/" className="primary-button">{t("offline.backHome")}</Link>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="page">
        <header className="page-header">
          <h1>{t("enseignant.sharedTitle")}</h1>
          <p className="lede">{t("enseignant.sharedLoading")}</p>
        </header>
      </section>
    );
  }

  const { niveauLabels, objectifLabels } = getEnseignantLabels(t);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{t("enseignant.sharedTitle")}</p>
        <h1>{session.t}</h1>
      </header>

      <div className="card">
        <div className="flex gap-2 flex-wrap text-xs">
          <span className="pill pill-active">{niveauLabels[session.n] ?? session.n}</span>
          <span className="pill pill-active">{objectifLabels[session.o] ?? session.o}</span>
        </div>
      </div>

      {session.c && (
        <div className="card mt-3">
          <h2 className="text-sm font-semibold text-[color:var(--muted)]">{t("enseignant.consignes")}</h2>
          <p className="text-[color:var(--ink)] mt-1">{session.c}</p>
        </div>
      )}

      {session.m.length > 0 && (
        <div className="card mt-3">
          <h2 className="text-sm font-semibold text-[color:var(--muted)]">{t("enseignant.methodes")}</h2>
          <div className="flex gap-2 flex-wrap mt-2">
            {session.m.map((slug) => (
              <Link key={slug} href={`/methodes/${slug}`} className="pill text-xs pill-active">
                {slug}
              </Link>
            ))}
          </div>
        </div>
      )}

      {session.e.length > 0 && (
        <div className="card mt-3">
          <h2 className="text-sm font-semibold text-[color:var(--muted)]">{t("enseignant.exercices")}</h2>
          <div className="flex gap-2 flex-wrap mt-2">
            {session.e.map((slug) => (
              <Link key={slug} href={`/exercices/${slug}`} className="pill text-xs">
                {slug}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/exercices" className="primary-button">
          {t("enseignant.goExercices")}
        </Link>
      </div>
    </section>
  );
}
