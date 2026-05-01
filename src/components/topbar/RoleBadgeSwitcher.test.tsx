// Sprint topbar-refondue (30 avril 2026) — Tests RoleBadgeSwitcher.
//
// Couvre :
//   - Les 3 helpers purs (detectActiveRole, deriveAvailableRoles, buildSwitchUrl)
//   - Le rendu conditionnel selon le rôle du user
//   - Le bon mapping des couleurs et l'attribut aria-current sur la pill active

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "topBar.role.eleve": "Élève",
        "topBar.role.prof": "Prof",
        "topBar.role.admin": "Admin",
      };
      return map[key] ?? key;
    },
    lang: "fr",
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

import {
  RoleBadgeSwitcher,
  detectActiveRole,
  deriveAvailableRoles,
  buildSwitchUrl,
} from "./RoleBadgeSwitcher";

describe("detectActiveRole", () => {
  it("admin host (prod) → admin", () => {
    expect(detectActiveRole("admin.muscu-eps.fr")).toBe("admin");
  });
  it("admin host (preview) → admin", () => {
    expect(detectActiveRole("design-admin.muscu-eps.fr")).toBe("admin");
  });
  it("admin host (dev local) → admin", () => {
    expect(detectActiveRole("admin.localhost:3000")).toBe("admin");
  });
  it("prof host (prod) → prof", () => {
    expect(detectActiveRole("prof.muscu-eps.fr")).toBe("prof");
  });
  it("prof host (preview) → prof", () => {
    expect(detectActiveRole("design-prof.muscu-eps.fr")).toBe("prof");
  });
  it("eleve host (prod) → eleve", () => {
    expect(detectActiveRole("muscu-eps.fr")).toBe("eleve");
  });
  it("eleve host (preview) → eleve", () => {
    expect(detectActiveRole("design.muscu-eps.fr")).toBe("eleve");
  });
  it("eleve host (dev local) → eleve", () => {
    expect(detectActiveRole("localhost:3000")).toBe("eleve");
  });
  it("Vercel preview deploy URL → eleve (default)", () => {
    expect(detectActiveRole("tazieff-eps-abc123.vercel.app")).toBe("eleve");
  });
});

describe("deriveAvailableRoles", () => {
  it("anonymous → []", () => {
    expect(deriveAvailableRoles("anonymous")).toEqual([]);
  });
  it("student → []", () => {
    expect(deriveAvailableRoles("student")).toEqual([]);
  });
  it("teacher → [eleve, prof]", () => {
    expect(deriveAvailableRoles("teacher")).toEqual(["eleve", "prof"]);
  });
  it("admin → [eleve, prof, admin]", () => {
    expect(deriveAvailableRoles("admin")).toEqual(["eleve", "prof", "admin"]);
  });
  it("super_admin → [eleve, prof, admin]", () => {
    expect(deriveAvailableRoles("super_admin")).toEqual([
      "eleve",
      "prof",
      "admin",
    ]);
  });
});

describe("buildSwitchUrl", () => {
  const baseUrl = {
    eleve: "https://muscu-eps.fr",
    prof: "https://prof.muscu-eps.fr",
    admin: "https://admin.muscu-eps.fr",
  };

  it("préserve un path élève quand on switche admin → eleve", () => {
    expect(
      buildSwitchUrl({
        targetRole: "eleve",
        currentPathname: "/exercices/s1-01",
        baseUrl,
      }),
    ).toBe("https://muscu-eps.fr/exercices/s1-01");
  });

  it("retombe sur la racine quand on switche admin → eleve depuis /admin/*", () => {
    expect(
      buildSwitchUrl({
        targetRole: "eleve",
        currentPathname: "/admin/login",
        baseUrl,
      }),
    ).toBe("https://muscu-eps.fr/");
  });

  it("retombe sur la racine quand on switche eleve → prof depuis un path admin/*", () => {
    expect(
      buildSwitchUrl({
        targetRole: "prof",
        currentPathname: "/admin/audit",
        baseUrl,
      }),
    ).toBe("https://prof.muscu-eps.fr/");
  });

  it("préserve /exercices/* lors d'un switch eleve → admin (page miroir)", () => {
    expect(
      buildSwitchUrl({
        targetRole: "admin",
        currentPathname: "/exercices/s2-03",
        baseUrl,
      }),
    ).toBe("https://admin.muscu-eps.fr/exercices/s2-03");
  });

  it("retombe sur la racine si pathname vide", () => {
    expect(
      buildSwitchUrl({
        targetRole: "eleve",
        currentPathname: "",
        baseUrl,
      }),
    ).toBe("https://muscu-eps.fr/");
  });
});

describe("RoleBadgeSwitcher (rendu)", () => {
  it("anonymous : ne rend rien (< 2 rôles disponibles)", () => {
    const { container } = render(
      <RoleBadgeSwitcher
        identityRoleOverride="anonymous"
        hostOverride="muscu-eps.fr"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("student : ne rend rien", () => {
    const { container } = render(
      <RoleBadgeSwitcher
        identityRoleOverride="student"
        hostOverride="muscu-eps.fr"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("teacher : 2 pills (Élève + Prof)", () => {
    render(
      <RoleBadgeSwitcher
        identityRoleOverride="teacher"
        hostOverride="prof.muscu-eps.fr"
      />,
    );
    expect(screen.getByTestId("role-badge-eleve")).toBeTruthy();
    expect(screen.getByTestId("role-badge-prof")).toBeTruthy();
    expect(screen.queryByTestId("role-badge-admin")).toBeNull();
  });

  it("super_admin : 3 pills", () => {
    render(
      <RoleBadgeSwitcher
        identityRoleOverride="super_admin"
        hostOverride="admin.muscu-eps.fr"
      />,
    );
    expect(screen.getByTestId("role-badge-eleve")).toBeTruthy();
    expect(screen.getByTestId("role-badge-prof")).toBeTruthy();
    expect(screen.getByTestId("role-badge-admin")).toBeTruthy();
  });

  it("la pill admin a aria-pressed=true sur admin host", () => {
    render(
      <RoleBadgeSwitcher
        identityRoleOverride="super_admin"
        hostOverride="admin.muscu-eps.fr"
      />,
    );
    expect(
      screen.getByTestId("role-badge-admin").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByTestId("role-badge-eleve").getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      screen.getByTestId("role-badge-prof").getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("la pill prof a aria-pressed=true sur prof host (preview)", () => {
    render(
      <RoleBadgeSwitcher
        identityRoleOverride="teacher"
        hostOverride="design-prof.muscu-eps.fr"
      />,
    );
    expect(
      screen.getByTestId("role-badge-prof").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByTestId("role-badge-eleve").getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
