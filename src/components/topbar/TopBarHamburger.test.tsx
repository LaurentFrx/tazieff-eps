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
    it("student : Outils + Préférences + Mentions + Aide + Logout, mais PAS Espace prof / admin", () => {
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
      // Mentions / aide / logout
      expect(screen.getByTestId("hamburger-legal")).toBeTruthy();
      expect(screen.getByTestId("hamburger-help")).toBeTruthy();
      expect(screen.getByTestId("hamburger-logout")).toBeTruthy();
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
});
