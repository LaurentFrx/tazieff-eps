"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { clientLocalizedHref } from "@/lib/i18n/locale-path";
import type { Locale } from "@/lib/i18n/constants";

/* ── Types & constants ─────────────────────────────────────────────── */

type Level = "seconde" | "premiere" | "terminale";
type Objectif = "endurance" | "volume" | "puissance";
type Step = 1 | 2 | 3;

const LS_LEVEL = "eps_onboarding_level";
const LS_GOAL = "eps_onboarding_goal";
const LS_DONE = "eps_onboarding_done";

const LEVELS: { value: Level; labelKey: string; descKey: string; color: string }[] = [
  { value: "seconde", labelKey: "onboarding.levelSeconde", descKey: "onboarding.levelSecondeDesc", color: "#22c55e" },
  { value: "premiere", labelKey: "onboarding.levelPremiere", descKey: "onboarding.levelPremiereDesc", color: "#3b82f6" },
  { value: "terminale", labelKey: "onboarding.levelTerminale", descKey: "onboarding.levelTerminaleDesc", color: "#f97316" },
];

const GOALS: { value: Objectif; labelKey: string; descKey: string; gradient: string; icon: () => React.ReactNode }[] = [
  {
    value: "endurance", labelKey: "onboarding.objEndurance", descKey: "onboarding.objEnduranceDesc",
    gradient: "linear-gradient(135deg, #059669, #34d399)",
    icon: () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
  {
    value: "volume", labelKey: "onboarding.objVolume", descKey: "onboarding.objVolumeDesc",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    icon: () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5L17.5 17.5" /><path d="M3.5 10L10 3.5" /><path d="M14 20.5L20.5 14" /><path d="M2 11.5l1.5-1.5" /><path d="M20.5 13L22 11.5" />
      </svg>
    ),
  },
  {
    value: "puissance", labelKey: "onboarding.objPuissance", descKey: "onboarding.objPuissanceDesc",
    gradient: "linear-gradient(135deg, #f97316, #ef4444)",
    icon: () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

/* ── Component ─────────────────────────────────────────────────────── */

export function OnboardingWizard() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<Step>(1);
  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<Objectif | null>(null);

  const finish = useCallback(() => {
    try {
      if (level) localStorage.setItem(LS_LEVEL, level);
      if (goal) localStorage.setItem(LS_GOAL, goal);
      localStorage.setItem(LS_DONE, "true");
    } catch { /* ignore */ }
    // Sprint A2 — préfixe locale pour fonctionner sur miroir admin.
    router.push(clientLocalizedHref("/", lang as Locale, pathname));
  }, [level, goal, router, lang, pathname]);

  const levelLabel = level ? t(LEVELS.find((l) => l.value === level)!.labelKey) : "";
  const goalLabel = goal ? t(GOALS.find((g) => g.value === goal)!.labelKey) : "";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#04040A]">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-4" style={{ paddingTop: "calc(24px + env(safe-area-inset-top, 0px))" }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: s === step ? 32 : 8,
              background: s <= step ? "#00E5FF" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">

        {/* ── Écran 1 : Niveau ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fade-slide_0.4s_ease_both]">
            <h1 className="text-2xl font-bold text-white text-center">{t("onboarding.chooseLevel")}</h1>
            <div className="w-full flex flex-col gap-3">
              {LEVELS.map((l) => {
                const selected = level === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className="w-full rounded-2xl p-4 text-left transition-all duration-200 border-2 cursor-pointer"
                    style={{
                      background: selected ? `${l.color}15` : "rgba(255,255,255,0.04)",
                      borderColor: selected ? l.color : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="text-base font-bold text-white">{t(l.labelKey)}</span>
                    <span className="block text-xs mt-0.5" style={{ color: selected ? l.color : "rgba(255,255,255,0.5)" }}>
                      {t(l.descKey)}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!level}
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-xl border-none text-base font-bold cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "#00E5FF", color: "#04040A" }}
            >
              {t("onboarding.next")}
            </button>
          </div>
        )}

        {/* ── Écran 2 : Objectif ────────────────────────────────────── */}
        {step === 2 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fade-slide_0.4s_ease_both]">
            <h1 className="text-2xl font-bold text-white text-center">{t("onboarding.chooseObjectif")}</h1>
            <div className="w-full flex flex-col gap-3">
              {GOALS.map((g) => {
                const selected = goal === g.value;
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className="w-full rounded-2xl p-4 text-left transition-all duration-200 border-2 cursor-pointer flex items-center gap-4"
                    style={{
                      background: selected ? g.gradient : "rgba(255,255,255,0.04)",
                      borderColor: selected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="text-white/60 shrink-0"><Icon /></span>
                    <div>
                      <span className="text-base font-bold text-white">{t(g.labelKey)}</span>
                      <span className="block text-xs text-white/60 mt-0.5">{t(g.descKey)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="w-full flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-14 px-6 rounded-xl border border-white/15 bg-transparent text-white text-sm font-medium cursor-pointer"
              >
                {t("onboarding.back")}
              </button>
              <button
                type="button"
                disabled={!goal}
                onClick={() => setStep(3)}
                className="flex-1 h-14 rounded-xl border-none text-base font-bold cursor-pointer transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "#00E5FF", color: "#04040A" }}
              >
                {t("onboarding.next")}
              </button>
            </div>
          </div>
        )}

        {/* ── Écran 3 : Bienvenue + résumé ──────────────────────────── */}
        {step === 3 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fade-slide_0.4s_ease_both]">
            <div className="text-5xl">&#x1F3CB;&#xFE0F;</div>
            <h1 className="text-3xl font-bold text-white text-center">{t("onboarding.welcomeTitle")}</h1>
            <p className="text-sm text-white/50 text-center px-4">
              {t("onboarding.welcomeSummary").replace("{level}", levelLabel).replace("{goal}", goalLabel)}
            </p>
            <p className="text-sm text-white/70 text-center px-4">{t("onboarding.welcomeBody")}</p>
            <button
              type="button"
              onClick={finish}
              className="w-full h-14 rounded-xl border-none text-lg font-bold cursor-pointer transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #00E5FF, #7B2FFF)", color: "#fff" }}
            >
              {t("onboarding.letsGo")}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-white/40 bg-transparent border-none cursor-pointer"
            >
              ← {t("onboarding.back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
