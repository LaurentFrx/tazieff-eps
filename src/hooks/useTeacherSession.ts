"use client";

// Phase E.2.2.5 + Sprint P0.8 + Sprint A3 — Hook d'auth prof.
//
// Sprint A3 — Le hook délègue désormais à `useTeacherSession()` du module
// `@/lib/auth/sessions` (source unique pour les sessions par mode). Ce
// fichier reste un alias de compat pour ne pas casser les imports
// historiques :
//   - src/components/teacher/TeacherHeader.tsx
//   - src/components/auth/ProLoginForm.tsx
//   - src/app/prof/dev/login/TeacherLoginDevClient.tsx
//
// Le type TeacherSignInResult est exporté depuis `@/lib/auth/sessions`
// (anciennement dans le hook zombie useTeacherAuth.ts, supprimé en A3).
//
// Nouveau code : importer directement depuis `@/lib/auth/sessions`.

export {
  useTeacherSession,
  type TeacherSignInResult,
  type TeacherSession as TeacherSessionState,
} from "@/lib/auth/sessions";
