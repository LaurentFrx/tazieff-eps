# Règles de travail des agents

## NON-NEGOTIABLES

Interdictions absolues:
- Ne pas modifier routes/menus/navigation.
- Ne pas toucher PWA/Serwist/SW.
- Ne pas ajouter de dépendances.
- Ne pas modifier Supabase ni ses env vars.
- Maximum 5 fichiers modifiés.
- Un seul commit pour la mission.
- Toute action hors périmètre = STOP.

Format d’affichage exact:
`<envLabel> · v<appVersion> · <gitShaShort> · <buildTimeLocal>`

- Obligation de relire AGENTS.md à chaque session
- Interdictions absolues ci-dessus
- Format d’affichage exact ci-dessus
- Limite 5 fichiers / 1 commit
- STOP si une étape impose de sortir du périmètre

- Si la demande commence par "Recherche web" / "pricing" / "vérifie limites": produire UNIQUEMENT un résumé + liens sources dans un fichier markdown, SANS toucher au code, SANS commit.
- Si la demande implique du code: proposer un plan + liste de fichiers touchés AVANT de modifier, et attendre confirmation.
- Interdiction de modifier menus/routes existantes sauf demande explicite.
- Toujours exécuter `npm run lint` + `npm run build` avant commit.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` ou `TEACHER_PIN` côté client (pas de `NEXT_PUBLIC`).
