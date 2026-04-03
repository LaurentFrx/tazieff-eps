Exécute dans l'ordre :
1. npm run build — si erreur, corrige et rebuild
2. npm test — si régression, corrige et retest
3. Skills sync — compare les fichiers modifiés (git diff --name-only HEAD) aux skills dans .claude/skills/. Si une skill couvre un domaine impacté, relis le SKILL.md correspondant et mets-le à jour si le contenu est devenu incorrect ou incomplet. Ne touche pas aux skills non concernées.
4. git add -A && git commit -m "$ARGUMENTS" && git push
Termine par SHIPPED.