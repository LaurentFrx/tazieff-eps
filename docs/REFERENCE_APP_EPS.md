# Référence projet

## Règle CMS-ready (non négociable) 🧱

### Définition
Le contenu doit rester administrable plus tard via un CMS Git-based (ex: Keystatic) sans refonte. La source de vérité du contenu est le repo Git (fichiers MDX + médias), pas du code ni une base.

### Invariants (interdits de déviation)
1) **Contenu = fichiers**  
   - Tous les contenus éditoriaux restent dans `content/**` (MDX) et médias dans `public/media/**`.  
   - Interdit de déplacer/renommer massivement ces chemins sans validation explicite.

2) **Frontmatter stable et “CMS-friendly”**  
   - Le frontmatter doit rester **simple** : primitives + listes, objets peu profonds (éviter structures complexes imbriquées).  
   - Toute évolution du schéma doit être **rétrocompatible** (ajout de champs optionnels OK ; renommer/supprimer un champ = interdit sans plan de migration validé).

3) **Pas de contenu “codé”**  
   - Interdit d’encoder du contenu dans du TS/JSON hardcodé dans l’app (ex: gros tableaux d’exos dans `src/`), sauf index généré automatiquement à partir de `content/**`.

4) **Pas de dépendance à une DB pour le contenu**  
   - Interdit d’introduire Supabase/Firebase/DB pour les fiches/séances/notions dans cette phase. (OK uniquement pour analytics/logs plus tard, séparé du contenu.)

5) **Lecture seule côté app**  
   - L’app Tazieff ne doit pas “éditer/écrire” les MDX en production. (Admin/édition = plus tard via CMS dédié.)

6) **Indexation dérivée du contenu**  
   - Recherche/filtres doivent s’appuyer sur un index build-time ou server cached dérivé de `content/**`.  
   - Interdit de maintenir un index “à la main” divergant du contenu.

7) **Présentation découplée du contenu**  
   - Les composants UI peuvent évoluer, mais les fichiers MDX doivent rester valides et rendables avec une whitelist de composants (si utilisée).  
   - Éviter d’ajouter des imports/JS arbitraires dans MDX.

### “CMS-ready gate” (à appliquer à chaque PR)
Avant de valider une modification, répondre OUI à ces 3 questions :
- (1) Un CMS Git-based pourra-t-il éditer ce contenu sans refonte ni migration lourde ? ✅
- (2) Le schéma frontmatter reste-t-il rétrocompatible ? ✅
- (3) Le contenu reste-t-il dans `content/**` et les médias dans `public/media/**` ? ✅

Si une réponse est NON → ne pas implémenter, proposer une alternative rétrocompatible.

## Supabase — RLS sur media_assets

### Contexte
Security Advisor signale que la table `public.media_assets` est exposée via PostgREST avec RLS désactivée.

### Décision (Option B)
Le client (browser) lit `public.media_assets` via la clé anon (ex: `ExerciseLiveDetail.tsx`), donc on active RLS **et** on ajoute une policy SELECT pour les rôles `anon` et `authenticated`.

### SQL à exécuter dans Supabase
```sql
alter table public.media_assets enable row level security;
create policy "media_assets_select_public"
on public.media_assets
for select
to anon, authenticated
using (true);
```

### Notes
- Les routes API côté serveur utilisent le service role → bypass RLS, donc pas d'impact.
- Si besoin de restreindre plus tard: remplacer `using (true)` par des règles (ex: stockage privé + signed URLs, policy par bucket/ownership).
