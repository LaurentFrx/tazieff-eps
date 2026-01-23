"use client";

import { useEffect, useState } from "react";

export type BuildInfo = {
  ref: string;
  sha: string;
  builtAt?: string;
};

type RuntimeInfo = {
  env: string;
  mode: string;
};

const FALLBACK_BUILD_INFO: BuildInfo = {
  ref: "local",
  sha: "unknown",
};

function normalizeValue(value: string | undefined, fallback: string) {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

function getRuntimeInfo(): RuntimeInfo {
  const envRaw = normalizeValue(process.env.NEXT_PUBLIC_VERCEL_ENV, "local");
  const env = envRaw === "production" ? "prod" : envRaw;
  const mode = process.env.NODE_ENV === "production" ? "prod" : "dev";

  return { env, mode };
}

function formatBuildLabel(info: BuildInfo, runtime: RuntimeInfo) {
  const ref = normalizeValue(info.ref, "local");
  const sha = normalizeValue(info.sha, "unknown");

  return `${ref} | ${sha} | ${runtime.env} | ${runtime.mode}`;
}

export function useBuildInfo() {
  const [info, setInfo] = useState<BuildInfo>(FALLBACK_BUILD_INFO);

  useEffect(() => {
    let active = true;

    const loadInfo = async () => {
      try {
        const response = await fetch("/build-info.json", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Partial<BuildInfo>;
        if (!active) {
          return;
        }

        setInfo({
          ref: normalizeValue(data.ref, FALLBACK_BUILD_INFO.ref),
          sha: normalizeValue(data.sha, FALLBACK_BUILD_INFO.sha),
          builtAt:
            typeof data.builtAt === "string" ? data.builtAt : undefined,
        });
      } catch {
        // Ignore fetch errors and keep the fallback info.
      }
    };

    void loadInfo();

    return () => {
      active = false;
    };
  }, []);

  const runtime = getRuntimeInfo();
  const label = formatBuildLabel(info, runtime);

  return { ...info, ...runtime, label };
}

export function BuildStamp() {
  const { label } = useBuildInfo();

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] opacity-60"
      style={{ bottom: "calc(var(--tabbar-offset) + var(--tabbar-height) + 8px)" }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
