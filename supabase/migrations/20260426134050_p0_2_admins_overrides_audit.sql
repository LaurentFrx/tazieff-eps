-- =====================================================================
-- Phase P0.2 — app_admins, restructuration exercise_overrides, audit_log
-- Date       : 2026-04-26
-- Auteur     : Laurent + Claude Code
-- Référence  : GOUVERNANCE_EDITORIALE.md §3.1 (couche override),
--              §6 (audit), §7 (écarts à corriger)
-- Skill      : .claude/skills/gouvernance-editoriale/SKILL.md
--
-- Objectif :
--   1. Créer la table `app_admins` distinguant super_admin / admin et les
--      helpers SECURITY DEFINER `is_super_admin()` / `is_admin()`.
--   2. Restructurer `exercise_overrides` : ajout author_user_id (NOT NULL),
--      created_at, created_by, deleted_at + RLS strict (lecture publique
--      filtrée deleted_at, écriture admin uniquement) + trigger soft-delete.
--   3. Créer `audit_log` append-only + trigger d'audit automatique sur
--      INSERT/UPDATE de `exercise_overrides`.
--
-- Décisions critiques :
--   - Les 5 lignes pré-migration sont supprimées physiquement AVANT que
--     les triggers d'audit existent (cf. reconnaissance du 26 avril :
--     ces lignes n'avaient pas d'auteur traçable, donc inauditable).
--   - Le premier super_admin est inséré dans la migration : compte
--     contact@muscu-eps.fr (UUID bda83e06-83f4-4134-b704-99442996a543).
--   - Toutes les policies RLS suivent les conventions E.2.1 :
--     `(select auth.uid())` wrap, `TO authenticated` (sauf SELECT
--     exercise_overrides qui reste public).
--   - Helpers SECURITY DEFINER : search_path figé à `public, pg_catalog`
--     (skill tazieff-architecture + retour d'expérience E.2.2).
--
-- Migration atomique : wrap begin; ... commit;
-- =====================================================================

begin;

-- =====================================================================
-- 1. Table app_admins
-- =====================================================================

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  notes text
);

alter table public.app_admins enable row level security;

-- =====================================================================
-- 2. Helpers SECURITY DEFINER
-- =====================================================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.app_admins
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.app_admins
    where user_id = auth.uid()
      and role in ('super_admin','admin')
  );
$$;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- =====================================================================
-- 3. Policies RLS sur app_admins
-- =====================================================================

drop policy if exists "app_admins_select_admins" on public.app_admins;
create policy "app_admins_select_admins" on public.app_admins
  for select to authenticated
  using (public.is_admin());

drop policy if exists "app_admins_insert_super_admin" on public.app_admins;
create policy "app_admins_insert_super_admin" on public.app_admins
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists "app_admins_update_super_admin" on public.app_admins;
create policy "app_admins_update_super_admin" on public.app_admins
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- DELETE : super_admin uniquement, ET interdiction d'auto-révocation
-- (un super_admin ne peut pas se retirer lui-même → protège du lockout).
drop policy if exists "app_admins_delete_super_admin_not_self" on public.app_admins;
create policy "app_admins_delete_super_admin_not_self" on public.app_admins
  for delete to authenticated
  using (
    public.is_super_admin()
    and user_id <> (select auth.uid())
  );

-- =====================================================================
-- 4. Bootstrap : premier super_admin (contact@muscu-eps.fr)
--    Les migrations s'appliquent en tant que rôle propriétaire de la
--    table (BYPASSRLS) → l'INSERT passe malgré la policy qui exigerait
--    déjà un super_admin existant.
-- =====================================================================

insert into public.app_admins (user_id, role, created_by, notes)
values (
  'bda83e06-83f4-4134-b704-99442996a543',
  'super_admin',
  'bda83e06-83f4-4134-b704-99442996a543',
  'Premier super_admin, cree par migration P0.2 le 26 avril 2026'
);

-- =====================================================================
-- 5. Suppression des 5 lignes existantes de exercise_overrides
--    (décision Laurent du 26 avril 2026, cf. reconnaissance prod :
--     ces lignes n'ont pas d'auteur traçable et seront recréées dans
--     un cadre conforme à la gouvernance.)
--    Effectué AVANT l'ajout du trigger soft-delete pour garantir une
--    suppression physique propre (pas de soft-delete sur des lignes
--    déjà soft-deletées) et AVANT la contrainte NOT NULL.
-- =====================================================================

delete from public.exercise_overrides;

-- =====================================================================
-- 6. Restructuration de exercise_overrides
-- =====================================================================

alter table public.exercise_overrides
  add column author_user_id uuid references auth.users(id),
  add column created_at timestamptz not null default now(),
  add column created_by uuid references auth.users(id),
  add column deleted_at timestamptz;

-- Après le DELETE de l'étape 5, la table est vide → on peut imposer NOT NULL
alter table public.exercise_overrides
  alter column author_user_id set not null;

-- Index utiles
create index if not exists ix_exercise_overrides_author
  on public.exercise_overrides(author_user_id);
create index if not exists ix_exercise_overrides_active
  on public.exercise_overrides(slug, locale)
  where deleted_at is null;

-- =====================================================================
-- 7. Mise à jour des policies RLS sur exercise_overrides
--    Policies préexistantes (relevées via pg_policies le 26 avril 2026) :
--      - "public read overrides" (SELECT, USING true, anon+authenticated)
--    On les drop puis on recrée la matrice complète conforme P0.2.
-- =====================================================================

drop policy if exists "public read overrides" on public.exercise_overrides;

-- SELECT : public (anon + authenticated), filtré deleted_at is null.
-- Le contenu officiel est destiné à tous les utilisateurs sans distinction.
drop policy if exists "exercise_overrides_select_public_active"
  on public.exercise_overrides;
create policy "exercise_overrides_select_public_active"
  on public.exercise_overrides
  for select to anon, authenticated
  using (deleted_at is null);

-- INSERT : admin uniquement, avec author_user_id et created_by tracés
drop policy if exists "exercise_overrides_insert_admin"
  on public.exercise_overrides;
create policy "exercise_overrides_insert_admin"
  on public.exercise_overrides
  for insert to authenticated
  with check (
    public.is_admin()
    and author_user_id = (select auth.uid())
    and created_by = (select auth.uid())
  );

-- UPDATE : admin (un admin peut corriger un override d'un autre admin)
drop policy if exists "exercise_overrides_update_admin"
  on public.exercise_overrides;
create policy "exercise_overrides_update_admin"
  on public.exercise_overrides
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE : admin (mais le trigger soft-delete ci-dessous transforme la
-- suppression physique en UPDATE deleted_at = now()).
drop policy if exists "exercise_overrides_delete_admin"
  on public.exercise_overrides;
create policy "exercise_overrides_delete_admin"
  on public.exercise_overrides
  for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- 8. Trigger soft-delete sur exercise_overrides
-- =====================================================================

create or replace function public.exercise_overrides_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.exercise_overrides
    set deleted_at = now()
    where slug = old.slug and locale = old.locale and deleted_at is null;
  return null; -- annule le DELETE physique
end $$;

drop trigger if exists trg_exercise_overrides_soft_delete
  on public.exercise_overrides;
create trigger trg_exercise_overrides_soft_delete
  before delete on public.exercise_overrides
  for each row execute function public.exercise_overrides_soft_delete();

-- =====================================================================
-- 9. Table audit_log (append-only)
-- =====================================================================

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_role text,
  action_type text not null check (action_type in ('insert','update','delete')),
  target_table text not null,
  target_pk jsonb not null,
  diff_before jsonb,
  diff_after jsonb,
  created_at timestamptz not null default now()
);

create index ix_audit_log_target
  on public.audit_log(target_table, created_at desc);
create index ix_audit_log_actor
  on public.audit_log(actor_user_id, created_at desc);

alter table public.audit_log enable row level security;

-- Lecture réservée aux admins
drop policy if exists "audit_log_select_admins" on public.audit_log;
create policy "audit_log_select_admins" on public.audit_log
  for select to authenticated
  using (public.is_admin());

-- Pas d'INSERT manuel : seuls les triggers SECURITY DEFINER écrivent.
-- Pas d'UPDATE ni DELETE : audit_log est append-only — aucune policy
-- correspondante n'est créée, ce qui bloque ces actions par défaut RLS.

-- =====================================================================
-- 10. Trigger d'audit sur exercise_overrides
-- =====================================================================

create or replace function public.audit_exercise_overrides()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_role text;
begin
  select role into v_role
  from public.app_admins
  where user_id = auth.uid();

  if (TG_OP = 'INSERT') then
    insert into public.audit_log(
      actor_user_id, actor_role, action_type, target_table, target_pk, diff_after
    )
    values (
      auth.uid(), v_role, 'insert', 'exercise_overrides',
      jsonb_build_object('slug', new.slug, 'locale', new.locale),
      to_jsonb(new)
    );
    return new;
  elsif (TG_OP = 'UPDATE') then
    insert into public.audit_log(
      actor_user_id, actor_role, action_type, target_table, target_pk,
      diff_before, diff_after
    )
    values (
      auth.uid(), v_role, 'update', 'exercise_overrides',
      jsonb_build_object('slug', new.slug, 'locale', new.locale),
      to_jsonb(old), to_jsonb(new)
    );
    return new;
  end if;
  return null;
end $$;

drop trigger if exists trg_exercise_overrides_audit
  on public.exercise_overrides;
create trigger trg_exercise_overrides_audit
  after insert or update on public.exercise_overrides
  for each row execute function public.audit_exercise_overrides();

-- Note : pas de trigger DELETE distinct car le trigger soft-delete (§8)
-- transforme déjà la suppression physique en UPDATE deleted_at = now() ;
-- l'audit UPDATE capture donc bien la suppression logique (deleted_at
-- passant de null à une date dans diff_before / diff_after).

commit;
