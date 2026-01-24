[Docs Codex](docs/CODEX.md)

# tazieff-eps

## Docs

- Regles Codex: [docs/CODEX.md](docs/CODEX.md)

## Référence projet

- Règle CMS-ready: [docs/REFERENCE_APP_EPS.md](docs/REFERENCE_APP_EPS.md)

## Dev live (obligatoire pour les sessions Codex)

- Node supporte: 20.9–22.x (Next.js 16 demande Node >= 20.9).
- Recommande: Node 20 LTS si la CI est verrouillee sur une version fixe.
- Lancer et garder actif: `npm run dev` (127.0.0.1:3000 et localhost)
- Une verification Node est lancee automatiquement avant le dev server.
- En dev, pas de Service Worker pour eviter le cache.
- Ne PAS utiliser `npm start` pour iterer (reserve au test prod local apres build)
- Apres chaque changement: verifier que localhost repond et faire un smoke test:
  - `curl.exe -I --max-time 20 http://127.0.0.1:3000` -> 200/3xx
  - GET `/exos` -> 200
  - GET `/exos/<slug_existant>` -> 200
  - GET `/seances/<slug_existant>` -> 200
- Le compte rendu doit contenir: "✅ Local dev OK (127.0.0.1:3000) + routes testees"
- Si le port ecoute mais que curl timeout: arreter Node sur 3000, supprimer `.next`, relancer `npm run dev`.
- Si HMR ne reagit pas (WSL/FS): proposer `WATCHPACK_POLLING=true` dans `.env.local`.
