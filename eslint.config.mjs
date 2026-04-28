import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/sw.js.map",
  ]),

  // Sprint A2 — Garde-fous contre la régression PS2.
  //
  // Règle 1 : interdire l'import direct de `Link` depuis `next/link` dans
  //           les routes localisées. Utiliser `LocaleLink` (qui préfixe la
  //           locale courante).
  // Règle 2 : interdire l'import nommé `redirect` depuis `next/navigation`
  //           dans les routes localisées. Utiliser `localizedRedirect()`
  //           depuis `@/lib/navigation`.
  //
  // Exceptions (overrides plus bas) : src/app/admin/**, src/app/prof/**,
  // src/app/legal/**, src/app/not-found.tsx, /auth/**, /callback/**,
  // src/components/LocaleLink.tsx (le wrapper a besoin de Link),
  // src/lib/navigation.ts (le helper a besoin de redirect).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message:
                "Utilise LocaleLink depuis '@/components/LocaleLink' dans les routes localisées (préfixe automatique de la locale). Exception : src/app/admin, src/app/prof, src/app/legal, src/app/not-found.tsx, src/components/LocaleLink.tsx.",
            },
            {
              name: "next/navigation",
              importNames: ["redirect"],
              message:
                "Utilise localizedRedirect depuis '@/lib/navigation' dans les routes localisées (préserve la locale courante). Exception : src/app/admin, src/app/prof, src/app/legal, src/lib/navigation.ts.",
            },
          ],
        },
      ],
    },
  },

  // Exceptions : routes non-localisées et helpers internes.
  {
    files: [
      "src/app/admin/**",
      "src/app/prof/**",
      "src/app/legal/**",
      "src/app/not-found.tsx",
      "src/app/auth/**",
      "src/app/callback/**",
      "src/components/LocaleLink.tsx",
      "src/components/teacher/**",
      "src/lib/navigation.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  // Exception : tests Vitest peuvent importer librement.
  {
    files: ["src/tests/**", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
