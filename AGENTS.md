# Règles de travail des agents

- Si la demande commence par "Recherche web" / "pricing" / "vérifie limites": produire UNIQUEMENT un résumé + liens sources dans un fichier markdown, SANS toucher au code, SANS commit.
- Si la demande implique du code: proposer un plan + liste de fichiers touchés AVANT de modifier, et attendre confirmation.
- Interdiction de modifier menus/routes existantes sauf demande explicite.
- Toujours exécuter `npm run lint` + `npm run build` avant commit.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` ou `TEACHER_PIN` côté client (pas de `NEXT_PUBLIC`).
