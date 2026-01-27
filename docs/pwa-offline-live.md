# PWA offline-first + LIVE (runtime Supabase)

## Installation (iOS)
1. Ouvrir le site dans Safari.
2. Appuyer sur le bouton Partager.
3. Choisir **Ajouter à l'écran d'accueil**.
4. Lancer l'app depuis l'icône installée.

## Offline: ce qui est garanti / non garanti (iOS)
- Garanti: l'app shell (_next/static, fonts, icônes) + les pages déjà consultées sont servies en cache.
- Garanti: les séances téléchargées via “Télécharger pour la séance” mettent en cache les fiches d'exercices.
- Non garanti: une route jamais visitée en offline peut renvoyer la page `/offline`.
- iOS peut évacuer le cache PWA si l'espace manque ou après une longue période d'inactivité.

## LIVE (runtime) vs MDX (Git)
- MDX = source officielle, versionnée dans Git.
- LIVE = runtime Supabase, lecture publique (anon), écriture prof via API serveur.
- `exercise_overrides` sert à corriger une fiche MDX existante.
- `live_exercises` sert à créer de nouvelles fiches non présentes dans Git.

### Structure des tables
```sql
create table if not exists public.exercise_overrides (
  slug text not null,
  locale text not null,
  patch_json jsonb not null,
  updated_at timestamptz default now(),
  primary key (slug, locale)
);

create table if not exists public.live_exercises (
  slug text not null,
  locale text not null,
  data_json jsonb not null,
  updated_at timestamptz default now(),
  primary key (slug, locale)
);
```

### RLS
```sql
alter table public.exercise_overrides enable row level security;
alter table public.live_exercises enable row level security;

create policy "public read overrides"
  on public.exercise_overrides for select
  using (true);

create policy "public read live"
  on public.live_exercises for select
  using (true);

create policy "no write overrides"
  on public.exercise_overrides for insert
  with check (false);

create policy "no update overrides"
  on public.exercise_overrides for update
  using (false);

create policy "no delete overrides"
  on public.exercise_overrides for delete
  using (false);

create policy "no write live"
  on public.live_exercises for insert
  with check (false);

create policy "no update live"
  on public.live_exercises for update
  using (false);

create policy "no delete live"
  on public.live_exercises for delete
  using (false);
```

### Env vars
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TEACHER_PIN=
```

### Forme des données LIVE
- `exercise_overrides.patch_json` applique des corrections de sections sur le Markdown.
  - Exemple :
    ```json
    {
      "sections": {
        "Consignes": "- Nouvelle consigne",
        "Erreurs fréquentes": "- Correction"
      }
    }
    ```
  - Règle: chaque clé = titre de section `##`. Le contenu remplace la section existante.
  - Si la section n'existe pas, elle est ajoutée en fin de fiche.
- `live_exercises.data_json` :
  ```json
  {
    "frontmatter": {
      "title": "...",
      "slug": "...",
      "tags": ["..."],
      "level": "debutant",
      "themeCompatibility": [1,2],
      "muscles": ["..."],
      "equipment": ["..."],
      "media": "/images/exos/..."
    },
    "content": "## Consignes\n- ..."
  }
  ```

## Limites Supabase Free (pertinentes)
- Projets Free mis en pause après 1 semaine d'inactivité.
- 500 MB base de données par projet.
- 5 GB egress + 5 GB cached egress.
- 1 GB file storage.
- Realtime: 200 connexions simultanées, 100 messages/sec, 100 joins/sec, 100 channels/connection.
- Realtime quota: 2 millions de messages inclus.

## Recommandations
- Privilégier Realtime plutôt que polling (polling 10–30s seulement).
- Ne pas abuser des abonnements multi-canaux.
- Garder les payloads compacts (patchs ciblés).
