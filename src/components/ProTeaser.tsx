"use client";

import Link from "next/link";

export function ProTeaser({ feature }: { feature?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-violet-500/5 to-pink-500/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-violet-500"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[color:var(--ink)] mb-1">
        Fonctionnalité Pro
      </h3>
      {feature && (
        <p className="text-sm text-[color:var(--muted)] mb-2">{feature}</p>
      )}
      <p className="text-sm text-[color:var(--muted)] mb-4">
        Demande à ton professeur le code de ton établissement pour débloquer
        cette fonctionnalité.
      </p>
      <Link
        href="/reglages"
        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
      >
        Entrer un code
      </Link>
    </div>
  );
}
