"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type RestTimerProps = {
  durationSec?: number;
};

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RestTimer({ durationSec = 0 }: RestTimerProps) {
  const { t } = useI18n();
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [running]);

  const label = formatSeconds(remaining);

  if (!durationSec) {
    return (
      <div className="rest-timer">
        <span className="rest-label">{t("restTimer.label")}</span>
        <span className="rest-value">{t("restTimer.noRest")}</span>
      </div>
    );
  }

  return (
    <div className="rest-timer">
      <span className="rest-label">{t("restTimer.label")}</span>
      <span className="rest-value">{label}</span>
      <div className="rest-actions">
        <button
          type="button"
          className="chip"
          onClick={() => setRunning((prev) => !prev)}
        >
          {running ? t("restTimer.pause") : t("restTimer.start")}
        </button>
        <button
          type="button"
          className="chip chip-clear"
          onClick={() => {
            setRunning(false);
            setRemaining(durationSec);
          }}
        >
          {t("restTimer.reset")}
        </button>
      </div>
    </div>
  );
}
