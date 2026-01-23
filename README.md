# tazieff-eps

## Dev live (obligatoire pour les sessions Codex)

- Lancer et garder actif: `npm run dev`
- Ne PAS utiliser `npm start` pour itérer (réservé au test prod local après build)
- Après chaque changement: vérifier que localhost répond, et faire un smoke test:
  - GET `/exos` -> 200
  - GET `/exos/<slug_existant>` -> 200
  - GET `/seances/<slug_existant>` -> 200
- Le compte rendu doit contenir: "✅ Local dev OK (localhost:3000) + routes testées"
- Si HMR ne réagit pas (WSL/FS): proposer `WATCHPACK_POLLING=true` dans `.env.local`
