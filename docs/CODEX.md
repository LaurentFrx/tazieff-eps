# CODEX

## Regles de recherche (obligatoire)

- Interdiction de recherches globales. Ne jamais lancer de recherches en dehors du repo (pas de `rg` sur `C:\Users\...`, pas de `Get-ChildItem -Recurse` hors repo).
- Toute recherche doit etre strictement limitee au repo `tazieff-eps` et executee depuis la racine (cwd = racine).
- Utiliser des chemins internes au repo pour chaque recherche (ex: `rg "pattern" src` ou `rg "pattern" .`).
