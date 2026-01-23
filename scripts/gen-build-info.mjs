import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = join(process.cwd(), "public");
const outputPath = join(outputDir, "build-info.json");

const fallback = {
  ref: "local",
  sha: "unknown",
  builtAt: new Date().toISOString(),
};

function runGit(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

function getBuildInfo() {
  try {
    const ref = runGit("git rev-parse --abbrev-ref HEAD") || fallback.ref;
    const sha = runGit("git rev-parse --short HEAD") || fallback.sha;

    return {
      ref,
      sha,
      builtAt: fallback.builtAt,
    };
  } catch {
    return fallback;
  }
}

const buildInfo = getBuildInfo();

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");
