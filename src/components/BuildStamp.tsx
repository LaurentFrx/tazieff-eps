"use client";

function getEnvValue(value?: string) {
  if (!value || value.trim().length === 0) {
    return "local";
  }

  return value;
}

export function BuildStamp() {
  const commitRaw = getEnvValue(process.env.NEXT_PUBLIC_COMMIT_SHA);
  const commit =
    commitRaw === "local" ? "local" : commitRaw.slice(0, 7) || "local";
  const branch = getEnvValue(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF);
  const envRaw = getEnvValue(process.env.NEXT_PUBLIC_VERCEL_ENV);
  const env = envRaw === "production" ? "prod" : envRaw;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)] opacity-60"
      style={{ bottom: "calc(var(--tabbar-offset) + var(--tabbar-height) + 8px)" }}
      aria-hidden="true"
    >
      {branch} · {commit} · {env}
    </div>
  );
}
