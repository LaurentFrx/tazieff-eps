# Tests Tazieff EPS

Ce document décrit l'infrastructure de tests automatiques du projet, ajoutée
au sprint A4 (avril 2026) en réponse au pattern PS5 de l'audit-cc.

---

## Vue d'ensemble

| Type | Outil | Localisation | Cible |
|------|-------|--------------|-------|
| Unitaires + composants + intégration mockée | Vitest 4 + jsdom | `src/tests/**`, `src/**/*.test.ts` | 968 tests (post-A5.1) |
| End-to-end navigateur réel | Playwright 1.59 | `e2e/**` | 6 chaînes critiques |

---

## Tests unitaires (Vitest)

```bash
npm run test          # mode watch
npm run test:run      # mode CI (one-shot)
npm run test:ui       # mode interactif
```

Couvre 968 tests sur :

- helpers purs (filtres, RM, locale-path, validation, env)
- composants React isolés (LocaleLink, ProLoginForm, BackButton, SearchModal)
- API routes mockées (admin-magic-link, classes/join, exercise-override…)
- middleware (proxy host-based + i18n rewrite)
- IdentityContext (sprint A3 — provider unifié)

---

## Tests end-to-end (Playwright)

### Pourquoi e2e ?

L'audit-cc 2026-04-28 (pattern PS5) a montré que les 945 tests Vitest
masquent l'absence de tests qui valideraient les chaînes complètes :
saisie email → cookie posé → role détecté → UI affichée → action effectuée.
Chacun des 11 sprints correctifs P0.7 est passé en CI Vitest mais a cassé
la production preview, découvert par validation visuelle manuelle.

Les tests Playwright comblent ce trou en exécutant Chromium contre l'app
réelle (preview Vercel ou dev local) et en validant la chaîne complète.

### Lancer les tests

```bash
# Liste les tests sans les exécuter (debug du config)
npm run test:e2e:list

# Mode CI / one-shot
npm run test:e2e

# Mode interactif (browser visible, time-travel)
npm run test:e2e:ui

# Mode debug (pause sur chaque step)
npm run test:e2e:debug
```

### Pré-requis

1. **Browsers Playwright installés** :
   ```bash
   npx playwright install chromium
   ```

2. **App en cours d'exécution** sur les 3 sous-domaines :
   - `localhost:3000` (élève)
   - `prof.localhost:3000` (prof)
   - `admin.localhost:3000` (admin)

   Sur macOS/Linux, ces hosts sont résolus automatiquement vers 127.0.0.1
   pour tout `*.localhost`. Sur Windows, ajouter manuellement à `/etc/hosts`
   ou utiliser `npm run dev` (le proxy interne gère le rewrite).

3. **Variables d'environnement** (à mettre dans `.env.local` pour le dev) :
   ```bash
   # Secret partagé entre Playwright et /api/test/establish-session
   PLAYWRIGHT_TEST_SECRET=<random-secret-string>

   # Optionnel : override des baseURL si on tourne contre preview Vercel
   PLAYWRIGHT_BASE_URL_STUDENT=https://design.muscu-eps.fr
   PLAYWRIGHT_BASE_URL_TEACHER=https://design-prof.muscu-eps.fr
   PLAYWRIGHT_BASE_URL_ADMIN=https://design-admin.muscu-eps.fr

   # Emails de test (par défaut : laurent@feroux.fr admin / test@ac-bordeaux.fr prof)
   PLAYWRIGHT_ADMIN_EMAIL=laurent@feroux.fr
   PLAYWRIGHT_TEACHER_EMAIL=test@ac-bordeaux.fr

   # Skip de la sous-suite "édition réelle" (qui pollue exercise_overrides)
   PLAYWRIGHT_SKIP_EDIT=1
   ```

   Plus les variables Supabase déjà requises par l'app :
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (pour la route `/api/test/establish-session`).

4. **PLAYWRIGHT_TEST_SECRET défini en preview Vercel** : sinon la route
   `/api/test/establish-session` répondra 401 (garde de sécurité).

### Architecture des tests

3 projets dans `playwright.config.ts`, un par sous-domaine :

| Projet  | baseURL                           | testMatch                                      |
|---------|-----------------------------------|------------------------------------------------|
| student | `localhost:3000` / `design.*`     | `student-*.spec.ts`, `locale-*`, `cross-host-*` |
| teacher | `prof.localhost:3000` / `design-prof.*` | `teacher-*.spec.ts`                       |
| admin   | `admin.localhost:3000` / `design-admin.*` | `admin-*.spec.ts`                       |

Les helpers communs vivent dans `e2e/helpers/` :
- `auth.ts` : `loginAsAdmin()`, `loginAsTeacher()`, `establishSession()`, `logout()`.
- `locale.ts` : `expectAllLinksLocalized()`, `eachLocale()`.

### Court-circuit du flow magic-link

Tester le flow magic-link complet (email → clic → callback) requiert une
infra externe (MailHog, Mailosaur). À la place, on utilise une route de
test `/api/test/establish-session` qui :

1. **Garde 1** : 404 si `NODE_ENV === "production"` ET `VERCEL_ENV === "production"`.
2. **Garde 2** : 401 si le header `X-Playwright-Test` ne correspond pas à
   `PLAYWRIGHT_TEST_SECRET`.
3. Si garde OK, génère un magic-link via `supabase.auth.admin.generateLink()`
   et retourne le `hashed_token`.
4. Le test l'échange ensuite côté navigateur via `supabase.auth.verifyOtp`,
   ce qui pose les cookies `sb-*` host-only normalement.

Cette approche teste **tout sauf le clic email** :
- Validation Zod du POST → ✓
- Lookup Supabase admin → ✓
- Génération du token → ✓
- Échange du token côté client → ✓
- Pose des cookies host-only → ✓
- Lecture par /api/me/role → ✓
- Hydratation du context React → ✓
- UI conditionnelle au rôle → ✓
- Clic d'édition + écriture override → ✓ (testé partiellement)

Le flow PKCE pur (envoi email + clic + redirect /auth/callback) reste
couvert par les tests Vitest (P0.7-quinquies / P0.7-sexies / P0.7-septies /
P0.7-undecies).

### Les 6 chaînes critiques

Toutes documentées dans l'audit-cc §5.3.

| Chaîne | Fichier                          | Statut Sprint A4 |
|--------|----------------------------------|------------------|
| C1     | `e2e/admin-flow.spec.ts`         | Implémenté (court-circuit) |
| C2     | `e2e/teacher-flow.spec.ts`       | Implémenté (court-circuit) |
| C3     | `e2e/student-class-enrollment.spec.ts` | Implémenté (mock API pour code invalide) |
| C4     | `e2e/admin-flow.spec.ts` (sous-suite) | Partiel — ne sauve pas réellement (pollution) |
| C5     | `e2e/cross-host-isolation.spec.ts` | Implémenté |
| C6     | `e2e/locale-preservation.spec.ts` | Implémenté pour les 3 locales |

### Limitations connues

- **C3 inscription réelle** : pas de code de classe de test stable en base.
  Le test vérifie le rendu du formulaire et les cas d'erreur (mock API).
  La soumission réelle nécessite un seed dédié.
- **C4 édition réelle** : pour éviter de polluer `exercise_overrides` /
  `audit_log` en environnement partagé, le test vérifie la UI (textarea
  visible) mais ne sauve pas. À activer via `PLAYWRIGHT_SKIP_EDIT=0` quand
  un projet Supabase de test sera disponible.
- **Magic-link réel** : court-circuité via `/api/test/establish-session`.
  Les unit tests Vitest couvrent le flow PKCE proprement dit.
- **Cookies cross-host** : le helper `establishSession` pose les cookies
  via document.cookie côté navigateur. C'est suffisant pour valider
  l'isolation host-only mais ne reproduit pas exactement le `Set-Cookie`
  serveur du callback Supabase.

### Debug

Si un test échoue :

1. **Voir le rapport HTML** : `npx playwright show-report` (auto-ouvert
   en CI, généré dans `playwright-report/`).
2. **Voir la trace** : retries en CI génèrent une trace.zip dans
   `test-results/`. Ouvrir avec `npx playwright show-trace <path>`.
3. **Mode UI** : `npm run test:e2e:ui` permet de rejouer le test en
   pause/play et inspecter le DOM à chaque step.

---

## CI Vercel preview deploy

À configurer (non bloquant pour A4) : un GitHub Action qui exécute
Playwright contre le preview Vercel à chaque PR. Squelette à venir
dans `.github/workflows/playwright.yml`.

---

## Ajouter un nouveau test

1. Créer le fichier dans `e2e/` avec un nom matchant le projet cible
   (`student-*`, `teacher-*`, `admin-*` ou `cross-host-*` / `locale-*`).
2. Importer les helpers : `import { loginAsAdmin } from "./helpers/auth"`.
3. Décrire le scénario en blocs `test.describe` / `test()`.
4. Utiliser `expect()` de Playwright (pas Vitest) pour les assertions UI.
5. Lancer en local : `npm run test:e2e -- e2e/mon-test.spec.ts`.
