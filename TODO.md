# Dette technique Tazieff EPS

Fichier de suivi des dettes techniques identifiées au fil des phases. Format :
`[PHASE-CIBLE tag] Description concise, fichiers concernés`.

- [E.2.5 dette tech] Migrer `/api/teacher/{exercise-override,live-exercise,upload-media}` de PIN+service_role vers auth Supabase + RLS. Routes actuellement en mode legacy PIN, cohabitent avec le nouveau système magic link (E.2.2).
- [E.2.4 cleanup] Clés i18n `settings.account.*` (connectionUnavailable, tooManyAttempts, alreadyLinked, etc.) plus référencées depuis que /reglages redirige vers /prof (E.2.3.2). À nettoyer des dictionnaires FR/EN/ES.
- [E.2.4 feature] Créer page élève `/rejoindre?code=XXX` consommant `join_class_with_code` RPC. Les QR codes des classes prof pointent déjà vers cette URL (E.2.3.4), page pas encore créée.

## Isolation cookies sous-domaines (E.2.3.8) — validé par défaut

Le client browser `src/lib/supabase/browser.ts` ne configure PAS `cookieOptions.domain`. Les cookies Supabase sont donc "host-only" (scopés au host exact qui les a émis). Résultat :
- `prof.muscu-eps.fr` ↔ `muscu-eps.fr` : cookies non partagés
- `design-prof.muscu-eps.fr` ↔ `design.muscu-eps.fr` : cookies non partagés
- Aucun risque de leak de session magic-link prof vers espace élève

Ne jamais passer `cookieOptions: { domain: '.muscu-eps.fr' }` sans revue sécurité.

À valider manuellement après déploiement design-prof.muscu-eps.fr : devtools > Application > Cookies → vérifier absence de `Domain=.muscu-eps.fr` sur les cookies `sb-*-auth-token`.

## Warnings Supabase Advisor — décisions documentées

Suite analyse du Security Advisor post-E.2.2 (9 warnings total) :

### Corrigés

- `Function Search Path Mutable` sur `public.tg_set_updated_at` → migration `20260422100315_e2_2_fix_function_search_path.sql` (search_path figé à `public, pg_temp`). Les 5 autres fonctions E.2.1 (`generate_class_join_code`, `user_org_ids`, `user_class_ids`, `user_teacher_class_ids`, `join_class_with_code`) avaient déjà leur search_path figé à la création, donc non concernées.

### Faux positifs assumés

- `RLS Initplan` / `auth_rls_initplan` sur `class_enrollments`, `classes`, `memberships`, `organizations`, `teacher_annotations`, `training_entries`
  - Le linter signale "anonymous users have access" mais nos policies utilisent explicitement `TO authenticated`.
  - Les users anonymous Supabase (carnet élève) sont techniquement dans le groupe `authenticated` — comportement voulu, cohabitation prof (magic link) + élève (anonymous) cf. E.2.2 Phase 2.5.
  - Les conditions `auth.uid() = ...` des policies garantissent qu'un user anonymous ne voit que ses propres rows — isolation effective.
  - Aucune action à prendre.

### À traiter plus tard

- `Extension in Public` sur `pgtap`
  - Bonne pratique : déplacer extensions dans un schéma dédié (`extensions`).
  - `pgtap` = extension de test uniquement, friction inutile à isoler maintenant.
  - À traiter en E.2.5 ou plus tard si on veut désinstaller pgtap de prod et le mettre sur DB de test éphémère.

### Non applicable

- `Leaked Password Protection Disabled` / `auth_leaked_password_protection`
  - Tazieff n'utilise aucun mot de passe (auth = anonymous + magic link).
  - Setting sans effet. Peut rester désactivé.
