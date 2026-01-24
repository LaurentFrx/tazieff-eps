"use client";

import { useEffect, useMemo, useState } from "react";

type RestTimerProps = {
  durationSec?: number;
};

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RestTimer({ durationSec = 0 }: RestTimerProps) {
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

  const label = useMemo(() => formatSeconds(remaining), [remaining]);

  if (!durationSec) {
    return (
      <div className="rest-timer">
        <span className="rest-label">Repos</span>
        <span className="rest-value">Pas de repos programmé</span>
      </div>
    );
  }

  return (
    <div className="rest-timer">
      <span className="rest-label">Repos</span>
      <span className="rest-value">{label}</span>
      <div className="rest-actions">
        <button
          type="button"
          className="chip"
          onClick={() => setRunning((prev) => !prev)}
        >
          {running ? "Pause" : "Démarrer"}
        </button>
        <button
          type="button"
          className="chip chip-clear"
          onClick={() => {
            setRunning(false);
            setRemaining(durationSec);
          }}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
