"use client";

import { buildInfo } from "@/lib/buildInfo";

function formatBuildTimeLocal(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  try {
    const dtf = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(
      dtf.formatToParts(date).map((part) => [part.type, part.value]),
    ) as Record<string, string>;
    const buildTimeLocal = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;

    if (buildTimeLocal.includes(":") && parts.minute) {
      return buildTimeLocal;
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
  const fullLine = `${buildInfo.envLabel} · v${buildInfo.appVersion} · ${buildInfo.gitShaShort} · ${buildTimeLocal}`;

  if (process.env.NODE_ENV !== "production") {
    console.log("[buildstamp]", fullLine);
  }

  return {
    envLabel: buildInfo.envLabel,
    appVersion: buildInfo.appVersion,
    gitShaShort: buildInfo.gitShaShort,
    buildTimeIso: buildInfo.buildTimeIso,
    buildTimeLocal,
    fullLine,
    label: fullLine,
  };
}

export function BuildStamp() {
  const { fullLine } = useBuildInfo();

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums tracking-[0.2em] text-[color:var(--muted)] opacity-60"
      style={{ bottom: "calc(var(--tabbar-offset) + var(--tabbar-height) + 8px)" }}
      aria-hidden="true"
      title={fullLine}
    >
      {fullLine}
    </div>
  );
}
