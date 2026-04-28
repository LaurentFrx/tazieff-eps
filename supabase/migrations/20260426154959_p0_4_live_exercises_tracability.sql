-- =====================================================================
-- Phase P0.4 — Traçabilité + soft-delete + audit sur live_exercises
-- Date       : 2026-04-26
-- Référence  : GOUVERNANCE_EDITORIALE.md §3.1, §6, §7
-- Calque     : exercise_overrides (P0.2) — même structure de gouvernance
--
-- Objectif :
--   1. Ajouter author_user_id (NOT NULL), created_at, created_by, deleted_at
--   2. Recréer les policies RLS conformes (SELECT public filtré, écritures admin)
--   3. Trigger soft-delete + trigger d'audit (calques sur exercise_overrides)
--
-- Note schéma : la table avait jusqu'ici 4 colonnes (slug, locale,
-- data_json, updated_at) et une seule policy SELECT permissive USING(true).
-- Aucun trigger user-defined n'existait.
--
-- Décision Laurent du 26 avril 2026 : suppression de la ligne unique
-- existante (s1-011) avant migration — pas d'auteur traçable, sera
-- recréée dans un cadre conforme.
-- =====================================================================

begin;

-- =====================================================================
-- 1. Suppression de l'unique ligne existante
-- =====================================================================

delete from public.live_exercises;

-- =====================================================================
-- 2. Restructuration de live_exercises
-- =====================================================================

alter table public.live_exercises
  add column author_user_id uuid references auth.users(id),
  add column created_at timestamptz not null default now(),
  add column created_by uuid references auth.users(id),
  add column deleted_at timestamptz;

-- Après le DELETE de l'étape 1, la table est vide → on peut imposer NOT NULL
alter table public.live_exercises
  alter column author_user_id set not null;

-- =====================================================================
-- 3. Index utiles
-- =====================================================================

create index if not exists ix_live_exercises_author
  on public.live_exercises(author_user_id);
create index if not exists ix_live_exercises_active
  on public.live_exercises(slug, locale)
  where deleted_at is null;

-- =====================================================================
-- 4. Mise à jour des policies RLS sur live_exercises
--    Policy préexistante : "public read live" (SELECT, USING true,
--    anon + authenticated). On la drop puis on recrée la matrice
--    complète conforme P0.4.
-- =====================================================================

drop policy if exists "public read live" on public.live_exercises;

-- SELECT : public (anon + authenticated), filtré deleted_at is null.
-- Le contenu officiel est destiné à tous les utilisateurs sans distinction.
drop policy if exists "live_exercises_select_active" on public.live_exercises;
create policy "live_exercises_select_active"
  on public.live_exercises
  for select to anon, authenticated
  using (deleted_at is null);

-- INSERT : admin uniquement, avec author_user_id et created_by tracés
drop policy if exists "live_exercises_insert_admin" on public.live_exercises;
create policy "live_exercises_insert_admin"
  on public.live_exercises
  for insert to authenticated
  with check (
    public.is_admin()
    and author_user_id = (select auth.uid())
    and created_by = (select auth.uid())
  );

-- UPDATE : admin (un admin peut corriger un live_exercise d'un autre admin)
drop policy if exists "live_exercises_update_admin" on public.live_exercises;
create policy "live_exercises_update_admin"
  on public.live_exercises
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE : admin (mais le trigger soft-delete ci-dessous transforme la
-- suppression physique en UPDATE deleted_at = now()).
drop policy if exists "live_exercises_delete_admin" on public.live_exercises;
create policy "live_exercises_delete_admin"
  on public.live_exercises
  for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- 5. Trigger soft-delete sur live_exercises
-- =====================================================================

create or replace function public.live_exercises_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.live_exercises
    set deleted_at = now()
    where slug = old.slug and locale = old.locale and deleted_at is null;
  return null; -- annule le DELETE physique
end $$;

drop trigger if exists trg_live_exercises_soft_delete
  on public.live_exercises;
create trigger trg_live_exercises_soft_delete
  before delete on public.live_exercises
  for each row execute function public.live_exercises_soft_delete();

-- =====================================================================
-- 6. Trigger d'audit sur live_exercises (calque exercise_overrides P0.2)
-- =====================================================================

create or replace function public.audit_live_exercises()
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
      auth.uid(), v_role, 'insert', 'live_exercises',
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
      auth.uid(), v_role, 'update', 'live_exercises',
      jsonb_build_object('slug', new.slug, 'locale', new.locale),
      to_jsonb(old), to_jsonb(new)
    );
    return new;
  end if;
  return null;
end $$;

drop trigger if exists trg_live_exercises_audit
  on public.live_exercises;
create trigger trg_live_exercises_audit
  after insert or update on public.live_exercises
  for each row execute function public.audit_live_exercises();

-- Note : pas de trigger DELETE distinct (le trigger soft-delete §5
-- transforme la suppression physique en UPDATE deleted_at, capturé par
-- l'audit UPDATE).

commit;
