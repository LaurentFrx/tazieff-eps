import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "./useFavorites";

const STORAGE_KEY = "eps_favorites";

beforeEach(() => {
  localStorage.clear();
  // Reset the internal cache of favoritesStore by writing a known value
  localStorage.setItem(STORAGE_KEY, "[]");
  // Dispatch storage event to sync cache
  window.dispatchEvent(
    new StorageEvent("storage", { key: STORAGE_KEY, newValue: "[]" }),
  );
});

describe("useFavorites", () => {
  it("returns empty array initially", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("isFavorite returns false for unknown slug", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite("unknown")).toBe(false);
  });

  it("toggle adds a slug to favorites", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggle("pompes");
    });
    expect(result.current.favorites).toContain("pompes");
    expect(result.current.isFavorite("pompes")).toBe(true);
  });

  it("toggle removes a slug that is already favorite", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggle("pompes");
    });
    act(() => {
      result.current.toggle("pompes");
    });
    expect(result.current.favorites).not.toContain("pompes");
  });

  it("set replaces the entire favorites list", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.set(["a", "b", "c"]);
    });
    expect(result.current.favorites).toEqual(["a", "b", "c"]);
  });

  it("persists favorites to localStorage", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggle("squats");
    });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toContain("squats");
  });

  it("isFavorite reflects multiple additions", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggle("a");
    });
    act(() => {
      result.current.toggle("b");
    });
    expect(result.current.isFavorite("a")).toBe(true);
    expect(result.current.isFavorite("b")).toBe(true);
    expect(result.current.isFavorite("c")).toBe(false);
  });

  it("set with empty array clears favorites", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.set(["x", "y"]);
    });
    act(() => {
      result.current.set([]);
    });
    expect(result.current.favorites).toEqual([]);
  });

  it("handles rapid toggles correctly", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggle("a");
      result.current.toggle("b");
      result.current.toggle("c");
    });
    expect(result.current.favorites).toContain("a");
    expect(result.current.favorites).toContain("b");
    expect(result.current.favorites).toContain("c");
  });

  it("returns stable reference for toggle and set callbacks", () => {
    const { result, rerender } = renderHook(() => useFavorites());
    const toggle1 = result.current.toggle;
    const set1 = result.current.set;
    rerender();
    expect(result.current.toggle).toBe(toggle1);
    expect(result.current.set).toBe(set1);
  });

  it("favorites snapshot updates across set calls", () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.set(["x"]);
    });
    expect(result.current.favorites).toEqual(["x"]);
    act(() => {
      result.current.set(["y"]);
    });
    expect(result.current.favorites).toEqual(["y"]);
  });

  it("toggle on fresh state works without error", () => {
    localStorage.removeItem(STORAGE_KEY);
    const { result } = renderHook(() => useFavorites());
    expect(() => {
      act(() => {
        result.current.toggle("new-item");
      });
    }).not.toThrow();
  });
});
