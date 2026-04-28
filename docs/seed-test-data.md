# Seed des données de test — Phase E

> ⚠️ **Preview-only.** Ce seed refuse de s'exécuter sur la prod
> (`zefkltkiigxkjcrdesrk`). Il est destiné à un projet Supabase preview
> (branch DB ou projet dédié) avant les sprints E.3 → E.8.

## Quand l'utiliser

Avant un sprint Phase E qui doit être testé manuellement ou en e2e :

- E.3 — extension de l'édition admin aux derniers champs MDX
- E.4 — lecture des annotations côté élève (pattern post-it)
- E.5 — scope `student`
- E.6 — audit log + notifications super_admin
- E.7 — différenciation visuelle super_admin

L'audit Phase E du 28 avril 2026 a constaté que les tables
`memberships`, `classes`, `class_enrollments`, `student_profiles` et
`teacher_annotations` sont vides en preview. Sans ce seed, aucun flux
end-to-end n'est testable.

## Données posées

| Couche | Quantité | Détail |
|---|---:|---|
| `auth.users` | 3 | `prof.test@test.local`, `eleve1.test@test.local`, `eleve2.test@test.local` (emails confirmés) |
| `memberships` | 1 | prof → organisation Tazieff (rôle `teacher`, status `active`) |
| `classes` | 1 | « Classe de test 2nde A », `join_code` généré via `generate_class_join_code()` |
| `student_profiles` | 2 | Élève Un, Élève Deux |
| `class_enrollments` | 2 | les 2 élèves dans la classe de test |
| `teacher_annotations` | 3 | sur l'exercice `s1-01` (FR), une par scope : `private`, `class`, `school` |

L'organisation `TAZIEFF2026` (Lycée Haroun Tazieff) est supposée déjà
présente sur le projet preview (posée par les migrations P0.x). Si elle
n'existe pas, le seed s'arrête avec un message explicite.

## Prérequis

1. **Un projet Supabase preview distinct** de la prod. Si tu n'en as
   pas encore, crée une branche DB ou un nouveau projet, puis applique
   toutes les migrations (`supabase db push`).
2. La service-role key du projet preview.
3. La variable `SEED_ALLOW=preview-test` posée explicitement (garde
   anti-accident).

## Garde preview-only — comment ça marche

Le helper `scripts/seed/guard.ts` exige **simultanément** :

- `SUPABASE_URL` (ou `NEXT_PUBLIC_SUPABASE_URL`) défini
- L'URL ne contient **aucun** des `project_ref` listés dans
  `PROD_PROJECT_REFS` (actuellement `zefkltkiigxkjcrdesrk`)
- `SEED_ALLOW=preview-test`
- `SUPABASE_SERVICE_ROLE_KEY` défini

Toute violation lève une erreur explicite et le script s'arrête avant
toute écriture en BD. Si tu ajoutes plus tard un nouveau projet de
production, pense à étendre `PROD_PROJECT_REFS` dans `guard.ts`.

## Exécution du seed

```bash
SEED_ALLOW=preview-test \
SUPABASE_URL=https://<preview-project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<preview-service-role-key> \
npm run seed:phase-e
```

Le script est idempotent — relancer le seed met à jour les annotations
existantes plutôt que d'en créer des doublons. Il imprime à la fin un
JSON contenant les UUIDs créés (utile pour debugger un test e2e).

## Cleanup

Pour repartir d'un état propre (par exemple après un test cassé qui
laisse des données orphelines) :

```bash
SEED_ALLOW=preview-test \
SUPABASE_URL=https://<preview-project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<preview-service-role-key> \
npm run seed:cleanup
```

Le cleanup supprime dans l'ordre annotations → enrollments →
student_profiles → classes → memberships → `auth.users`. Tous les users
dont l'email finit par `@test.local` sont retirés.

## À ne pas faire

- ❌ Lancer le seed avec l'URL prod (refus automatique de la garde,
  mais ne tente même pas).
- ❌ Committer un fichier `.env` ou des credentials du projet preview.
- ❌ Modifier `PROD_PROJECT_REFS` pour contourner la garde — toute
  ajout/retrait à cette liste doit passer par PR explicite.
- ❌ Étendre le seed avec de la donnée pédagogique « réaliste » (texte
  d'élève, annotations sensibles, etc.) — c'est un seed de test, pas
  une démo client.

## Références

- `GOUVERNANCE_EDITORIALE.md` v1.1 §3.2 (rendu post-it côté élève)
- `ROADMAP_PHASE_E_REVISEE.md` (sprints E.3 → E.8)
- Rapport d'audit Phase E du 28 avril 2026 (PARTIE 6)
- `supabase/seeds/e2_1_seed_users.ts` — seed alternatif plus large
  (3 profs / 2 organisations / 4 classes), usage dev local
