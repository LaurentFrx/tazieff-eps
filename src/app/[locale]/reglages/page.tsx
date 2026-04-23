"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useBuildInfo } from "@/components/BuildStamp";
import { getTheme, onThemeChange, setTheme as setFieldTheme, type ThemePreference, getAnatomyAnim, setAnatomyAnim, onAnatomyAnimChange } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { isAcademicEmail } from "@/lib/auth/academic-domains";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LocaleLink } from "@/components/LocaleLink";

// Phase E.2.3.2 — l'espace enseignant a déménagé sur le sous-domaine prof.
// Depuis cette page, on affiche seulement un lien pour rediriger les profs
// vers le bon espace. L'auth magic-link inline a été retirée.
function getTeacherLoginUrl(): string {
  if (typeof window === "undefined") return "https://prof.muscu-eps.fr/connexion";
  const host = window.location.host;
  if (host === "design.muscu-eps.fr") return "https://design-prof.muscu-eps.fr/connexion";
  return "https://prof.muscu-eps.fr/connexion";
}


/* ── Types & constants ─────────────────────────────────────────────── */

type TeacherModeSnapshot = { unlocked: boolean; pin: string };

declare global {
  interface Window {
    __teacherMode?: TeacherModeSnapshot;
  }
}

const LANG_OPTIONS = [
  { value: "fr" as const, flag: "\u{1F1EB}\u{1F1F7}", short: "FR" },
  { value: "en" as const, flag: "\u{1F1EC}\u{1F1E7}", short: "EN" },
  { value: "es" as const, flag: "\u{1F1EA}\u{1F1F8}", short: "ES" },
];

const THEME_OPTIONS = [
  { value: "system" as const, key: "settings.theme.system" as const },
  { value: "light" as const, key: "settings.theme.light" as const },
  { value: "dark" as const, key: "settings.theme.dark" as const },
];

const FIELD_THEME_OPTIONS = [
  { value: 1 as const, key: "methodes.objectifs.endurance" as const, color: "#34d399" },
  { value: 2 as const, key: "methodes.objectifs.volume" as const, color: "#60a5fa" },
  { value: 3 as const, key: "methodes.objectifs.puissance" as const, color: "#fb923c" },
];

const DEFAULT_TEACHER_MODE: TeacherModeSnapshot = { unlocked: false, pin: "" };

const ORG_CODE_KEY = "tazieff-org-code";
const PLAN_CACHE_KEY = "tazieff-plan-cache";

function getTeacherModeSnapshot(): TeacherModeSnapshot {
  if (typeof window === "undefined") return { ...DEFAULT_TEACHER_MODE };
  const s = window.__teacherMode;
  return s ? { unlocked: Boolean(s.unlocked), pin: s.pin ?? "" } : { ...DEFAULT_TEACHER_MODE };
}

function setTeacherModeSnapshot(next: TeacherModeSnapshot) {
  if (typeof window !== "undefined") window.__teacherMode = next;
}

/* ── Segment control ───────────────────────────────────────────────── */

function Seg<O extends { value: string | number }>({
  options,
  value,
  onChange,
  render,
}: {
  options: readonly O[];
  value: O["value"];
  onChange: (v: O["value"]) => void;
  render: (opt: O, active: boolean) => React.ReactNode;
}) {
  return (
    <div className="flex rounded-lg bg-[color:var(--surface)] p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-out ${
              active
                ? "bg-[color:var(--border)] text-[color:var(--ink)] shadow-sm"
                : "text-[color:var(--muted)] hover:text-[color:var(--ink)]"
            }`}
            onClick={() => onChange(opt.value)}
          >
            {render(opt, active)}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function ReglagesPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const currentTheme = (theme ?? "system") as "system" | "light" | "dark";
  const buildInfo = useBuildInfo();
  const { user, isAnonymous } = useAuth();
  const { isPro } = usePlan();
  const router = useRouter();

  const [fieldTheme, setLocalFieldTheme] = useState<ThemePreference>(getTheme());
  const [anatomyAnim, setLocalAnatomyAnim] = useState(getAnatomyAnim());
  const [mounted, setMounted] = useState(false);


  // Teacher mode
  const [teacherMode, setTeacherMode] = useState<TeacherModeSnapshot>(getTeacherModeSnapshot);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState(teacherMode.pin);
  const [pinError, setPinError] = useState<string | null>(null);

  // Org code (inline)
  const [orgCode, setOrgCode] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem(ORG_CODE_KEY) : null) ?? "",
  );
  const [orgStatus, setOrgStatus] = useState<"idle" | "checking" | "success" | "error">(
    () => (typeof window !== "undefined" && localStorage.getItem(ORG_CODE_KEY) ? "success" : "idle"),
  );
  const [orgError, setOrgError] = useState("");

  useEffect(() => onThemeChange(setLocalFieldTheme), []);
  useEffect(() => onAnatomyAnimChange(setLocalAnatomyAnim), []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const stableLang = mounted ? lang : lang;
  const stableTheme = mounted ? currentTheme : ("system" as const);
  const stableFieldTheme = mounted ? fieldTheme : (1 as ThemePreference);

  const hasAcademicEmail = !!(user?.email && isAcademicEmail(user.email));

  /* ── Handlers ────────────────────────────────────────────────────── */

  const openPinModal = () => {
    setPinError(null);
    setPinValue(teacherMode.pin);
    setPinModalOpen(true);
  };

  const handleUnlock = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!pinValue.trim()) { setPinError(t("teacherMode.pinRequired")); return; }
    const next = { unlocked: true, pin: pinValue.trim() };
    setTeacherModeSnapshot(next);
    setTeacherMode(next);
    setPinError(null);
    setPinModalOpen(false);
  };

  const handleDisable = () => {
    const next = { unlocked: false, pin: "" };
    setTeacherModeSnapshot(next);
    setTeacherMode(next);
    setPinValue("");
    setPinError(null);
  };

  const handleResetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem("eps_onboarding_done");
      localStorage.removeItem("eps_onboarding_dismissed");
      localStorage.removeItem("eps_onboarding_level");
      localStorage.removeItem("eps_onboarding_goal");
    } catch { /* ignore */ }
    router.push("/onboarding");
  }, [router]);

  const handleCopy = async () => {
    try { await navigator?.clipboard?.writeText(buildInfo.label); } catch { /* ignore */ }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orgCode.trim().toUpperCase();
    if (!trimmed) return;
    setOrgStatus("checking");
    setOrgError("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setOrgStatus("error"); setOrgError(t("settings.account.connectionUnavailable")); return; }

    try {
      const { data } = await supabase
        .from("organizations")
        .select("id, is_pro, pro_expires_at")
        .eq("code", trimmed)
        .eq("is_pro", true)
        .maybeSingle();

      if (data && (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date())) {
        localStorage.setItem(ORG_CODE_KEY, trimmed);
        localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify({ plan: "pro", timestamp: Date.now() }));
        setOrgStatus("success");
      } else {
        setOrgStatus("error");
        setOrgError(t("settings.schoolCode.invalid"));
      }
    } catch {
      setOrgStatus("error");
      setOrgError(t("settings.account.networkError"));
    }
  };

  const handleOrgRemove = () => {
    localStorage.removeItem(ORG_CODE_KEY);
    localStorage.removeItem(PLAN_CACHE_KEY);
    setOrgCode("");
    setOrgStatus("idle");
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <section className="page pb-32">
      <div className="mx-auto max-w-lg space-y-4">
        <button
          onClick={() => router.back()}
          className="text-[13px] text-[color:var(--muted)] mb-2 cursor-pointer bg-transparent border-none"
        >
          ← {t("header.back")}
        </button>
        <h1 className="text-2xl font-bold text-[color:var(--ink)] mb-6">{t("settings.title")}</h1>

        {/* ── SECTION 1 : Préférences ─────────────────────────── */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 space-y-0">
          {/* Langue */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[color:var(--ink)]">{t("settings.language.label")}</span>
            <Seg
              options={LANG_OPTIONS}
              value={stableLang}
              onChange={(v) => setLang(v)}
              render={(opt) => (
                <span className="inline-flex items-center gap-1">
                  <span>{opt.flag}</span> {opt.short}
                </span>
              )}
            />
          </div>

          <div className="border-b border-[color:var(--border)] my-3" />

          {/* Thème */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[color:var(--ink)]">{t("settings.theme.label")}</span>
            <Seg
              options={THEME_OPTIONS}
              value={stableTheme}
              onChange={(v) => setTheme(v)}
              render={(opt) => t(opt.key)}
            />
          </div>

          <div className="border-b border-[color:var(--border)] my-3" />

          {/* Objectif par défaut */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[color:var(--ink)]">{t("settings.defaultObjective")}</span>
            <div className="flex gap-1">
              {FIELD_THEME_OPTIONS.map((opt) => {
                const active = stableFieldTheme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className="rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 ease-out"
                    style={
                      active
                        ? { background: opt.color, color: "#fff" }
                        : { border: "1px solid var(--border)", color: "var(--muted)" }
                    }
                    onClick={() => { setLocalFieldTheme(opt.value); setFieldTheme(opt.value); }}
                  >
                    {t(opt.key)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-[color:var(--border)] my-3" />

          {/* Animations anatomiques */}
          <button
            type="button"
            className="flex w-full items-center justify-between py-0.5"
            onClick={() => { const next = !anatomyAnim; setLocalAnatomyAnim(next); setAnatomyAnim(next); }}
          >
            <span className="text-sm font-medium text-[color:var(--ink)]">{t("settings.anatomyAnimations")}</span>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                anatomyAnim ? "bg-cyan-500" : "bg-[color:var(--border)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  anatomyAnim ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <div className="border-b border-[color:var(--border)] my-3" />

          {/* Relancer l'onboarding */}
          <button
            type="button"
            className="flex w-full items-center justify-between py-0.5"
            onClick={handleResetOnboarding}
          >
            <span className="text-sm font-medium text-[color:var(--ink)]">{t("onboarding.resetOnboarding")}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--muted)]">
              <path d="M3 12a9 9 0 1 1 9 9" /><polyline points="1 7 3 12 8 10" />
            </svg>
          </button>
        </div>

        {/* ── SECTION 2 : Compte & accès ──────────────────────── */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 space-y-0">
          {/* Statut du compte */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--ink)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[color:var(--muted)]">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t("settings.account.label")}
            </span>
            <div className="text-right">
              {hasAcademicEmail ? (
                <>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    {t("settings.account.teacher")}
                  </span>
                  <p className="text-[10px] text-[color:var(--muted)] mt-0.5">{user?.email}</p>
                </>
              ) : isPro && orgStatus === "success" ? (
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                  {t("settings.account.pro")}
                </span>
              ) : (
                <span className="rounded-full bg-[color:var(--border)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--muted)]">
                  {t("settings.account.anonymous")}
                </span>
              )}
            </div>
          </div>

          {/* Accès enseignant — déménagé sur le sous-domaine prof (E.2.3.2) */}
          {!hasAcademicEmail && (
            <>
              <div className="border-b border-[color:var(--border)] my-3" />
              <div>
                <p className="text-xs text-[color:var(--muted)] mb-2">
                  L&apos;espace enseignant a déménagé. Accédez-y depuis un
                  sous-domaine dédié, plus adapté à la tablette et au desktop.
                </p>
                <a
                  href={getTeacherLoginUrl()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
                  rel="noopener"
                >
                  Aller sur l&apos;espace enseignant
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <line x1="5" y1="10" x2="15" y2="10" />
                    <polyline points="11 5 16 10 11 15" />
                  </svg>
                </a>
              </div>
            </>
          )}

          {/* Déconnexion enseignant */}
          {hasAcademicEmail && (
            <>
              <div className="border-b border-[color:var(--border)] my-3" />
              <button
                type="button"
                className="text-xs text-red-400 underline"
                onClick={async () => {
                  const supabase = getSupabaseBrowserClient();
                  if (supabase) { await supabase.auth.signOut(); window.location.reload(); }
                }}
              >
                {t("settings.account.logout")}
              </button>
            </>
          )}

          {/* Code établissement */}
          {!isPro && (
            <>
              <div className="border-b border-[color:var(--border)] my-3" />
              <div>
                <p className="text-xs text-[color:var(--muted)] mb-2">{t("settings.schoolCode.label")}</p>
                {orgStatus === "success" ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {orgCode}
                    </span>
                    <button type="button" className="text-xs text-[color:var(--muted)] underline" onClick={handleOrgRemove}>
                      {t("settings.schoolCode.remove")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleOrgSubmit} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--muted)]"
                      placeholder={t("settings.schoolCode.placeholder")}
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      disabled={orgStatus === "checking"}
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      disabled={orgStatus === "checking" || !orgCode.trim()}
                    >
                      {orgStatus === "checking" ? "..." : t("settings.schoolCode.activate")}
                    </button>
                  </form>
                )}
                {orgStatus === "error" && <p className="mt-1 text-xs text-red-400">{orgError}</p>}
              </div>
            </>
          )}

          {/* Mode professeur */}
          <div className="border-b border-[color:var(--border)] my-3" />
          <button
            type="button"
            className="flex w-full items-center justify-between py-0.5"
            onClick={teacherMode.unlocked ? handleDisable : openPinModal}
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--ink)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[color:var(--muted)]">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              {t("settings.teacherModeLabel")}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                teacherMode.unlocked
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-[color:var(--border)] text-[color:var(--muted)]"
              }`}
            >
              {teacherMode.unlocked ? t("settings.active") : t("teacherMode.locked")}
            </span>
          </button>
        </div>

        {/* ── SECTION 3 : À propos ────────────────────────────── */}
        <div className="pt-2 text-center">
          <p className="text-xs text-[color:var(--muted)]">
            Tazieff EPS
            <button type="button" className="ml-1.5 underline" onClick={handleCopy}>
              {buildInfo.label}
            </button>
          </p>
          <div className="mt-3 flex justify-center gap-4 text-[11px] text-[color:var(--muted)]">
            <LocaleLink href="/legal/mentions-legales" className="hover:text-[color:var(--ink)] transition-colors">
              {t("settings.legal.mentions")}
            </LocaleLink>
            <LocaleLink href="/legal/confidentialite" className="hover:text-[color:var(--ink)] transition-colors">
              {t("settings.legal.privacy")}
            </LocaleLink>
            <LocaleLink href="/legal/cgu" className="hover:text-[color:var(--ink)] transition-colors">
              {t("settings.legal.cgu")}
            </LocaleLink>
          </div>
        </div>
      </div>

      {/* ── PIN Modal ─────────────────────────────────────────── */}
      {pinModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{t("teacherMode.pinHeading")}</h2>
            <form className="stack-md" onSubmit={handleUnlock}>
              <input
                className="field-input"
                type="password"
                value={pinValue}
                onChange={(event) => setPinValue(event.target.value)}
                placeholder={t("teacherMode.pinRequired")}
              />
              {pinError && <p className="text-xs text-[color:var(--muted)]">{pinError}</p>}
              <div className="modal-actions">
                <button type="submit" className="primary-button primary-button--wide">
                  {t("teacherMode.unlock")}
                </button>
                <button type="button" className="chip" onClick={() => setPinModalOpen(false)}>
                  {t("teacherMode.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
