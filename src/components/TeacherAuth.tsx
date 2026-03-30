"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isAcademicEmail, ACADEMIC_EMAIL_PATTERN } from "@/lib/auth/academic-domains";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "input" | "sending" | "confirmation";

export function TeacherAuth() {
  const { t } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [errorMsg, setErrorMsg] = useState("");

  const trimmed = email.trim();
  const isValid = isAcademicEmail(trimmed);
  const showError = trimmed.length > 0 && trimmed.includes("@") && !isValid;

  // Already connected with academic email
  if (user?.email && isAcademicEmail(user.email)) {
    return (
      <div className="mx-auto max-w-[480px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-emerald-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-emerald-500 mb-1">
            {t("settings.account.activeTitle")}
          </h3>
          <p className="text-sm text-[color:var(--muted)] mb-4">
            {t("settings.account.connectedWith")}{" "}
            <strong className="text-[color:var(--ink)]">{user.email}</strong>.{" "}
            {t("settings.account.allUnlocked")}
          </p>
          <button
            type="button"
            className="text-sm text-red-400 underline"
            onClick={async () => {
              const supabase = getSupabaseBrowserClient();
              if (supabase) {
                await supabase.auth.signOut();
                window.location.reload();
              }
            }}
          >
            {t("settings.account.logout")}
          </button>
        </div>
      </div>
    );
  }

  // Confirmation state
  if (step === "confirmation") {
    return (
      <div className="mx-auto max-w-[480px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-emerald-500">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <polyline points="17 13 20 16 17 19" className="animate-pulse" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-emerald-500 mb-1">
            {t("settings.account.linkSentTitle")}
          </h3>
          <p className="text-sm text-[color:var(--muted)] mb-4">
            {t("settings.account.checkInbox")}
          </p>
          <button
            type="button"
            className="text-sm text-[color:var(--muted)] underline"
            onClick={() => {
              setStep("input");
              setErrorMsg("");
            }}
          >
            {t("settings.account.resendLink")}
          </button>
        </div>
      </div>
    );
  }

  // Input / sending state
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setStep("sending");
    setErrorMsg("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setErrorMsg(t("settings.account.connectionUnavailable"));
      setStep("input");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser(
        { email: trimmed },
        { emailRedirectTo: `${window.location.origin}/reglages` },
      );

      if (error) {
        if (error.message?.includes("rate") || error.status === 429) {
          setErrorMsg(t("settings.account.tooManyAttempts"));
        } else if (error.message?.includes("already")) {
          setErrorMsg(t("settings.account.alreadyLinked"));
        } else {
          setErrorMsg(error.message || t("settings.account.genericError"));
        }
        setStep("input");
        return;
      }

      setStep("confirmation");
    } catch {
      setErrorMsg(t("settings.account.networkError"));
      setStep("input");
    }
  }

  return (
    <div className="mx-auto max-w-[480px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
      <h3 className="text-xl font-bold text-[color:var(--ink)] mb-1">
        {t("settings.account.teacherAccess")}
      </h3>
      <p className="text-sm text-[color:var(--muted)] mb-4">
        {t("settings.account.teacherAccessHelp")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          {/* Envelope icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>

          <input
            type="email"
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] py-3 pl-10 pr-10 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--muted)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={ACADEMIC_EMAIL_PATTERN}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step === "sending" || authLoading}
            autoComplete="email"
          />

          {/* Check icon when valid */}
          {isValid && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        {showError && (
          <p className="text-xs text-red-400">
            {t("settings.account.academicOnly")}
          </p>
        )}

        {errorMsg && (
          <p className="text-xs text-red-400">{errorMsg}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-sm font-bold text-white disabled:opacity-50"
          disabled={!isValid || step === "sending" || authLoading}
        >
          {step === "sending" ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("settings.account.sending")}
            </span>
          ) : (
            t("settings.account.receiveLink")
          )}
        </button>
      </form>
    </div>
  );
}
