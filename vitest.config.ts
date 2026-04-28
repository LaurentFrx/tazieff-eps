import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Sprint A4 — exclut le dossier e2e/ (tests Playwright, pattern *.spec.ts).
    // Vitest ne sait pas exécuter les tests Playwright et tente d'importer
    // @playwright/test qui throw au runtime jsdom.
    exclude: [
      '**/node_modules/**',
      '**/.claude/**',
      '**/.next/**',
      '**/dist/**',
      '**/e2e/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Le marker Next.js "server-only" n'est pas un vrai module npm,
      // il est résolu par le bundler Next. En test, on pointe vers un stub.
      'server-only': path.resolve(__dirname, './src/tests/__mocks__/server-only.ts'),
    },
  },
});
