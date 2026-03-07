"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useBuildInfo } from "@/components/BuildStamp";
import { getTheme, onThemeChange, setTheme as setFieldTheme, type ThemePreference } from "@/lib/storage";

const languageOptions = [
  { value: "fr", labelKey: "settings.language.fr" },
  { value: "en", labelKey: "settings.language.en" },
  { value: "es", labelKey: "settings.language.es" },
] as const;

type LanguageValue = (typeof languageOptions)[number]["value"];

type TeacherModeSnapshot = {
  unlocked: boolean;
  pin: string;
};

declare global {
  interface Window {
    __teacherMode?: TeacherModeSnapshot;
  }
}

const FlagIcon = ({ locale }: { locale: LanguageValue }) => {
  if (locale === "fr") {
    return (
      <svg
        viewBox="0 0 30 20"
        className="h-4 w-6 rounded-sm ring-1 ring-black/10"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="10" height="20" fill="#0055A4" />
        <rect x="10" width="10" height="20" fill="#FFFFFF" />
        <rect x="20" width="10" height="20" fill="#EF4135" />
      </svg>
    );
  }

  if (locale === "es") {
    return (
      <svg
        viewBox="0 0 30 20"
        className="h-4 w-6 rounded-sm ring-1 ring-black/10"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="30" height="5" fill="#AA151B" />
        <rect y="5" width="30" height="10" fill="#F1BF00" />
        <rect y="15" width="30" height="5" fill="#AA151B" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 30 20"
      className="h-4 w-6 rounded-sm ring-1 ring-black/10"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="30" height="20" fill="#012169" />
      <path
        d="M0 0 L30 20 M30 0 L0 20"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="square"
      />
      <path
        d="M0 0 L30 20 M30 0 L0 20"
        stroke="#C8102E"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M0 10 H30 M15 0 V20"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="square"
      />
      <path
        d="M0 10 H30 M15 0 V20"
        stroke="#C8102E"
        strokeWidth="4"
        strokeLinecap="square"
      />
    </svg>
  );
};

const themeOptions = [
  { value: "system", labelKey: "settings.theme.system" },
  { value: "light", labelKey: "settings.theme.light" },
  { value: "dark", labelKey: "settings.theme.dark" },
] as const;

type UiThemePreference = (typeof themeOptions)[number]["value"];

const fieldThemeOptions = [
  { value: 1, labelKey: "settings.fieldTheme.one" },
  { value: 2, labelKey: "settings.fieldTheme.two" },
  { value: 3, labelKey: "settings.fieldTheme.three" },
] as const;

const DEFAULT_TEACHER_MODE: TeacherModeSnapshot = { unlocked: false, pin: "" };

function getTeacherModeSnapshot(): TeacherModeSnapshot {
  if (typeof window === "undefined") {
    return { ...DEFAULT_TEACHER_MODE };
  }
  const snapshot = window.__teacherMode;
  if (!snapshot) {
    return { ...DEFAULT_TEACHER_MODE };
  }
  return {
    unlocked: Boolean(snapshot.unlocked),
    pin: snapshot.pin ?? "",
  };
}

function setTeacherModeSnapshot(next: TeacherModeSnapshot) {
  if (typeof window === "undefined") {
    return;
  }
  window.__teacherMode = next;
}

export default function ReglagesPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const currentTheme = (theme ?? "system") as UiThemePreference;
  const buildInfo = useBuildInfo();
  const [fieldTheme, setLocalFieldTheme] = useState<ThemePreference>(getTheme());
  const [teacherMode, setTeacherMode] = useState<TeacherModeSnapshot>(
    () => getTeacherModeSnapshot(),
  );
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState(teacherMode.pin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => onThemeChange(setLocalFieldTheme), []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const stableLang = mounted ? lang : lang;
  const stableTheme = mounted ? currentTheme : "system";
  const stableFieldTheme = mounted ? fieldTheme : 1;

  const openPinModal = () => {
    setPinError(null);
    setPinValue(teacherMode.pin);
    setPinModalOpen(true);
  };

  const handleUnlock = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!pinValue.trim()) {
      setPinError(t("teacherMode.pinRequired"));
      return;
    }
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

  const handleCopy = async () => {
    if (!navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildInfo.label);
    } catch {
      // Ignore clipboard errors to keep the UI silent.
    }
  };

  return (
    <section className="page settings-page">
      <div className="settings-list">
        <div className="settings-card">
          <div>
            <h2 className="settings-heading">{t("settings.language.label")}</h2>
            <p className="settings-help">{t("pages.settings.languageHelp")}</p>
          </div>
          <div className="segmented">
            {languageOptions.map((option) => (
              <label
                key={option.value}
                className={`segment-button${
                  stableLang === option.value ? " is-active" : ""
                }`}
              >
                <input
                  className="segment-input"
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={stableLang === option.value}
                  onChange={() => setLang(option.value)}
                />
                <span className="inline-flex items-center gap-2">
                  <FlagIcon locale={option.value} />
                  {t(option.labelKey)}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="settings-card">
          <div>
            <h2 className="settings-heading">{t("settings.theme.label")}</h2>
            <p className="settings-help">{t("pages.settings.themeHelp")}</p>
          </div>
          <div className="segmented">
            {themeOptions.map((option) => (
              <label
                key={option.value}
                className={`segment-button${
                  stableTheme === option.value ? " is-active" : ""
                }`}
              >
                <input
                  className="segment-input"
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={stableTheme === option.value}
                  onChange={() => setTheme(option.value)}
                />
                {t(option.labelKey)}
              </label>
            ))}
          </div>
        </div>
        <div className="settings-card">
          <div>
            <h2 className="settings-heading">{t("settings.fieldTheme.label")}</h2>
            <p className="settings-help">{t("settings.fieldTheme.help")}</p>
          </div>
          <div className="segmented">
            {fieldThemeOptions.map((option) => (
              <label
                key={option.value}
                className={`segment-button${
                  stableFieldTheme === option.value ? " is-active" : ""
                }`}
              >
                <input
                  className="segment-input"
                  type="radio"
                  name="field-theme"
                  value={option.value}
                  checked={stableFieldTheme === option.value}
                  onChange={() => {
                    setLocalFieldTheme(option.value);
                    setFieldTheme(option.value);
                  }}
                />
                {t(option.labelKey)}
              </label>
            ))}
          </div>
        </div>
        <div className="settings-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="settings-heading">{t("teacherMode.heading")}</h2>
              <p className="settings-help">{t("teacherMode.help")}</p>
            </div>
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                teacherMode.unlocked
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                  : "border-white/10 bg-white/5 text-[color:var(--muted)]"
              }`}
            >
              {teacherMode.unlocked ? t("teacherMode.unlocked") : t("teacherMode.locked")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {teacherMode.unlocked ? (
              <button type="button" className="chip" onClick={handleDisable}>
                {t("teacherMode.deactivate")}
              </button>
            ) : (
              <button
                type="button"
                className="primary-button primary-button--wide"
                onClick={openPinModal}
              >
                {t("teacherMode.activate")}
              </button>
            )}
          </div>
        </div>
        <div className="settings-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="settings-heading">{t("settings.about")}</h2>
            </div>
            <button
              type="button"
              className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
              onClick={handleCopy}
            >
              {t("settings.copy")}
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs text-[color:var(--muted)]">
            <span>{t("settings.version")}</span>
            <span className="font-mono">{buildInfo.label}</span>
          </div>
        </div>
      </div>
      {pinModalOpen ? (
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
              {pinError ? (
                <p className="text-xs text-[color:var(--muted)]">{pinError}</p>
              ) : null}
              <div className="modal-actions">
                <button type="submit" className="primary-button primary-button--wide">
                  {t("teacherMode.unlock")}
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setPinModalOpen(false)}
                >
                  {t("teacherMode.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
