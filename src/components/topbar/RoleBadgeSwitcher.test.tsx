// Sprint topbar-refondue (30 avril 2026) — Tests RoleBadgeSwitcher.
//
// Couvre :
//   - Les 3 helpers purs (detectActiveRole, deriveAvailableRoles, buildSwitchUrl)
//   - Le rendu conditionnel selon le rôle du user
//   - Le bon mapping des couleurs et l'attribut aria-current sur la pill active
//
// Sprint C1 (1er mai 2026) — Tests étendus :
//   - Clic sur pill inactive → POST /api/auth/cross-domain/generate
//   - Réponse OK → navigation vers redirect_url
//   - Réponse 401/403 → fallback navigation directe (mode anonyme)

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

// Sprint fix-topbar-badges — useAppAdmin appelle fetch /api/me/role qui
// n'est pas joignable en jsdom. On le mock ici pour que useEffectiveRole
// retourne le rôle de useIdentity sans tenter de fetch réseau.
vi.mock("@/hooks/useAppAdmin", () => ({
  useAppAdmin: () => ({
    isAdmin: false,
    isSuperAdmin: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

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

// Sprint C1 (1er mai 2026) — Auto-login cross-domain.
//
// Au clic sur une pill inactive, le composant doit POSTer sur
// /api/auth/cross-domain/generate avec le target_host et target_path. Si la
// réponse contient redirect_url, on navigue dessus (auto-login). Sinon on
// retombe sur l'ancien comportement (navigation directe + login normal).

describe("RoleBadgeSwitcher (auto-login Sprint C1)", () => {
  // Sauvegarde et restauration de window.location et fetch.
  let originalFetch: typeof globalThis.fetch;
  let originalLocation: Location;
  // Typed explicitly : vi.fn() infère un type Mock non-callable directement,
  // alors qu'on veut une fonction qui prend un string et retourne void.
  let hrefSetter: ((value: string) => void) & {
    mock: { calls: [string][] };
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalLocation = window.location;
    hrefSetter = vi.fn() as unknown as typeof hrefSetter;

    // Mock window.location avec un getter/setter sur href + pathname/host
    // figés. jsdom ne permet pas de réassigner location directement, on
    // utilise defineProperty.
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        get href() {
          return "";
        },
        set href(value: string) {
          hrefSetter(value);
        },
        pathname: "/exercices/s1-01",
        host: "admin.muscu-eps.fr",
        protocol: "https:",
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it("clic sur pill inactive → POST /api/auth/cross-domain/generate avec body correct", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        redirect_url:
          "https://prof.muscu-eps.fr/api/auth/cross-domain/consume?token=abc&path=%2F",
      }),
    }) as unknown as typeof fetch;

    render(
      <RoleBadgeSwitcher
        identityRoleOverride="super_admin"
        hostOverride="admin.muscu-eps.fr"
        pathnameOverride="/exercices/s1-01"
      />,
    );

    const profPill = screen.getByTestId("role-badge-prof");
    fireEvent.click(profPill);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/auth/cross-domain/generate",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.target_host).toBe("prof.muscu-eps.fr");
    expect(body.target_path).toBe("/exercices/s1-01");

    await waitFor(() => {
      expect(hrefSetter).toHaveBeenCalledWith(
        "https://prof.muscu-eps.fr/api/auth/cross-domain/consume?token=abc&path=%2F",
      );
    });
  });

  it("réponse 401 → fallback navigation directe (anonyme)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthenticated" }),
    }) as unknown as typeof fetch;

    render(
      <RoleBadgeSwitcher
        identityRoleOverride="super_admin"
        hostOverride="admin.muscu-eps.fr"
        pathnameOverride="/exercices/s1-01"
      />,
    );

    fireEvent.click(screen.getByTestId("role-badge-prof"));

    await waitFor(() => {
      expect(hrefSetter).toHaveBeenCalled();
    });
    // Le fallback utilise buildSwitchUrl → URL prof + path préservé.
    expect(hrefSetter.mock.calls[0][0]).toBe(
      "https://prof.muscu-eps.fr/exercices/s1-01",
    );
  });

  it("clic sur pill ACTIVE → aucun fetch (no-op)", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    render(
      <RoleBadgeSwitcher
        identityRoleOverride="super_admin"
        hostOverride="admin.muscu-eps.fr"
      />,
    );

    fireEvent.click(screen.getByTestId("role-badge-admin"));

    // On laisse une frame pour s'assurer qu'aucun appel async n'a été fait.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("erreur réseau (fetch reject) → fallback navigation directe", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network error")) as unknown as typeof fetch;

    render(
      <RoleBadgeSwitcher
        identityRoleOverride="teacher"
        hostOverride="muscu-eps.fr"
        pathnameOverride="/methodes"
      />,
    );

    fireEvent.click(screen.getByTestId("role-badge-prof"));

    await waitFor(() => {
      expect(hrefSetter).toHaveBeenCalled();
    });
    expect(hrefSetter.mock.calls[0][0]).toBe(
      "https://prof.muscu-eps.fr/methodes",
    );
  });
});
