# Media upload MVP (mode prof)

## Table `media_assets`

```sql
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null unique,
  mime text not null,
  size int,
  width int,
  height int,
  created_at timestamptz default now(),
  created_by text,
  canonical_url text
);
```

## Storage bucket

- Bucket: `exercise-media`
- Écriture côté client interdite (upload uniquement via la route API teacher avec service role).
- Lecture:
  - MVP simple: bucket public + lecture publique.
  - Alternative: bucket privé + URLs signées (nécessite une adaptation côté resolver).

## Notes MVP

- Le patch JSON stocke uniquement `mediaId` (pas d'URL directe).
- Les URLs sont résolues via la table `media_assets` (canonical_url ou public URL).
