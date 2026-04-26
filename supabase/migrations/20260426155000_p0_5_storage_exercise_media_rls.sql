-- =====================================================================
-- Phase P0.5 — Policies RLS sur le bucket Storage `exercise-media`
-- Date       : 2026-04-26
-- Référence  : GOUVERNANCE_EDITORIALE.md §3.1, §7
--
-- Conclusion de l'analyse B.1 (P0.5) :
--   - `media_assets.canonical_url` est null sur 100 % des rows existantes.
--   - Le client tombe sur `storage.from(bucket).getPublicUrl(path)` qui
--     construit une URL HTTP simple — laquelle renvoie 403 sans bucket
--     public ni policy SELECT permissive.
--   - L'app fonctionne aujourd'hui uniquement grâce au `mediaUrlCache`
--     (Map mémoire) qui garde la signedUrl TTL 30min retournée à l'upload.
--     Bug latent au reload / pour un autre utilisateur.
--
-- Décision : on pose une policy SELECT publique sur les objets du bucket
-- `exercise-media` (catalogue officiel = lecture publique, conforme §3.1)
-- + 3 policies admin pour les écritures.
-- =====================================================================

begin;

-- =====================================================================
-- 1. Policies sur storage.objects pour le bucket `exercise-media`
--    storage.objects a déjà RLS activé (par défaut Supabase).
-- =====================================================================

-- SELECT : public (anon + authenticated). Catalogue officiel, lecture libre.
drop policy if exists "storage_exercise_media_select_public" on storage.objects;
create policy "storage_exercise_media_select_public"
  on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'exercise-media');

-- INSERT : admin uniquement
drop policy if exists "storage_exercise_media_insert_admin" on storage.objects;
create policy "storage_exercise_media_insert_admin"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'exercise-media'
    and public.is_admin()
  );

-- UPDATE : admin uniquement
drop policy if exists "storage_exercise_media_update_admin" on storage.objects;
create policy "storage_exercise_media_update_admin"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'exercise-media'
    and public.is_admin()
  )
  with check (
    bucket_id = 'exercise-media'
    and public.is_admin()
  );

-- DELETE : admin uniquement
drop policy if exists "storage_exercise_media_delete_admin" on storage.objects;
create policy "storage_exercise_media_delete_admin"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'exercise-media'
    and public.is_admin()
  );

commit;
