"use client";

import { appVersion, buildTimeIso, envLabel, gitShaShort } from "@/lib/buildInfo";

function formatBuildTimeLocal(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    ) as Record<string, string>;

    if (
      values.year &&
      values.month &&
      values.day &&
      values.hour &&
      values.minute
    ) {
      return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
    }
  } catch {
    // Fall back to ISO when Intl or timeZone is unavailable.
  }

  return iso;
}

export function useBuildInfo() {
  const buildTimeLocal = formatBuildTimeLocal(buildTimeIso);
  const label = `${envLabel} · v${appVersion} · ${gitShaShort} · ${buildTimeLocal}`;

  return {
    envLabel,
    appVersion,
    gitShaShort,
    buildTimeIso,
    buildTimeLocal,
    label,
  };
}

export function BuildStamp() {
  const { label } = useBuildInfo();

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-10 -translate-x-1/2 text-[10px] tracking-[0.2em] text-[color:var(--muted)] opacity-60"
      style={{ bottom: "calc(var(--tabbar-offset) + var(--tabbar-height) + 8px)" }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
