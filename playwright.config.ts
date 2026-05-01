// Sprint A4 — Configuration Playwright pour les tests e2e des chaînes critiques.
//
// 3 projets, un par sous-domaine, pour couvrir l'isolation cookies host-only :
//   - student : élève (muscu-eps.fr / design.muscu-eps.fr / localhost:3000)
//   - teacher : prof (prof.muscu-eps.fr / design-prof.* / prof.localhost:3000)
//   - admin   : admin (admin.muscu-eps.fr / design-admin.* / admin.localhost:3000)
//
// En CI Vercel preview : le webServer n'est pas démarré (les tests tournent
// directement contre le preview deploy). En local, on peut soit démarrer
// l'app séparément, soit laisser Playwright lancer `npm run dev` via la
// directive webServer (commentée par défaut pour ne pas interférer avec le
// dev workflow normal).

import { defineConfig, devices } from "@playwright/test";

const isCi = !!process.env.CI;

const STUDENT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL_STUDENT ?? "http://localhost:3000";
const TEACHER_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL_TEACHER ?? "http://prof.localhost:3000";
const ADMIN_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL_ADMIN ?? "http://admin.localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  /* Echec rapide en CI, retries en local pour absorber le flake réseau. */
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : "list",
  /* Timeout global par test (les tests d'auth peuvent être lents). */
  timeout: 60_000,
  expect: { timeout: 10_000 },

  /* Hooks globaux + capture sur échec. */
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    /* Header partagé pour autoriser /api/test/establish-session. */
    extraHTTPHeaders: {
      "X-Playwright-Test": process.env.PLAYWRIGHT_TEST_SECRET ?? "dev-secret",
    },
  },

  projects: [
    {
      name: "student",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: STUDENT_BASE_URL,
      },
      testMatch:
        /(student-.*|locale-preservation|cross-host-isolation|cross-domain-sso)\.spec\.ts/,
    },
    {
      name: "teacher",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: TEACHER_BASE_URL,
      },
      testMatch: /teacher-.*\.spec\.ts/,
    },
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ADMIN_BASE_URL,
      },
      testMatch: /admin-.*\.spec\.ts/,
    },
  ],

  /* Décommenter pour démarrer automatiquement le serveur dev en local.
     En CI on suppose que l'app est déjà déployée (preview Vercel).
  webServer: isCi
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  */
});
