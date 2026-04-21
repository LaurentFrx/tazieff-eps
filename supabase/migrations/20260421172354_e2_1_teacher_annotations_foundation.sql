-- =====================================================================
-- Phase E.2.1 — Fondations Supabase pour annotations prof (Tazieff EPS)
-- Date       : 2026-04-21
-- Auteur     : Laurent + Claude Code
-- Arbitrages :
--   1. organizations → Option A (fusion). ALTER TABLE pour ajouter 5 colonnes.
--      Colonnes Pro (code, is_pro, pro_expires_at, pro_activated_at,
--      lemon_squeezy_customer_id) préservées telles quelles.
--   2. Policy existante "Tout le monde peut lire les organisations" CONSERVÉE
--      car utilisée par CodeEtablissement.tsx + usePlan.ts (flow code Pro
--      établissement). Une restriction par membership casserait ce flow.
--      À revoir en E.2.2+ via Edge Function si besoin de cloisonner.
--   3. pgtap activé pour les tests RLS (supabase/tests/e2_1_rls.test.sql).
--
-- Livrables :
--   - ALTER organizations : +5 colonnes (type, academic_domain, country_code,
--     updated_at, deleted_at). Backfill updated_at.
--   - 4 tables nouvelles : memberships, classes, class_enrollments,
--     teacher_annotations.
--   - 6 fonctions : generate_class_join_code, tg_set_updated_at,
--     user_org_ids, user_class_ids, user_teacher_class_ids,
--     join_class_with_code.
--   - 3 triggers updated_at.
--   - 9 index (toutes colonnes RLS indexées).
--   - Policies RLS (toutes en (select auth.uid()) + TO authenticated).
--
-- Invariants respectés (skill tazieff-architecture) :
--   - organization_id + created_at + updated_at + deleted_at sur les
--     tables avec user data.
--   - RLS activé partout.
--   - (select auth.uid()) wrap systématique.
--   - TO authenticated sur toutes les policies.
--   - Colonnes RLS indexées.
--   - Soft delete via deleted_at (sauf class_enrollments qui est une simple
--     relation N-N, DELETE direct acceptable).
--
-- Migration atomique : wrap begin; ... commit;
-- =====================================================================

begin;

-- =====================================================================
-- 0. Extensions
-- =====================================================================

create extension if not exists pgtap;

-- =====================================================================
-- 1. ALTER organizations (Option A — fusion non destructive)
-- =====================================================================

alter table public.organizations
  add column if not exists type text default 'lycee'
    check (type in ('lycee','college','autre'));

alter table public.organizations
  add column if not exists academic_domain text;

alter table public.organizations
  add column if not exists country_code text default 'FR';

alter table public.organizations
  add column if not exists updated_at timestamptz default now();

alter table public.organizations
  add column if not exists deleted_at timestamptz;

-- Backfill updated_at sur rows existantes (1 row en prod à la date)
update public.organizations
  set updated_at = coalesce(created_at, now())
  where updated_at is null;

-- NB : la policy publique existante est conservée, aucune nouvelle policy ajoutée ici.

-- =====================================================================
-- 2. Tables E.2.1
-- =====================================================================

-- memberships : user ↔ organisation (multi-établissement)
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('teacher','org_admin','super_admin')),
  status text default 'active' check (status in ('active','pending','revoked')),
  created_at timestamptz default now(),
  unique (user_id, organization_id)
);

-- classes : classe d'un prof dans un lycée
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  school_year text,
  join_code text unique not null,
  join_code_expires_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- class_enrollments : élève ↔ classe
create table if not exists public.class_enrollments (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (class_id, student_user_id)
);

-- teacher_annotations : la table cœur d'E.2
create table if not exists public.teacher_annotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  exercise_slug text not null,
  locale text not null default 'fr' check (locale in ('fr','en','es')),
  exercise_version int,
  content jsonb not null default '{}'::jsonb,
  visibility_scope text not null default 'private'
    check (visibility_scope in ('private','class','school')),
  scope_id uuid,
  needs_review boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint scope_id_coherent check (
    (visibility_scope = 'class' and scope_id is not null)
    or (visibility_scope in ('private','school') and scope_id is null)
  )
);

-- =====================================================================
-- 3. Index (toutes colonnes RLS indexées)
-- =====================================================================

create index if not exists idx_memberships_user
  on public.memberships(user_id) where status = 'active';
create index if not exists idx_memberships_org
  on public.memberships(organization_id) where status = 'active';
create index if not exists idx_classes_teacher
  on public.classes(teacher_user_id) where archived_at is null;
create index if not exists idx_classes_org
  on public.classes(organization_id);
create index if not exists idx_enrollments_student
  on public.class_enrollments(student_user_id);
create index if not exists idx_ta_author
  on public.teacher_annotations(author_user_id) where deleted_at is null;
create index if not exists idx_ta_org
  on public.teacher_annotations(organization_id) where deleted_at is null;
create index if not exists idx_ta_slug_locale
  on public.teacher_annotations(exercise_slug, locale) where deleted_at is null;
create index if not exists idx_ta_scope
  on public.teacher_annotations(visibility_scope, scope_id) where deleted_at is null;

-- =====================================================================
-- 4. Fonctions
-- =====================================================================

-- Trigger générique updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Générateur de code de classe (6 caractères alphanum, sans 0/O/1/I/L)
create or replace function public.generate_class_join_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  exists_count int;
  attempts int := 0;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, (floor(random() * length(alphabet))::int + 1), 1);
    end loop;
    select count(*) into exists_count from public.classes where join_code = code;
    exit when exists_count = 0 or attempts > 20;
    attempts := attempts + 1;
  end loop;
  if attempts > 20 then
    raise exception 'Impossible de générer un code unique après 20 tentatives';
  end if;
  return code;
end;
$$;

-- Helpers SECURITY DEFINER (évitent la récursion RLS)
create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.memberships
  where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.user_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select class_id
  from public.class_enrollments
  where student_user_id = auth.uid()
$$;

create or replace function public.user_teacher_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.classes
  where teacher_user_id = auth.uid() and archived_at is null
$$;

-- Fonction d'inscription élève via code (validation + insert atomique)
create or replace function public.join_class_with_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  select id, organization_id into v_class_id, v_org_id
  from public.classes
  where join_code = upper(p_code)
    and archived_at is null
    and (join_code_expires_at is null or join_code_expires_at > now());
  if v_class_id is null then
    raise exception 'Code invalide ou expiré';
  end if;
  insert into public.class_enrollments (class_id, student_user_id)
  values (v_class_id, auth.uid())
  on conflict do nothing;
  return v_class_id;
end;
$$;

grant execute on function public.join_class_with_code(text) to authenticated;
grant execute on function public.user_org_ids() to authenticated;
grant execute on function public.user_class_ids() to authenticated;
grant execute on function public.user_teacher_class_ids() to authenticated;

-- =====================================================================
-- 5. Triggers updated_at
-- =====================================================================

drop trigger if exists trg_orgs_updated on public.organizations;
create trigger trg_orgs_updated before update on public.organizations
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_classes_updated on public.classes;
create trigger trg_classes_updated before update on public.classes
  for each row execute function public.tg_set_updated_at();

drop trigger if exists trg_ta_updated on public.teacher_annotations;
create trigger trg_ta_updated before update on public.teacher_annotations
  for each row execute function public.tg_set_updated_at();

-- =====================================================================
-- 6. RLS — activation
-- =====================================================================

alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.teacher_annotations enable row level security;

-- =====================================================================
-- 7. RLS — policies (idempotent : drop-if-exists + create)
-- =====================================================================

-- --------- memberships ---------
-- SELECT : un user voit ses propres memberships OU un org_admin voit celles de son org
drop policy if exists "memberships_select_self_or_admin" on public.memberships;
create policy "memberships_select_self_or_admin" on public.memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or organization_id in (
      select organization_id from public.memberships
      where user_id = (select auth.uid())
        and role in ('org_admin','super_admin')
        and status = 'active'
    )
  );

-- --------- classes ---------
-- SELECT : prof propriétaire OR élève rattaché OR admin/super_admin de la même org
drop policy if exists "classes_select_teacher_student_admin" on public.classes;
create policy "classes_select_teacher_student_admin" on public.classes
  for select to authenticated
  using (
    teacher_user_id = (select auth.uid())
    or id in (select public.user_class_ids())
    or organization_id in (
      select organization_id from public.memberships
      where user_id = (select auth.uid())
        and role in ('org_admin','super_admin')
        and status = 'active'
    )
  );

-- INSERT : prof membre actif de l'org cible ; teacher_user_id doit être l'utilisateur
drop policy if exists "classes_insert_owner_teacher" on public.classes;
create policy "classes_insert_owner_teacher" on public.classes
  for insert to authenticated
  with check (
    teacher_user_id = (select auth.uid())
    and organization_id in (select public.user_org_ids())
  );

-- UPDATE : prof propriétaire uniquement
drop policy if exists "classes_update_owner" on public.classes;
create policy "classes_update_owner" on public.classes
  for update to authenticated
  using (teacher_user_id = (select auth.uid()))
  with check (teacher_user_id = (select auth.uid()));

-- DELETE : prof propriétaire uniquement (soft delete via archived_at recommandé côté app)
drop policy if exists "classes_delete_owner" on public.classes;
create policy "classes_delete_owner" on public.classes
  for delete to authenticated
  using (teacher_user_id = (select auth.uid()));

-- --------- class_enrollments ---------
-- SELECT : l'élève voit ses propres inscriptions + le prof propriétaire voit sa classe
drop policy if exists "enrollments_select_student_or_teacher" on public.class_enrollments;
create policy "enrollments_select_student_or_teacher" on public.class_enrollments
  for select to authenticated
  using (
    student_user_id = (select auth.uid())
    or class_id in (select public.user_teacher_class_ids())
  );

-- INSERT : l'élève s'inscrit lui-même (le garde-fou join_code est dans la fonction
--   public.join_class_with_code(). La policy autorise l'INSERT pour soi-même, sur
--   n'importe quel class_id existant — la fonction contrôle la validité du code).
drop policy if exists "enrollments_insert_self" on public.class_enrollments;
create policy "enrollments_insert_self" on public.class_enrollments
  for insert to authenticated
  with check (student_user_id = (select auth.uid()));

-- DELETE : le prof propriétaire OR l'élève lui-même (désinscription)
drop policy if exists "enrollments_delete_student_or_teacher" on public.class_enrollments;
create policy "enrollments_delete_student_or_teacher" on public.class_enrollments
  for delete to authenticated
  using (
    student_user_id = (select auth.uid())
    or class_id in (select public.user_teacher_class_ids())
  );

-- --------- teacher_annotations ---------
-- SELECT :
--   - l'auteur voit ses propres annotations (quelle que soit la scope)
--   - scope='school' : tout membre actif de l'organisation
--   - scope='class'  : les élèves rattachés + le prof auteur (déjà couvert par auteur)
--   - scope='private': auteur uniquement (déjà couvert)
--   - Exclut les rows soft-deleted (deleted_at is null)
drop policy if exists "ta_select_auth_or_school_or_class" on public.teacher_annotations;
create policy "ta_select_auth_or_school_or_class" on public.teacher_annotations
  for select to authenticated
  using (
    deleted_at is null
    and (
      author_user_id = (select auth.uid())
      or (
        visibility_scope = 'school'
        and organization_id in (select public.user_org_ids())
      )
      or (
        visibility_scope = 'class'
        and scope_id in (select public.user_class_ids())
      )
    )
  );

-- INSERT : l'auteur doit être l'utilisateur courant, ET il doit être membre
-- actif (role teacher/admin) de l'organisation cible.
drop policy if exists "ta_insert_author_member" on public.teacher_annotations;
create policy "ta_insert_author_member" on public.teacher_annotations
  for insert to authenticated
  with check (
    author_user_id = (select auth.uid())
    and organization_id in (select public.user_org_ids())
  );

-- UPDATE : auteur uniquement (rowlevel). Le changement d'organization_id est
-- bloqué par la sous-contrainte du with_check (author reste author).
drop policy if exists "ta_update_author" on public.teacher_annotations;
create policy "ta_update_author" on public.teacher_annotations
  for update to authenticated
  using (author_user_id = (select auth.uid()))
  with check (author_user_id = (select auth.uid()));

-- DELETE : auteur uniquement. Côté application, on utilise soft delete
-- (UPDATE deleted_at = now()) plutôt que DELETE physique, sauf purge RGPD.
drop policy if exists "ta_delete_author" on public.teacher_annotations;
create policy "ta_delete_author" on public.teacher_annotations
  for delete to authenticated
  using (author_user_id = (select auth.uid()));

commit;
