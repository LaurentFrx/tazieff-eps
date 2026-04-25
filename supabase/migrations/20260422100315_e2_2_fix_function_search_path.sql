-- =====================================================================
-- Phase E.2.2 patch — Hygiène Supabase Security Advisor
-- Date : 2026-04-22
-- =====================================================================
--
-- Warning visé : "Function Search Path Mutable" sur public.tg_set_updated_at.
--
-- Contexte : les trigger functions dont le search_path n'est pas figé peuvent
-- être détournées si un attaquant manipule le search_path de sa session pour
-- insérer un schéma malveillant qui shadow une fonction ou un nom d'objet.
-- Les fonctions E.2.1 `generate_class_join_code`, `user_org_ids`,
-- `user_class_ids`, `user_teacher_class_ids`, `join_class_with_code` avaient
-- déjà `set search_path = public` directement à la création. La trigger
-- function `tg_set_updated_at` a été créée sans ce set — on le corrige ici.
--
-- Cette migration est strictement non destructive : elle ajoute seulement
-- un attribut de sécurité à la fonction existante.
-- =====================================================================

begin;

alter function public.tg_set_updated_at() set search_path = public, pg_temp;

commit;
