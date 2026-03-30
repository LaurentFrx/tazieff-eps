"use client";

import { useMemo, useState } from "react";

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
        setError("Certaines fiches n'ont pas pu être téléchargées.");
      } else {
        setStatus("done");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Téléchargement interrompu.");
    }
  };

  const label = (() => {
    if (total === 0) {
      return "Aucune fiche à télécharger";
    }
    if (status === "loading") {
      return `Téléchargement ${completed}/${total}`;
    }
    if (status === "done") {
      return "Séance téléchargée";
    }
    return "Télécharger pour la séance";
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
          Les fiches sont prêtes en mode hors ligne.
        </p>
      ) : null}
    </div>
  );
}
