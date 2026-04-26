-- =====================================================================
-- Sprint E1 — Table student_profiles + helper is_teacher_of_student
-- Date       : 2026-04-26
-- Référence  : GOUVERNANCE_EDITORIALE.md §2.4 (rôle student), §3.3 (carnet
--              personnel), décision Laurent du 26 avril (compte anonyme +
--              prénom/nom, doublons entre appareils acceptés en v1).
--
-- Objectif :
--   1. Table student_profiles enrichissant les comptes anonymes Supabase
--      avec un prénom et un nom (visibles par le prof de classe).
--   2. Helper SECURITY DEFINER `is_teacher_of_student` pour permettre aux
--      enseignants de lire le profil de leurs élèves inscrits.
--   3. Matrice RLS : élève voit son propre profil, prof voit les profils
--      de ses élèves, super_admin / admin voient tout.
--
-- Note : un élève peut se trouver sur plusieurs appareils → il aura alors
-- plusieurs auth.users distincts (un par appareil). C'est un compromis v1.
-- =====================================================================

begin;

-- =====================================================================
-- 1. Table student_profiles
-- =====================================================================

create table public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) between 1 and 60),
  last_name text not null check (length(trim(last_name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;

-- Index utile pour la recherche d'un élève par nom (futur listing prof)
create index ix_student_profiles_lastname
  on public.student_profiles(last_name, first_name);

-- =====================================================================
-- 2. Trigger updated_at
-- =====================================================================

create or replace function public.tg_set_updated_at_student_profiles()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_student_profiles_updated_at on public.student_profiles;
create trigger trg_student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.tg_set_updated_at_student_profiles();

-- =====================================================================
-- 3. Helper SECURITY DEFINER : is_teacher_of_student
--    Évite la récursion RLS et donne aux profs accès aux profils des
--    élèves inscrits dans une de leurs classes.
-- =====================================================================

create or replace function public.is_teacher_of_student(p_student_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.class_enrollments ce
    join public.classes c on c.id = ce.class_id
    where ce.student_user_id = p_student_user_id
      and c.teacher_user_id = auth.uid()
  );
$$;

grant execute on function public.is_teacher_of_student(uuid) to authenticated;

-- =====================================================================
-- 4. Policies RLS
-- =====================================================================

-- SELECT : 4 cas combinés (self + teacher + admin)
drop policy if exists "student_profiles_select" on public.student_profiles;
create policy "student_profiles_select"
  on public.student_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_teacher_of_student(user_id)
    or public.is_admin()
  );

-- INSERT : un élève crée uniquement son propre profil
drop policy if exists "student_profiles_insert_self" on public.student_profiles;
create policy "student_profiles_insert_self"
  on public.student_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE : un élève met à jour uniquement son propre profil
drop policy if exists "student_profiles_update_self" on public.student_profiles;
create policy "student_profiles_update_self"
  on public.student_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- DELETE : auto-suppression OU admin (RGPD)
drop policy if exists "student_profiles_delete" on public.student_profiles;
create policy "student_profiles_delete"
  on public.student_profiles
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin()
  );

commit;
