"use client";

type BuildInfo = {
  branch: string;
  sha7: string;
  env: string;
  label: string;
};

function getEnvValue(value: string | undefined, fallback: string) {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

export function getBuildInfo(): BuildInfo {
  const branch = getEnvValue(
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
    "main",
  );
  const commitRaw = getEnvValue(process.env.NEXT_PUBLIC_COMMIT_SHA, "local");
  const sha7 = commitRaw === "local" ? "local" : commitRaw.slice(0, 7);
  const envRaw = getEnvValue(process.env.NEXT_PUBLIC_VERCEL_ENV, "dev");
  const envValue = envRaw === "local" ? "dev" : envRaw;
  const env = envValue === "production" ? "prod" : envValue;
  const label = `${branch} · ${sha7 || "local"} · ${env}`;

  return {
    branch,
    sha7: sha7 || "local",
    env,
    label,
  };
}

export function BuildStamp() {
  const { label } = getBuildInfo();

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
