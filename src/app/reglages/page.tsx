"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useBuildInfo } from "@/components/BuildStamp";
import { getTheme, onThemeChange, setTheme as setFieldTheme, type ThemePreference } from "@/lib/storage";

const languageOptions = [
  { value: "fr", labelKey: "settings.language.fr" },
  { value: "en", labelKey: "settings.language.en" },
] as const;

type LanguageValue = (typeof languageOptions)[number]["value"];

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

const fieldThemeOptions = [
  { value: 1, labelKey: "settings.fieldTheme.one" },
  { value: 2, labelKey: "settings.fieldTheme.two" },
  { value: 3, labelKey: "settings.fieldTheme.three" },
] as const;

export default function ReglagesPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const currentTheme = theme ?? "system";
  const buildInfo = useBuildInfo();
  const [fieldTheme, setLocalFieldTheme] = useState<ThemePreference>(getTheme());

  useEffect(() => onThemeChange(setLocalFieldTheme), []);

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
          <div className="segmented two-columns">
            {languageOptions.map((option) => (
              <label
                key={option.value}
                className={`segment-button${
                  lang === option.value ? " is-active" : ""
                }`}
              >
                <input
                  className="segment-input"
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={lang === option.value}
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
                  currentTheme === option.value ? " is-active" : ""
                }`}
              >
                <input
                  className="segment-input"
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={currentTheme === option.value}
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
                  fieldTheme === option.value ? " is-active" : ""
                }`}
              >
                <input
                  className="segment-input"
                  type="radio"
                  name="field-theme"
                  value={option.value}
                  checked={fieldTheme === option.value}
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
    </section>
  );
}
