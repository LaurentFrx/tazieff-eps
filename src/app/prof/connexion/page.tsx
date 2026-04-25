// Phase E.2.2.5 — Page de connexion prof.
// URL publique : https://prof.muscu-eps.fr/connexion
// Path interne (via middleware rewrite) : src/app/prof/connexion/page.tsx
//
// Split responsive 50/50 en iPad landscape / desktop ; stack vertical en
// iPad portrait / mobile. Détails dans ConnexionLayout.module.css.

import ProLoginVisual from "@/components/auth/ProLoginVisual";
import ProLoginForm from "@/components/auth/ProLoginForm";
import styles from "./ConnexionLayout.module.css";

export const metadata = {
  title: "Connexion — Espace enseignant Tazieff EPS",
  description:
    "Connectez-vous avec votre email académique pour accéder à l'espace enseignant Tazieff EPS.",
};

export default function ConnexionPage() {
  return (
    <main className={styles.root}>
      <div className={styles.visual}>
        <ProLoginVisual />
      </div>
      <div className={styles.form}>
        <div className={styles.formInner}>
          <ProLoginForm />
        </div>
      </div>
    </main>
  );
}
