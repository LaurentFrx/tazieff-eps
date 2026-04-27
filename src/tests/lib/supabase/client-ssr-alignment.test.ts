// Sprint P0.7-quinquies — Test d'alignement client.ts ↔ browser.ts.
//
// Garantit que le client navigateur "legacy" (client.ts) délègue bien à
// l'instance @supabase/ssr (browser.ts) — preuve structurelle que le fix
// du bug "édition au clic inactive sur miroir admin" reste en place.
//
// Si un futur changement réintroduit createClient(@supabase/supabase-js)
// dans client.ts, ce test échoue : la session repasse en localStorage et
// le bug PKCE/cookies réapparaît sur le miroir admin.

import { describe, it, expect, vi, beforeEach } from "vitest";

const fakeSsrClient = {
  __ssr_marker: true,
  auth: { getSession: vi.fn(), signInWithOtp: vi.fn() },
};

vi.mock("@/lib/supabase/browser", () => ({
  getSupabaseBrowserClient: vi.fn(() => fakeSsrClient),
}));

import {
  getSupabaseBrowserClient,
  getSupabaseBrowserClientAsync,
} from "@/lib/supabase/client";
import { getSupabaseBrowserClient as getSsrBrowserClient } from "@/lib/supabase/browser";

beforeEach(() => {
  (getSsrBrowserClient as unknown as ReturnType<typeof vi.fn>).mockClear();
});

describe("client.ts (legacy) — alignement sur browser.ts (P0.7-quinquies)", () => {
  it("getSupabaseBrowserClient retourne la même instance que browser.ts", () => {
    const legacy = getSupabaseBrowserClient();
    const ssr = getSsrBrowserClient();
    expect(legacy).toBe(ssr);
    expect((legacy as { __ssr_marker?: boolean })?.__ssr_marker).toBe(true);
  });

  it("getSupabaseBrowserClientAsync retourne la même instance (compat sync→async)", async () => {
    const legacyAsync = await getSupabaseBrowserClientAsync();
    const ssr = getSsrBrowserClient();
    expect(legacyAsync).toBe(ssr);
  });

  it("client.ts ne crée jamais sa propre instance via @supabase/supabase-js", () => {
    // Régression-guard : si client.ts importait createClient directement,
    // il ne passerait pas par le mock de browser.ts.
    getSupabaseBrowserClient();
    expect(getSsrBrowserClient).toHaveBeenCalledTimes(1);
  });
});
