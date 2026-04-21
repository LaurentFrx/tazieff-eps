# Dette technique Tazieff EPS

Fichier de suivi des dettes techniques identifiées au fil des phases. Format :
`[PHASE-CIBLE tag] Description concise, fichiers concernés`.

- [E.2.5 dette tech] Migrer `/api/teacher/{exercise-override,live-exercise,upload-media}` de PIN+service_role vers auth Supabase + RLS. Routes actuellement en mode legacy PIN, cohabitent avec le nouveau système magic link (E.2.2).
- [E.2.3 cleanup] Nettoyer `src/app/[locale]/reglages/page.tsx:102` — `isAnonymous` destructuré mais jamais utilisé (dead destructuring).
- [E.2.3 unification] Évaluer migration de `src/components/TeacherAuth.tsx` (ancien flow `updateUser({email})` côté client) vers le nouveau `useTeacherAuth`/`signInWithOtp` pour unifier les deux chemins de signin.
