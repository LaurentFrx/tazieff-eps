# supabase/ — CLI local, migrations, seeds, tests

Dossier versionné qui contient :
- **`migrations/`** — fichiers SQL horodatés (convention `YYYYMMDDHHMMSS_description.sql`), appliqués dans l'ordre côté remote.
- **`seeds/`** — données de développement (SQL + scripts TS). Ne JAMAIS appliquer en prod.
- **`tests/`** — tests pgTAP exécutés en CI ou manuellement via `supabase test db`.

## Setup local (une fois par dev)

```bash
# 1. Générer un token personnel
#    → https://supabase.com/dashboard/account/tokens
# 2. L'exporter ou le mettre dans .env.local (gitignored)
echo 'SUPABASE_ACCESS_TOKEN=sbp_xxx' >> .env.local
export $(grep -v '^#' .env.local | xargs)

# 3. Linker (une fois)
npx supabase link --project-ref zefkltkiigxkjcrdesrk
```

## Scripts npm utiles

| Script | Effet |
|---|---|
| `npm run db:migration-list` | Compare migrations locales ↔ remote (pas besoin de Docker) |
| `npm run db:diff` | Diff schéma local ↔ remote (**nécessite Docker**) |
| `npm run db:push` | Applique les migrations locales non appliquées sur remote |
| `npm run db:pull` | Récupère le schéma remote vers une nouvelle migration locale |
| `npm run db:types` | Régénère `src/types/database.ts` depuis le remote |
| `npm run db:new-migration <nom>` | Crée un nouveau fichier de migration horodaté |
| `npm run db:reset` | **⚠️ destructif** — reset la DB locale et rejoue toutes les migrations |
| `npm run db:seed` | Exécute `supabase/seeds/e2_1_seed_users.ts` (dev-only, guard NODE_ENV) |

## Alternative : MCP Supabase (sans CLI)

Le MCP Supabase configuré dans `.claude/` fournit des outils équivalents (`apply_migration`, `generate_typescript_types`, `list_tables`, etc.) sans nécessiter Docker ni CLI. Utile pour Claude Code.

## Conventions

- **Migrations atomiques** : chaque fichier wrap `begin; ... commit;` pour rollback auto.
- **Idempotence** : `create table if not exists`, `create or replace function`, `drop policy if exists` avant `create policy`.
- **RLS** : toujours `(select auth.uid())`, jamais `auth.uid()` direct. Toujours `to authenticated`. Colonnes RLS systématiquement indexées.
- **Soft delete** : colonne `deleted_at timestamptz` sauf relations N-N pures.
- **Secrets** : `supabase/seeds/dev-credentials.json` est gitignored. Le seed script TS le regénère à chaque exécution.
