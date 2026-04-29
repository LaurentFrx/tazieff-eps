-- =====================================================================
-- Sprint E.4 — Annotations prof visibles côté élève (pattern post-it)
-- Date       : 2026-04-29
-- Auteur     : Laurent + Claude Code
-- Référence  : GOUVERNANCE_EDITORIALE.md v1.1 §3.2 (rendu post-it côté
--              élève) + §6 (audit_log obligatoire sur toute écriture
--              prof/admin)
-- Skill      : .claude/skills/gouvernance-editoriale/SKILL.md
--
-- Objectif :
--   1. Ajouter `section_target` à `teacher_annotations` pour ancrer une
--      annotation à un paragraphe précis (resume / execution / respiration
--      / conseils / securite / dosage), ou `general` (toute la fiche).
--      NULL = comportement legacy (équivaut à `general`).
--   2. Ajouter `display_name` à `memberships` : nom du prof tel qu'il
--      souhaite l'afficher aux élèves (ex. « Mme Dupont », « Mlle K. »).
--      Saisie dans le profil prof, fallback côté élève « Ton prof ».
--   3. Couvrir la non-conformité GOUVERNANCE §6 identifiée dans l'audit
--      Phase E (28 avril 2026) : aucun trigger d'audit sur
--      `teacher_annotations`. Cette migration ajoute le trigger qui aligne
--      `teacher_annotations` sur le pattern de `exercise_overrides`
--      (cf. P0.2 §10 : INSERT/UPDATE/DELETE → audit_log append-only).
--
-- Idempotence : ALTER TABLE … ADD COLUMN IF NOT EXISTS, DROP TRIGGER …
-- IF EXISTS avant CREATE TRIGGER. Migration rejouable sans dégât.
--
-- Migration atomique : begin; … commit;
-- =====================================================================

begin;

-- =====================================================================
-- 1. teacher_annotations.section_target
-- =====================================================================
-- Aligné sur les clés `InlineParagraphKey` du composant côté élève
-- (src/app/[locale]/exercices/[slug]/_teacher-editor/section-matchers.ts) :
--   resume / respiration / securite / execution / conseils / dosage
-- Plus `general` qui couvre les annotations à la fiche entière (fallback
-- pour les lignes existantes : NULL est traité comme `general` côté UI).

alter table public.teacher_annotations
  add column if not exists section_target text;

-- Drop puis re-create la check constraint pour idempotence.
alter table public.teacher_annotations
  drop constraint if exists teacher_annotations_section_target_check;

alter table public.teacher_annotations
  add constraint teacher_annotations_section_target_check
    check (
      section_target is null
      or section_target in (
        'general',
        'resume',
        'execution',
        'respiration',
        'conseils',
        'securite',
        'dosage'
      )
    );

-- Index utile pour le rendu côté élève qui filtrera par exercise_slug +
-- locale + section_target. Active uniquement sur les rows non supprimés
-- pour ne pas alourdir les writes inutilement.
create index if not exists ix_teacher_annotations_section_target
  on public.teacher_annotations(exercise_slug, locale, section_target)
  where deleted_at is null;

-- =====================================================================
-- 2. memberships.display_name
-- =====================================================================
-- Nullable : un prof n'est pas obligé de renseigner. Côté UI élève, le
-- fallback affiche « Ton prof » si display_name est NULL ou vide.
-- Limite à 50 caractères pour rester lisible dans le post-it.

alter table public.memberships
  add column if not exists display_name text;

alter table public.memberships
  drop constraint if exists memberships_display_name_length_check;

alter table public.memberships
  add constraint memberships_display_name_length_check
    check (
      display_name is null
      or length(trim(both from display_name)) between 2 and 50
    );

-- =====================================================================
-- 3. Trigger d'audit sur teacher_annotations
-- =====================================================================
-- Conformité GOUVERNANCE §6 : toute écriture prof produit une entrée
-- audit_log. Pattern aligné sur audit_exercise_overrides() (cf. P0.2).
-- Capture INSERT, UPDATE et DELETE physique. Le code applicatif fait
-- un UPDATE deleted_at = now() pour soft-delete, donc le cas DELETE
-- physique est rare mais doit être tracé si jamais.

create or replace function public.audit_teacher_annotations()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_role text;
begin
  -- Le rôle de l'auteur est rarement présent dans app_admins (les profs
  -- ne sont pas admins) mais on conserve la cohérence avec
  -- audit_exercise_overrides : NULL si non-admin, c'est l'attendu.
  select role into v_role
  from public.app_admins
  where user_id = auth.uid();

  if (TG_OP = 'INSERT') then
    insert into public.audit_log(
      actor_user_id, actor_role, action_type, target_table, target_pk, diff_after
    )
    values (
      auth.uid(),
      coalesce(v_role, 'teacher'),
      'insert',
      'teacher_annotations',
      jsonb_build_object('id', new.id),
      to_jsonb(new)
    );
    return new;
  elsif (TG_OP = 'UPDATE') then
    insert into public.audit_log(
      actor_user_id, actor_role, action_type, target_table, target_pk,
      diff_before, diff_after
    )
    values (
      auth.uid(),
      coalesce(v_role, 'teacher'),
      'update',
      'teacher_annotations',
      jsonb_build_object('id', new.id),
      to_jsonb(old),
      to_jsonb(new)
    );
    return new;
  elsif (TG_OP = 'DELETE') then
    insert into public.audit_log(
      actor_user_id, actor_role, action_type, target_table, target_pk,
      diff_before
    )
    values (
      auth.uid(),
      coalesce(v_role, 'teacher'),
      'delete',
      'teacher_annotations',
      jsonb_build_object('id', old.id),
      to_jsonb(old)
    );
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_teacher_annotations_audit
  on public.teacher_annotations;
create trigger trg_teacher_annotations_audit
  after insert or update or delete on public.teacher_annotations
  for each row execute function public.audit_teacher_annotations();

commit;
