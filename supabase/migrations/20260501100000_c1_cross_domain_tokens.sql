-- =====================================================================
-- Sprint C1 — Auto-login cross-domain via token éphémère
-- Date       : 2026-05-01
-- Auteur     : Laurent + Claude Code
-- Référence  : conversation stratégique 1er mai 2026 (Approche 3)
--              GOUVERNANCE_EDITORIALE.md §2 (présence UI sans privilège),
--              §7 (isolation E.2.3.8 host-only)
--
-- Objectif :
--   Permettre à un super_admin / teacher authentifié sur un sous-domaine
--   (admin / prof / élève) de switcher vers un autre sous-domaine via
--   les pills de la TopBar SANS nouveau magic-link, tout en préservant
--   l'isolation E.2.3.8 (cookies host-only, pas de cookie partagé sur
--   .muscu-eps.fr).
--
-- Stratégie :
--   1. Sur le sous-domaine source, le client demande un token au backend
--      (POST /api/auth/cross-domain/generate). La route vérifie la session
--      courante et le droit d'accès au target_host, puis génère un token
--      aléatoire 64 chars avec binding IP + User-Agent.
--   2. Le client navigue vers https://target-host/api/auth/cross-domain/
--      consume?token=...&path=...
--   3. La route consume vérifie le token, le binding IP/UA, et matérialise
--      une session Supabase via auth.admin.generateLink + verifyOtp. Les
--      cookies sont posés host-only sur le sous-domaine cible (E.2.3.8
--      préservée).
--
-- Sécurité :
--   - Tokens expirent en 30 secondes (purge au-delà de 1h pour audit).
--   - Tokens à usage unique (consumed_at NOT NULL après consommation).
--   - Binding IP + User-Agent (rejet si discordance).
--   - RLS strict : service_role only.
--
-- Idempotence : CREATE TABLE IF NOT EXISTS, DROP TRIGGER IF EXISTS avant
-- chaque CREATE. Migration rejouable sans dégât.
-- =====================================================================

begin;

-- =====================================================================
-- 1. Table auth_cross_domain_tokens
-- =====================================================================
-- Stocke les tokens éphémères de transfert de session entre sous-domaines.
-- Une ligne par tentative de switch. Lecture/écriture exclusivement via
-- service_role (les routes /api/auth/cross-domain/{generate,consume} sont
-- les seules à manipuler cette table).

create table if not exists public.auth_cross_domain_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Le token brut (hex 64 chars, généré côté Node via crypto.randomBytes(32)).
  token text not null unique,
  -- Hosts source/cible du switch (whitelist appliquée côté API).
  source_host text not null,
  target_host text not null,
  -- Path de redirection sur le sous-domaine cible (échappé côté API).
  target_path text not null default '/',
  -- Binding réseau pour empêcher la réutilisation depuis un autre client.
  client_ip text not null,
  client_user_agent text not null,
  created_at timestamptz not null default now(),
  -- Fenêtre courte (30s) : le client doit naviguer immédiatement.
  expires_at timestamptz not null default (now() + interval '30 seconds'),
  -- Marqué non-NULL après consommation (usage unique).
  consumed_at timestamptz
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================
-- Lookup rapide par token (cas critique : route /consume).
-- Filtre partial sur consumed_at IS NULL : la grande majorité des tokens
-- sont rapidement consommés, donc l'index reste léger.

create index if not exists ix_cross_domain_tokens_token
  on public.auth_cross_domain_tokens (token)
  where consumed_at is null;

-- Index utilisé par le job de purge et l'audit.
create index if not exists ix_cross_domain_tokens_user_id
  on public.auth_cross_domain_tokens (user_id);

-- Index pour la purge des tokens expirés non consommés.
create index if not exists ix_cross_domain_tokens_expires
  on public.auth_cross_domain_tokens (expires_at)
  where consumed_at is null;

-- =====================================================================
-- 3. RLS strict
-- =====================================================================
-- Aucun client utilisateur ne doit lire ou écrire cette table : seuls les
-- routes API qui utilisent createSupabaseAdminClient (service_role bypass
-- RLS) y ont accès. RLS activé sans policy = deny-all par défaut.

alter table public.auth_cross_domain_tokens enable row level security;

-- Aucune policy n'est créée. service_role bypass RLS. Tout autre rôle
-- (anon / authenticated) verra une table vide.

-- =====================================================================
-- 4. Fonction de purge
-- =====================================================================
-- Supprime les tokens consommés ou expirés depuis plus d'1h. Le buffer
-- d'1h permet l'audit en cas de tentative d'attaque (analyse a posteriori
-- des IP / User-Agent suspects). Au-delà, suppression physique pour ne
-- pas accumuler indéfiniment.
--
-- À appeler via cron Supabase (pg_cron) ou edge function planifiée. Pour
-- l'instant, la fonction existe mais n'est pas planifiée — Laurent peut
-- la planifier manuellement plus tard si nécessaire (faible volume
-- attendu en pratique : <100 tokens/jour pour 1 super_admin).

create or replace function public.purge_cross_domain_tokens()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_deleted integer;
begin
  delete from public.auth_cross_domain_tokens
   where (consumed_at is not null and consumed_at < now() - interval '1 hour')
      or (expires_at < now() - interval '1 hour');
  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

revoke all on function public.purge_cross_domain_tokens() from public;
revoke all on function public.purge_cross_domain_tokens() from anon;
revoke all on function public.purge_cross_domain_tokens() from authenticated;

-- =====================================================================
-- 5. Audit (optionnel — pas de trigger pour réduire la latence)
-- =====================================================================
-- Décision : pas de trigger d'audit_log sur cette table. Raison :
--   1. La route /consume écrit déjà un INSERT consumed_at = now(), donc
--      la trace existe en BD (jusqu'à la purge).
--   2. L'audit_log GOUVERNANCE §6 cible les écritures pédagogiques
--      (annotations, overrides). Les tokens sont infrastructure auth, pas
--      contenu pédagogique.
--   3. Coût de latence évité sur le hot path /consume.
--
-- Si une analyse forensique est nécessaire, la table elle-même contient
-- assez d'information (IP, User-Agent, source/target hosts, timestamps).

commit;
