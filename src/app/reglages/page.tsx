"use client";

import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/I18nProvider";

const languageOptions = [
  { value: "fr", labelKey: "settings.language.fr" },
  { value: "en", labelKey: "settings.language.en" },
] as const;

const themeOptions = [
  { value: "system", labelKey: "settings.theme.system" },
  { value: "light", labelKey: "settings.theme.light" },
  { value: "dark", labelKey: "settings.theme.dark" },
] as const;

export default function ReglagesPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const currentTheme = theme ?? "system";

  return (
    <section className="page settings-page">
      <header className="page-header">
        <p className="eyebrow">{t("pages.settings.eyebrow")}</p>
        <h1>{t("pages.settings.title")}</h1>
        <p className="lede">{t("pages.settings.lede")}</p>
      </header>
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
                {t(option.labelKey)}
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
      </div>
    </section>
  );
}
