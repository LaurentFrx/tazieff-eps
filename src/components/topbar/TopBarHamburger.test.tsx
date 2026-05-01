// Sprint topbar-refondue (30 avril 2026) — Tests TopBarHamburger.
//
// Couvre :
//   - Ouverture/fermeture (bouton, ESC, click outside)
//   - Sections affichées selon le rôle (Outils + Préférences toujours,
//     Espace prof si teacher+, Espace admin si super_admin uniquement)
//   - Logout déclenche signOut Supabase

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const signOutMock = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signOut: signOutMock,
    },
  }),
}));

const setLangMock = vi.fn();

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: "fr",
    setLang: setLangMock,
  }),
}));

vi.mock("@/lib/auth/IdentityContext", async () => {
  const actual =
    await vi.importActual<
      typeof import("@/lib/auth/IdentityContext")
    >("@/lib/auth/IdentityContext");
  return {
    ...actual,
    useIdentity: () => ({
      user: null,
      role: "anonymous",
      isLoading: false,
      mode: "eleve",
      isSuperAdmin: false,
      isAdmin: false,
      isAcademic: false,
    }),
  };
});

// Sprint fix-topbar-badges — useAppAdmin via useEffectiveRole : mocké pour
// éviter le fetch réseau /api/me/role pendant les tests jsdom.
vi.mock("@/hooks/useAppAdmin", () => ({
  useAppAdmin: () => ({
    isAdmin: false,
    isSuperAdmin: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    [k: string]: unknown;
  }) => (
    <a
      href={typeof href === "string" ? href : "#"}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import { TopBarHamburger } from "./TopBarHamburger";

beforeEach(() => {
  signOutMock.mockReset();
  signOutMock.mockResolvedValue({ data: {}, error: null });
  setLangMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TopBarHamburger", () => {
  it("rend le bouton hamburger fermé par défaut", () => {
    render(<TopBarHamburger identityRoleOverride="student" />);
    const btn = screen.getByTestId("topbar-hamburger-button");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByTestId("topbar-hamburger-panel")).toBeNull();
  });

  it("clic sur le bouton ouvre le panneau", () => {
    render(<TopBarHamburger identityRoleOverride="student" />);
    fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
    expect(screen.getByTestId("topbar-hamburger-panel")).toBeTruthy();
  });

  it("ESC ferme le panneau", () => {
    render(<TopBarHamburger identityRoleOverride="student" />);
    fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("topbar-hamburger-panel")).toBeNull();
  });

  describe("contenu par rôle", () => {
    it("student : Outils + Préférences + Mentions + Logout, mais PAS Aide / Espace prof / admin / SignIn", () => {
      render(<TopBarHamburger identityRoleOverride="student" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
      // Outils (toujours présents)
      expect(screen.getByTestId("hamburger-tool-timer")).toBeTruthy();
      expect(screen.getByTestId("hamburger-tool-rm")).toBeTruthy();
      expect(screen.getByTestId("hamburger-tool-session")).toBeTruthy();
      expect(screen.getByTestId("hamburger-tool-notebook")).toBeTruthy();
      // Préférences (toujours présentes)
      expect(screen.getByTestId("hamburger-lang-fr")).toBeTruthy();
      expect(screen.getByTestId("hamburger-theme-static")).toBeTruthy();
      // Mentions / logout présents
      expect(screen.getByTestId("hamburger-legal")).toBeTruthy();
      expect(screen.getByTestId("hamburger-logout")).toBeTruthy();
      // Sprint fix-hamburger-anonymous-login (1er mai 2026) :
      // - "Aide" supprimé pour tous les rôles
      // - "Se connecter" caché pour les utilisateurs authentifiés
      expect(screen.queryByTestId("hamburger-help")).toBeNull();
      expect(screen.queryByTestId("hamburger-signin-teacher")).toBeNull();
      expect(screen.queryByTestId("hamburger-signin-admin")).toBeNull();
      // Espaces avancés ABSENTS
      expect(screen.queryByTestId("hamburger-teacher-dashboard")).toBeNull();
      expect(screen.queryByTestId("hamburger-admin-home")).toBeNull();
    });

    it("teacher : Espace prof présent, Espace admin absent", () => {
      render(<TopBarHamburger identityRoleOverride="teacher" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
      expect(screen.getByTestId("hamburger-teacher-dashboard")).toBeTruthy();
      expect(screen.getByTestId("hamburger-teacher-classes")).toBeTruthy();
      expect(screen.getByTestId("hamburger-teacher-annotations")).toBeTruthy();
      expect(screen.getByTestId("hamburger-teacher-profile")).toBeTruthy();
      expect(screen.queryByTestId("hamburger-admin-home")).toBeNull();
    });

    it("admin : Espaces prof + admin présents", () => {
      render(<TopBarHamburger identityRoleOverride="admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
      expect(screen.getByTestId("hamburger-teacher-dashboard")).toBeTruthy();
      expect(screen.getByTestId("hamburger-admin-home")).toBeTruthy();
      expect(screen.getByTestId("hamburger-admin-dashboard")).toBeTruthy();
      expect(screen.getByTestId("hamburger-admin-audit")).toBeTruthy();
      expect(screen.getByTestId("hamburger-admin-orgs")).toBeTruthy();
    });

    it("super_admin : tout est présent (idem admin)", () => {
      render(<TopBarHamburger identityRoleOverride="super_admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
      expect(screen.getByTestId("hamburger-teacher-dashboard")).toBeTruthy();
      expect(screen.getByTestId("hamburger-admin-home")).toBeTruthy();
    });
  });

  it("clic sur Logout appelle signOut Supabase", async () => {
    render(<TopBarHamburger identityRoleOverride="student" />);
    fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
    fireEvent.click(screen.getByTestId("hamburger-logout"));
    // signOut est async, on attend la microtâche
    await Promise.resolve();
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("clic sur une langue inactive appelle setLang", () => {
    render(<TopBarHamburger identityRoleOverride="student" />);
    fireEvent.click(screen.getByTestId("topbar-hamburger-button"));
    fireEvent.click(screen.getByTestId("hamburger-lang-en"));
    expect(setLangMock).toHaveBeenCalledWith("en");
  });

  // Sprint fix-topbar-badges (30 avril 2026) — BUG 3 : les liens outils,
  // mentions légales et aide doivent être des URLs ABSOLUES vers le
  // sous-domaine élève. Sinon, depuis admin.muscu-eps.fr ou prof.muscu-eps.fr,
  // ils retournent 404 (ces paths ne sont pas dans ADMIN_MIRROR_PREFIXES).
  describe("URLs absolues cross-host (BUG 3)", () => {
    const originalLocation = Object.getOwnPropertyDescriptor(
      window,
      "location",
    );

    afterEach(() => {
      if (originalLocation) {
        Object.defineProperty(window, "location", originalLocation);
      }
    });

    function setLocationHost(host: string) {
      const protocol = host.includes("localhost") ? "http:" : "https:";
      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: {
          ...window.location,
          host,
          hostname: host.split(":")[0],
          protocol,
          origin: `${protocol}//${host}`,
        },
      });
    }

    it("sur admin.muscu-eps.fr, les liens outils pointent en absolu vers muscu-eps.fr", () => {
      setLocationHost("admin.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      const timer = screen.getByTestId("hamburger-tool-timer");
      expect(timer.getAttribute("href")).toBe(
        "https://muscu-eps.fr/outils/timer",
      );
      const rm = screen.getByTestId("hamburger-tool-rm");
      expect(rm.getAttribute("href")).toBe(
        "https://muscu-eps.fr/outils/calculateur-rm",
      );
      const session = screen.getByTestId("hamburger-tool-session");
      expect(session.getAttribute("href")).toBe(
        "https://muscu-eps.fr/outils/ma-seance",
      );
      const notebook = screen.getByTestId("hamburger-tool-notebook");
      expect(notebook.getAttribute("href")).toBe(
        "https://muscu-eps.fr/outils/carnet",
      );
    });

    it("sur design-admin.muscu-eps.fr (preview), les liens outils pointent vers design.muscu-eps.fr", () => {
      setLocationHost("design-admin.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      const timer = screen.getByTestId("hamburger-tool-timer");
      expect(timer.getAttribute("href")).toBe(
        "https://design.muscu-eps.fr/outils/timer",
      );
    });

    it("Mentions légales en URL absolue vers le baseUrl élève (Aide supprimée Sprint 1er mai)", () => {
      setLocationHost("admin.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      const legal = screen.getByTestId("hamburger-legal");
      expect(legal.getAttribute("href")).toBe(
        "https://muscu-eps.fr/legal/mentions-legales",
      );
      // Sprint fix-hamburger-anonymous-login : "Aide" supprimée du hamburger
      // (pointait vers /apprendre, pas une vraie page d'aide).
      expect(screen.queryByTestId("hamburger-help")).toBeNull();
    });

    it("Espace prof : liens vers prof.muscu-eps.fr en URL absolue", () => {
      setLocationHost("admin.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="super_admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      const dashboard = screen.getByTestId("hamburger-teacher-dashboard");
      expect(dashboard.getAttribute("href")).toBe(
        "https://prof.muscu-eps.fr/tableau-de-bord",
      );
    });

    it("Espace admin : liens vers admin.muscu-eps.fr en URL absolue", () => {
      setLocationHost("muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="super_admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      const audit = screen.getByTestId("hamburger-admin-audit");
      expect(audit.getAttribute("href")).toBe("https://admin.muscu-eps.fr/audit");
    });
  });

  // Sprint fix-hamburger-anonymous-login (1er mai 2026) — Test live tablette
  // Isabelle : un anonyme arrivant sur muscu-eps.fr n'a aucun moyen de se
  // connecter. Le hamburger gagne une section "Se connecter" + le bouton
  // logout est masqué (pas de session active à fermer).
  describe("anonyme : Se connecter + pas de logout", () => {
    const originalLocation = Object.getOwnPropertyDescriptor(
      window,
      "location",
    );

    afterEach(() => {
      if (originalLocation) {
        Object.defineProperty(window, "location", originalLocation);
      }
    });

    function setLocationHost(host: string) {
      const protocol = host.includes("localhost") ? "http:" : "https:";
      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: {
          ...window.location,
          host,
          hostname: host.split(":")[0],
          protocol,
          origin: `${protocol}//${host}`,
        },
      });
    }

    it("anonyme : section Se connecter rendue avec 2 liens", () => {
      setLocationHost("muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="anonymous" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      expect(screen.getByTestId("hamburger-signin-teacher")).toBeTruthy();
      expect(screen.getByTestId("hamburger-signin-admin")).toBeTruthy();
    });

    it("anonyme : URL absolue vers prof.muscu-eps.fr/connexion et admin.muscu-eps.fr/login", () => {
      setLocationHost("muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="anonymous" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      const teacher = screen.getByTestId("hamburger-signin-teacher");
      expect(teacher.getAttribute("href")).toBe(
        "https://prof.muscu-eps.fr/connexion",
      );
      const admin = screen.getByTestId("hamburger-signin-admin");
      expect(admin.getAttribute("href")).toBe(
        "https://admin.muscu-eps.fr/login",
      );
    });

    it("anonyme : URLs preview (design-prof / design-admin) en environnement preview", () => {
      setLocationHost("design.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="anonymous" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      expect(
        screen
          .getByTestId("hamburger-signin-teacher")
          .getAttribute("href"),
      ).toBe("https://design-prof.muscu-eps.fr/connexion");
      expect(
        screen.getByTestId("hamburger-signin-admin").getAttribute("href"),
      ).toBe("https://design-admin.muscu-eps.fr/login");
    });

    it("anonyme : le bouton Se déconnecter est masqué", () => {
      setLocationHost("muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="anonymous" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      expect(screen.queryByTestId("hamburger-logout")).toBeNull();
    });

    it("student : pas de section Se connecter (utilisateur déjà authentifié)", () => {
      setLocationHost("muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="student" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      expect(screen.queryByTestId("hamburger-signin-teacher")).toBeNull();
      expect(screen.queryByTestId("hamburger-signin-admin")).toBeNull();
    });

    it("teacher : pas de section Se connecter", () => {
      setLocationHost("prof.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="teacher" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      expect(screen.queryByTestId("hamburger-signin-teacher")).toBeNull();
      expect(screen.queryByTestId("hamburger-signin-admin")).toBeNull();
    });

    it("super_admin : pas de section Se connecter (déjà authentifié)", () => {
      setLocationHost("admin.muscu-eps.fr");
      render(<TopBarHamburger identityRoleOverride="super_admin" />);
      fireEvent.click(screen.getByTestId("topbar-hamburger-button"));

      expect(screen.queryByTestId("hamburger-signin-teacher")).toBeNull();
      expect(screen.queryByTestId("hamburger-signin-admin")).toBeNull();
    });
  });
});
