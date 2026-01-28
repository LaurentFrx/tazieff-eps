"use client";

import { buildInfo } from "@/lib/buildInfo";

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

    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    }

    const year = values.year;
    const month = values.month;
    const day = values.day;
    const hour = values.hour;
    const minute = values.minute;

    if (year && month && day && hour && minute) {
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
  } catch {
    // Fall back to ISO when Intl or timeZone is unavailable.
  }

  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]} ${match[2]}:${match[3]}`;
  }

  return iso;
}

export function useBuildInfo() {
  const buildTimeLocal = formatBuildTimeLocal(buildInfo.buildTimeIso);
  const label = `${buildInfo.envLabel} · v${buildInfo.appVersion} · ${buildInfo.gitShaShort} · ${buildTimeLocal}`;

  return {
    envLabel: buildInfo.envLabel,
    appVersion: buildInfo.appVersion,
    gitShaShort: buildInfo.gitShaShort,
    buildTimeIso: buildInfo.buildTimeIso,
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
