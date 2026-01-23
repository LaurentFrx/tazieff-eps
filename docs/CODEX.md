# CODEX

## Interdiction de recherches globales (anti-iCloud)

- Ne jamais lancer rg sur `C:\Users\...` ni sur un disque.
- Toujours executer depuis la racine du repo.
- Limiter rg a des chemins du repo: `rg "motif" src docs README.md package.json`
- Exemple interdit: `rg "motif" C:\Users\...`

## Regles de recherche (obligatoire)

- Toute recherche doit etre strictement limitee au repo `tazieff-eps`.
- Utiliser des chemins internes au repo pour chaque recherche (ex: `rg "pattern" src` ou `rg "pattern" .`).
