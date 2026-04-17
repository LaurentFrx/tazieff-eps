import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import type { User } from "@supabase/supabase-js";

type OrgRow = {
  id: string;
  is_pro: boolean;
  pro_expires_at: string | null;
};

type MockClient = { from: ReturnType<typeof vi.fn> };

const { supabaseHolder } = vi.hoisted(() => ({
  supabaseHolder: { client: null as MockClient | null },
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => supabaseHolder.client,
}));

import { AuthContext } from "@/lib/supabase/AuthProvider";
import { usePlan } from "./usePlan";

const ORG_CODE_KEY = "tazieff-org-code";
const PLAN_CACHE_KEY = "tazieff-plan-cache";

function createMockSupabase(
  data: OrgRow | null,
  error: unknown = null,
): MockClient {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const from = vi.fn().mockReturnValue({ select });
  return { from };
}

type AuthOverride = {
  user: Partial<User> | null;
  isLoading?: boolean;
  isAnonymous?: boolean;
};

function renderPlan(auth: AuthOverride) {
  const value = {
    user: (auth.user ?? null) as User | null,
    isLoading: auth.isLoading ?? false,
    isAnonymous: auth.isAnonymous ?? false,
  };
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(AuthContext.Provider, { value }, children);
  return renderHook(() => usePlan(), { wrapper });
}

beforeEach(() => {
  localStorage.clear();
  supabaseHolder.client = null;
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePlan", () => {
  it("stays in loading state while auth is loading", () => {
    const { result } = renderPlan({ user: null, isLoading: true });
    expect(result.current.isLoading).toBe(true);
  });

  it("returns pro instantly for academic emails (no Supabase call)", async () => {
    const { result } = renderPlan({
      user: { email: "prof@ac-bordeaux.fr" } as Partial<User>,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("pro");
    expect(result.current.isPro).toBe(true);
  });

  it("recognises education.gouv.fr addresses as pro", async () => {
    const { result } = renderPlan({
      user: { email: "agent@education.gouv.fr" } as Partial<User>,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("pro");
  });

  it("returns free when there is no user and no org code", async () => {
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("free");
    expect(result.current.isPro).toBe(false);
  });

  it("returns pro when the org code matches an active pro organization", async () => {
    localStorage.setItem(ORG_CODE_KEY, "LYCEE2026");
    supabaseHolder.client = createMockSupabase({
      id: "org-1",
      is_pro: true,
      pro_expires_at: null,
    });
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("pro");
  });

  it("returns pro when pro_expires_at is in the future", async () => {
    localStorage.setItem(ORG_CODE_KEY, "VALID");
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    supabaseHolder.client = createMockSupabase({
      id: "org-2",
      is_pro: true,
      pro_expires_at: future,
    });
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("pro");
  });

  it("returns free when pro_expires_at is in the past", async () => {
    localStorage.setItem(ORG_CODE_KEY, "EXPIRED");
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    supabaseHolder.client = createMockSupabase({
      id: "org-3",
      is_pro: true,
      pro_expires_at: past,
    });
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("free");
  });

  it("returns free when Supabase finds no matching org for the code", async () => {
    localStorage.setItem(ORG_CODE_KEY, "UNKNOWN");
    supabaseHolder.client = createMockSupabase(null);
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("free");
  });

  it("falls back to a fresh cache when offline", async () => {
    localStorage.setItem(ORG_CODE_KEY, "OFFLINE");
    localStorage.setItem(
      PLAN_CACHE_KEY,
      JSON.stringify({ plan: "pro", timestamp: Date.now() }),
    );
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("pro");
  });

  it("returns free when offline without any cached plan", async () => {
    localStorage.setItem(ORG_CODE_KEY, "OFFLINE");
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("free");
  });

  it("ignores cache older than 7 days", async () => {
    localStorage.setItem(ORG_CODE_KEY, "STALE");
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      PLAN_CACHE_KEY,
      JSON.stringify({ plan: "pro", timestamp: eightDaysAgo }),
    );
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    const { result } = renderPlan({ user: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plan).toBe("free");
  });

  it("persists the resolved plan into the cache", async () => {
    const { result } = renderPlan({
      user: { email: "prof@ac-paris.fr" } as Partial<User>,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const cached = JSON.parse(localStorage.getItem(PLAN_CACHE_KEY) ?? "null");
    expect(cached?.plan).toBe("pro");
  });
});
