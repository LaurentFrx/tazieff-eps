-- =====================================================================
-- Sprint fix-anonymous-users — Fonction de purge automatique
-- Date       : 2026-05-01
-- Auteur     : Laurent + Claude Code
-- Référence  : audit du 30 avril 2026 (904 anonymes pour 2 users réels) ;
--              voir SKILL.md gouvernance-editoriale §2 (anonymous = élève
--              sans privilège, persistance localStorage côté client).
--
-- Objectif :
--   Fournir une fonction Postgres réutilisable pour purger les comptes
--   anonymes obsolètes (sans données + inactifs > 30 jours). À planifier
--   en cron Supabase (Project Settings > Database > Cron Jobs) si Laurent
--   souhaite l'automatiser. Pour l'instant : exécutable manuellement via
--   `SELECT public.purge_obsolete_anonymous_users();` côté super_admin.
--
-- Critère de purge (plus conservateur que la purge initiale 7j) :
--   - is_anonymous = true
--   - last_sign_in_at < NOW() - INTERVAL '30 days'
--   - AUCUNE donnée dans training_entries / student_profiles /
--     class_enrollments
--
-- Sécurité :
--   - SECURITY DEFINER (s'exécute avec privilèges du créateur, donc
--     accès auth.users) — REQUIS car la table auth.users n'est pas
--     accessible aux rôles non-superuser.
--   - REVOKE EXECUTE FROM PUBLIC, anon, authenticated → seul le service
--     role (ou un cron interne qui l'invoque) peut l'appeler.
--   - search_path = public, pg_catalog (non mutable, conformité advisor
--     `function_search_path_mutable`).
-- =====================================================================

begin;

create or replace function public.purge_obsolete_anonymous_users()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_deleted integer;
begin
  with cibles as (
    select u.id
    from auth.users u
    where u.is_anonymous = true
      and u.last_sign_in_at < now() - interval '30 days'
      and not exists (select 1 from public.training_entries where user_id = u.id)
      and not exists (select 1 from public.student_profiles where user_id = u.id)
      and not exists (select 1 from public.class_enrollments where student_user_id = u.id)
  ),
  deleted as (
    delete from auth.users where id in (select id from cibles)
    returning id
  )
  select count(*) into v_deleted from deleted;
  return v_deleted;
end $$;

revoke all on function public.purge_obsolete_anonymous_users() from public;
revoke all on function public.purge_obsolete_anonymous_users() from anon;
revoke all on function public.purge_obsolete_anonymous_users() from authenticated;

comment on function public.purge_obsolete_anonymous_users() is
  'Purge les comptes anonymes inactifs > 30 jours sans donnees associees. Audit 2026-04-30 : 904 anonymes pour 2 users reels detectes. A appeler en cron Supabase mensuel ou manuellement via SELECT public.purge_obsolete_anonymous_users();';

commit;
