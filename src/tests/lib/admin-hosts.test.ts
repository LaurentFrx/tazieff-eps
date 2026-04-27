// Sprint P0.7-septies — Tests du module partagé admin-hosts.
//
// Source unique de vérité pour la détection des sous-domaines admin/prof,
// utilisée à la fois par le proxy (edge runtime) et par le layout [locale]
// (nodejs runtime).

import { describe, it, expect } from "vitest";
import {
  isAdminHost,
  isProfHost,
  ADMIN_HOSTS,
  PROF_HOSTS,
} from "@/lib/admin-hosts";

describe("admin-hosts — isAdminHost", () => {
  it("admin.muscu-eps.fr → true", () => {
    expect(isAdminHost("admin.muscu-eps.fr")).toBe(true);
  });

  it("design-admin.muscu-eps.fr → true (preview)", () => {
    expect(isAdminHost("design-admin.muscu-eps.fr")).toBe(true);
  });

  it("admin.localhost:3000 → true (dev local)", () => {
    expect(isAdminHost("admin.localhost:3000")).toBe(true);
  });

  it("admin.localhost (sans port) → true", () => {
    expect(isAdminHost("admin.localhost")).toBe(true);
  });

  it("muscu-eps.fr → false (host élève)", () => {
    expect(isAdminHost("muscu-eps.fr")).toBe(false);
  });

  it("prof.muscu-eps.fr → false (host prof)", () => {
    expect(isAdminHost("prof.muscu-eps.fr")).toBe(false);
  });

  it("design.muscu-eps.fr → false (preview élève)", () => {
    expect(isAdminHost("design.muscu-eps.fr")).toBe(false);
  });

  it("string vide → false", () => {
    expect(isAdminHost("")).toBe(false);
  });
});

describe("admin-hosts — isProfHost", () => {
  it("prof.muscu-eps.fr → true", () => {
    expect(isProfHost("prof.muscu-eps.fr")).toBe(true);
  });

  it("design-prof.muscu-eps.fr → true (preview)", () => {
    expect(isProfHost("design-prof.muscu-eps.fr")).toBe(true);
  });

  it("admin.muscu-eps.fr → false (host admin)", () => {
    expect(isProfHost("admin.muscu-eps.fr")).toBe(false);
  });

  it("muscu-eps.fr → false (host élève)", () => {
    expect(isProfHost("muscu-eps.fr")).toBe(false);
  });
});

describe("admin-hosts — ADMIN_HOSTS / PROF_HOSTS sets", () => {
  it("ADMIN_HOSTS contient les 2 hosts canoniques", () => {
    expect(ADMIN_HOSTS.has("admin.muscu-eps.fr")).toBe(true);
    expect(ADMIN_HOSTS.has("design-admin.muscu-eps.fr")).toBe(true);
    expect(ADMIN_HOSTS.size).toBe(2);
  });

  it("PROF_HOSTS contient les 2 hosts canoniques", () => {
    expect(PROF_HOSTS.has("prof.muscu-eps.fr")).toBe(true);
    expect(PROF_HOSTS.has("design-prof.muscu-eps.fr")).toBe(true);
    expect(PROF_HOSTS.size).toBe(2);
  });

  it("aucun chevauchement entre ADMIN_HOSTS et PROF_HOSTS", () => {
    for (const host of ADMIN_HOSTS) {
      expect(PROF_HOSTS.has(host)).toBe(false);
    }
  });
});
