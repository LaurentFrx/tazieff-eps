"use client";

// Phase E.2.2 — Banc d'essai dev pour valider le flow magic link prof
// + API annotations bout-en-bout. Pas de design : c'est jetable.

import { useState } from "react";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";

export default function TeacherLoginDevClient() {
  const { user, isTeacher, isLoading, signInWithEmail, signOut } =
    useTeacherAuth();

  const [email, setEmail] = useState("");
  const [signinFeedback, setSigninFeedback] = useState<string | null>(null);
  const [testAnnotationResult, setTestAnnotationResult] = useState<string | null>(
    null,
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninFeedback("Envoi en cours…");
    const result = await signInWithEmail(email);
    if (result.ok) {
      setSigninFeedback(
        "✅ Lien envoyé, vérifiez votre boîte mail. Cliquez sur le lien pour revenir connecté.",
      );
    } else {
      setSigninFeedback(`❌ ${result.error ?? "Erreur inconnue"}`);
    }
  };

  const handleTestAnnotation = async () => {
    setTestAnnotationResult("Création en cours…");
    try {
      // Test naïf : on essaie de POSTer une annotation minimaliste. La route
      // rejettera en 403 RLS si le user n'a pas de membership valide — c'est
      // exactement ce qu'on veut valider.
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
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header className="rounded-lg border border-red-400 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
        <h1 className="text-xl font-bold">
          ⚠️ PAGE DE TEST DEV — À SUPPRIMER EN PROD
        </h1>
        <p className="text-sm mt-1">
          Accessible uniquement en NODE_ENV=development ou VERCEL_ENV=preview.
          Ne doit pas exister sur muscu-eps.fr.
        </p>
      </header>

      <section className="rounded-lg border border-gray-300 p-4 space-y-2">
        <h2 className="font-semibold">État user</h2>
        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement de la session…</p>
        ) : (
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
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

      <section className="rounded-lg border border-gray-300 p-4 space-y-3">
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
              Email académique (ex: prof.demo@ac-test.local)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-400 px-3 py-2 text-sm"
              placeholder="prof.demo@ac-bordeaux.fr"
            />
            <button
              type="submit"
              className="rounded bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Recevoir mon lien
            </button>
            {signinFeedback && (
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {signinFeedback}
              </p>
            )}
          </form>
        )}
      </section>

      <section className="rounded-lg border border-gray-300 p-4 space-y-3">
        <h2 className="font-semibold">Test API annotations</h2>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Cliquer sur le bouton ci-dessous POST une annotation test sur
          l&apos;organisation seed E.2.1 (Tazieff). Si le user n&apos;est pas
          membership actif de cette org, RLS renverra 403 — c&apos;est le
          comportement attendu tant que le seed utilisateurs n&apos;a pas été
          rattaché au flow magic link.
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
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto whitespace-pre-wrap">
            {testAnnotationResult}
          </pre>
        )}
      </section>

      <section className="rounded-lg border border-gray-300 p-4">
        <h2 className="font-semibold mb-2">Mes memberships / classes</h2>
        <p className="text-sm text-gray-500">
          À implémenter en E.2.3 (routes <code>/api/teacher/me/*</code>).
        </p>
      </section>
    </main>
  );
}
