-- =====================================================================
-- Phase P0.2 — Tests pgTAP pour RLS exercise_overrides + audit_log
-- Date : 2026-04-26
--
-- Prérequis :
--   - Migration 20260426134050_p0_2_admins_overrides_audit.sql appliquée
--   - Au moins 2 utilisateurs auth.users existants : un super_admin
--     (déjà inséré par la migration : contact@muscu-eps.fr) et un user
--     non-admin (à créer via seed dédié pour ce test).
--
-- Usage :
--   supabase test db
--   # OU :
--   psql "$DATABASE_URL" -f supabase/tests/p0_2_rls.test.sql
--
-- Couverture (4 cas minimum) :
--   1. Un user non-admin ne peut pas insérer dans exercise_overrides
--   2. Un super_admin peut insérer dans exercise_overrides
--   3. Un super_admin peut lire audit_log, un user normal non
--   4. DELETE physique sur exercise_overrides est transformé en
--      soft-delete (deleted_at non null après opération)
--
-- Note : pgTAP s'exécute par défaut en super-utilisateur, ce qui contourne
--   les policies RLS. Pour tester réellement, on simule un user via
--   set_local role + set_local request.jwt.claims (variables session que
--   l'appelant doit définir) :
--
--   \set super_admin_uid 'bda83e06-83f4-4134-b704-99442996a543'
--   \set normal_uid '<uuid-d-un-user-non-admin>'
-- =====================================================================

begin;

select plan(4);

-- ---------------------------------------------------------------------
-- Cas 1 : user non-admin ne peut pas INSERT dans exercise_overrides
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'normal_uid', 'role', 'authenticated')::text,
  true
);

select throws_ok(
  $$ insert into public.exercise_overrides
       (slug, locale, patch_json, author_user_id, created_by)
     values
       ('s1-99', 'fr', '{}'::jsonb,
        (select :'normal_uid'::uuid),
        (select :'normal_uid'::uuid)) $$,
  '42501',
  null,
  'Cas 1 : un user non-admin doit recevoir 42501 (RLS) sur INSERT exercise_overrides'
);

-- ---------------------------------------------------------------------
-- Cas 2 : super_admin peut INSERT dans exercise_overrides
-- ---------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'super_admin_uid', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  $$ insert into public.exercise_overrides
       (slug, locale, patch_json, author_user_id, created_by)
     values
       ('s1-99', 'fr', '{"version":2}'::jsonb,
        (select :'super_admin_uid'::uuid),
        (select :'super_admin_uid'::uuid)) $$,
  'Cas 2 : un super_admin doit pouvoir INSERT dans exercise_overrides'
);

-- ---------------------------------------------------------------------
-- Cas 3 : super_admin peut SELECT audit_log, user normal non
-- ---------------------------------------------------------------------

-- super_admin : doit voir au moins l'INSERT du cas 2
select isnt_empty(
  $$ select 1 from public.audit_log
     where target_table = 'exercise_overrides'
       and action_type = 'insert' $$,
  'Cas 3a : super_admin lit l audit_log et y trouve l insert du cas 2'
);

-- user normal : audit_log doit être vide à ses yeux (RLS bloque le SELECT)
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'normal_uid', 'role', 'authenticated')::text,
  true
);

select is_empty(
  $$ select 1 from public.audit_log $$,
  'Cas 3b : un user non-admin ne voit aucune ligne de audit_log via RLS'
);

-- ---------------------------------------------------------------------
-- Cas 4 : DELETE physique transformé en soft-delete
-- ---------------------------------------------------------------------

-- Repasse en super_admin pour le DELETE
select set_config(
  'request.jwt.claims',
  json_build_object('sub', :'super_admin_uid', 'role', 'authenticated')::text,
  true
);

-- Le DELETE va déclencher le trigger BEFORE DELETE qui transforme en
-- UPDATE deleted_at = now() puis annule le DELETE physique. La ligne
-- doit donc toujours exister, avec deleted_at non null.
delete from public.exercise_overrides
  where slug = 's1-99' and locale = 'fr';

select results_eq(
  $$ select count(*)::int, count(deleted_at)::int
     from public.exercise_overrides
     where slug = 's1-99' and locale = 'fr' $$,
  $$ values (1, 1) $$,
  'Cas 4 : DELETE physique → ligne toujours présente avec deleted_at non null (soft-delete)'
);

-- ---------------------------------------------------------------------
-- Cleanup
-- ---------------------------------------------------------------------

select * from finish();

rollback;
