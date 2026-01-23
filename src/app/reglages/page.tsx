"use client";

import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useBuildInfo } from "@/components/BuildStamp";

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
  const buildInfo = useBuildInfo();

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
