import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./useAuth";
import { AuthContext } from "@/lib/supabase/AuthProvider";

describe("useAuth", () => {
  it("returns the default context when no provider is present", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toEqual({
      user: null,
      isLoading: true,
      isAnonymous: false,
    });
  });

  it("returns the context value when wrapped in a provider", () => {
    const fakeUser = {
      id: "u1",
      email: "prof@ac-bordeaux.fr",
    } as unknown as User;
    const value = { user: fakeUser, isLoading: false, isAnonymous: false };
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthContext.Provider, { value }, children);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBe(fakeUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAnonymous).toBe(false);
  });

  it("reflects the isAnonymous flag from the context value", () => {
    const value = {
      user: { id: "anon", is_anonymous: true } as unknown as User,
      isLoading: false,
      isAnonymous: true,
    };
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthContext.Provider, { value }, children);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAnonymous).toBe(true);
  });
});
