"use client";

// Phase E.2.2.5 — Banc d'essai dev pour valider le flow magic link + API
// annotations bout-en-bout sur le sous-domaine prof. Pas de design, c'est
// jetable — la vraie UI de connexion est sur /connexion.
//
// Utilise `useTeacherSession` (TeacherAuthContext) et non `useTeacherAuth`
// (AuthContext élève), car le sous-domaine prof n'a pas d'AuthProvider.

import { useState } from "react";
import { useTeacherSession } from "@/hooks/useTeacherSession";

export default function TeacherLoginDevClient() {
  const { user, isTeacher, isLoading, signInWithEmail, signOut } =
    useTeacherSession();

  const [email, setEmail] = useState("");
  const [signinFeedback, setSigninFeedback] = useState<string | null>(null);
  const [testAnnotationResult, setTestAnnotationResult] = useState<string | null>(
    null,
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninFeedback("Envoi en cours…");
    const result = await signInWithEmail(email);
    if (!result.ok) {
      setSigninFeedback(`❌ ${result.error ?? "Erreur inconnue"}`);
      return;
    }
    if (result.eligible) {
      setSigninFeedback(
        "✅ Lien envoyé, vérifiez votre boîte mail. Cliquez sur le lien pour revenir connecté.",
      );
    } else {
      setSigninFeedback(
        "⚠️ Email non académique : aucun lien envoyé. Utilise une adresse @ac-*.fr.",
      );
    }
  };

  const handleTestAnnotation = async () => {
    setTestAnnotationResult("Création en cours…");
    try {
      const response = await fetch("/api/teacher/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: "00000000-0000-0000-0001-000000000001", // org seed E.2.1
          exercise_slug: "s1-01",
          locale: "fr",
          content: { title: "Test dev", notes: "Annotation de test." },
          visibility_scope: "private",
        }),
      });
      const body = await response.json().catch(() => ({}));
      setTestAnnotationResult(
        `HTTP ${response.status} — ${JSON.stringify(body, null, 2)}`,
      );
    } catch (err) {
      setTestAnnotationResult(
        `❌ Erreur réseau : ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6 bg-[#04040A] text-white min-h-screen">
      <header className="rounded-lg border border-red-400 bg-red-950 p-4 text-red-100">
        <h1 className="text-xl font-bold">
          ⚠️ PAGE DE TEST DEV — sous-domaine prof
        </h1>
        <p className="text-sm mt-1">
          Accessible uniquement en NODE_ENV=development ou VERCEL_ENV=preview.
          404 sur prof.muscu-eps.fr (prod).
        </p>
      </header>

      <section className="rounded-lg border border-gray-600 p-4 space-y-2">
        <h2 className="font-semibold">État user (TeacherAuthContext)</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400">Chargement de la session…</p>
        ) : (
          <pre className="text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(
              {
                user: user
                  ? {
                      id: user.id,
                      email: user.email ?? null,
                      is_anonymous: user.is_anonymous ?? false,
                    }
                  : null,
                isTeacher,
              },
              null,
              2,
            )}
          </pre>
        )}
      </section>

      <section className="rounded-lg border border-gray-600 p-4 space-y-3">
        <h2 className="font-semibold">Connexion prof (magic link)</h2>
        {isTeacher ? (
          <div className="space-y-2">
            <p className="text-sm">
              Déjà connecté en tant que prof :{" "}
              <span className="font-mono">{user?.email}</span>
            </p>
            <button
              type="button"
              onClick={signOut}
              className="rounded bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-2">
            <label className="block text-sm">
              Email académique (ex: prof.demo@ac-bordeaux.fr)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-500 bg-gray-900 px-3 py-2 text-sm text-white"
              placeholder="prof.demo@ac-bordeaux.fr"
            />
            <button
              type="submit"
              className="rounded bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Recevoir mon lien
            </button>
            {signinFeedback && (
              <p className="text-sm text-gray-200 whitespace-pre-wrap">
                {signinFeedback}
              </p>
            )}
          </form>
        )}
      </section>

      <section className="rounded-lg border border-gray-600 p-4 space-y-3">
        <h2 className="font-semibold">Test API annotations</h2>
        <p className="text-xs text-gray-300">
          POST une annotation test sur l&apos;organisation seed E.2.1
          (Tazieff). Si pas de membership actif → RLS renvoie 403.
        </p>
        <button
          type="button"
          onClick={handleTestAnnotation}
          disabled={!user}
          className="rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          POST /api/teacher/annotations (test)
        </button>
        {testAnnotationResult && (
          <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto whitespace-pre-wrap">
            {testAnnotationResult}
          </pre>
        )}
      </section>

      <section className="rounded-lg border border-gray-600 p-4">
        <h2 className="font-semibold mb-2">Mes memberships / classes</h2>
        <p className="text-sm text-gray-400">
          À implémenter en E.2.3 (routes <code>/api/teacher/me/*</code>).
        </p>
      </section>
    </main>
  );
}
