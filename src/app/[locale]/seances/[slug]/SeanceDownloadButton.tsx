"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type SeanceDownloadButtonProps = {
  exerciseSlugs: string[];
};

type DownloadState = "idle" | "loading" | "done" | "error";

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SeanceDownloadButton({ exerciseSlugs }: SeanceDownloadButtonProps) {
  const { t } = useI18n();
  const uniqueSlugs = useMemo(
    () => Array.from(new Set(exerciseSlugs.filter(Boolean))),
    [exerciseSlugs],
  );
  const total = uniqueSlugs.length;
  const [status, setStatus] = useState<DownloadState>("idle");
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (status === "loading" || total === 0) {
      return;
    }

    setStatus("loading");
    setCompleted(0);
    setError(null);
    let failures = 0;

    try {
      for (let i = 0; i < uniqueSlugs.length; i += BATCH_SIZE) {
        const batch = uniqueSlugs.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((slug) =>
            fetch(`/exercices/${slug}`, {
              cache: "reload",
              credentials: "same-origin",
              headers: {
                Accept: "text/html",
              },
            }),
          ),
        );
        const successes = results.filter((result) => result.status === "fulfilled")
          .length;
        failures += results.length - successes;
        setCompleted((prev) => prev + successes);
        await sleep(BATCH_DELAY_MS);
      }

      if (failures > 0) {
        setStatus("error");
        setError(t("seanceDetail.download.partialError"));
      } else {
        setStatus("done");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t("seanceDetail.download.interrupted"));
    }
  };

  const label = (() => {
    if (total === 0) {
      return t("seanceDetail.download.empty");
    }
    if (status === "loading") {
      return `${t("seanceDetail.download.progress")} ${completed}/${total}`;
    }
    if (status === "done") {
      return t("seanceDetail.download.done");
    }
    return t("seanceDetail.download.button");
  })();

  return (
    <div className="stack-md">
      <button
        type="button"
        className="primary-button primary-button--wide"
        onClick={handleDownload}
        disabled={status === "loading" || total === 0}
      >
        {label}
      </button>
      {status === "error" && error ? (
        <p className="text-xs text-[color:var(--muted)]">{error}</p>
      ) : null}
      {status === "done" ? (
        <p className="text-xs text-[color:var(--muted)]">
          {t("seanceDetail.download.offlineReady")}
        </p>
      ) : null}
    </div>
  );
}
