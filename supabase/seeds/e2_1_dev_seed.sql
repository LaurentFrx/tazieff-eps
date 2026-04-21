-- =====================================================================
-- Phase E.2.1 — Seeds de développement
-- Date : 2026-04-21
-- Prérequis : exécuter d'abord `pnpm tsx supabase/seeds/e2_1_seed_users.ts`
--            qui crée les auth.users et écrit leurs UUIDs dans
--            supabase/seeds/dev-credentials.json (gitignored).
--
-- Convention : tous les UUIDs E.2.1 sont préfixés 00000000-0000-0000-0001-*
-- pour identification facile et reset ciblé en dev.
--
-- Idempotent : tous les INSERTs utilisent `on conflict do nothing`.
-- =====================================================================

-- NB : user_id/teacher_user_id sont en placeholder. Le script TS remplacera
-- ces valeurs par les UUIDs réels des auth.users qu'il crée. Alternative :
-- utiliser directement des UUIDs fictifs ici ET ne JAMAIS appliquer ces
-- seeds avant le script TS (sinon violation FK auth.users).
--
-- Pour l'instant : seeds "organizations + classes + annotations" sans
-- memberships/enrollments (qui dépendent d'auth.users). Le script TS
-- crée les users PUIS appelle ses propres INSERT pour memberships et
-- enrollments (voir e2_1_seed_users.ts).

begin;

-- =====================================================================
-- 1. Organisations fictives
-- =====================================================================

insert into public.organizations (id, name, type, academic_domain, country_code)
values
  ('00000000-0000-0000-0001-000000000001', 'Lycée Haroun Tazieff (Mont-de-Marsan)', 'lycee', 'ac-bordeaux.fr', 'FR'),
  ('00000000-0000-0000-0001-000000000002', 'Lycée des Pyrénées (Pau)', 'lycee', 'ac-bordeaux.fr', 'FR')
on conflict (id) do nothing;

commit;

-- =====================================================================
-- Les memberships, classes, enrollments et annotations sont créés par
-- le script TS (e2_1_seed_users.ts) APRÈS création des auth.users, pour
-- garantir l'intégrité référentielle.
-- =====================================================================
