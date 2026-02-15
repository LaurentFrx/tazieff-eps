import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { LiveExerciseRow } from "@/lib/live/types";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

let mockSubscribeCallback: ((status: string) => void) | null = null;
let mockOnCallback: ((payload: unknown) => void) | null = null;
let mockSelectData: LiveExerciseRow[] | null = null;

const mockUnsubscribe = vi.fn();
const mockRemoveChannel = vi.fn();

const mockChannel = {
  on: vi.fn((_event: string, _filter: unknown, cb: (payload: unknown) => void) => {
    mockOnCallback = cb;
    return mockChannel;
  }),
  subscribe: vi.fn((cb: (status: string) => void) => {
    mockSubscribeCallback = cb;
    return mockChannel;
  }),
  unsubscribe: mockUnsubscribe,
};

const mockFrom = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn(() => Promise.resolve({ data: mockSelectData })),
};

const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  from: vi.fn(() => mockFrom),
  removeChannel: mockRemoveChannel,
};

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}));

// Must import AFTER mock setup
import { useExercisesLiveSync } from "./useExercisesLiveSync";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRow(slug: string): LiveExerciseRow {
  return {
    slug,
    locale: "fr",
    data_json: {
      frontmatter: {
        title: slug,
        slug,
        tags: ["test"],
        themeCompatibility: [1],
        muscles: ["test"],
      },
      content: "",
    },
  };
}

const initialRows = [makeRow("pompes"), makeRow("squats")];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  mockSubscribeCallback = null;
  mockOnCallback = null;
  mockSelectData = null;
  vi.clearAllMocks();
  // Make document visible by default
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useExercisesLiveSync", () => {
  it("returns initial data on first render", () => {
    const { result } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    expect(result.current.liveExercises).toEqual(initialRows);
    expect(result.current.isRealtimeReady).toBe(false);
  });

  it("creates a Supabase channel for the given locale", () => {
    renderHook(() => useExercisesLiveSync("fr", initialRows));
    expect(mockSupabase.channel).toHaveBeenCalledWith("live-exercises-fr");
  });

  it("subscribes to postgres_changes on live_exercises table", () => {
    renderHook(() => useExercisesLiveSync("fr", initialRows));
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "*",
        schema: "public",
        table: "live_exercises",
        filter: "locale=eq.fr",
      }),
      expect.any(Function),
    );
  });

  it("sets isRealtimeReady=true when SUBSCRIBED", () => {
    const { result } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    act(() => {
      mockSubscribeCallback?.("SUBSCRIBED");
    });
    expect(result.current.isRealtimeReady).toBe(true);
  });

  it("upserts a row on INSERT/UPDATE payload", () => {
    const { result } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    const newRow = makeRow("burpees");
    act(() => {
      mockOnCallback?.({ eventType: "INSERT", new: newRow, old: {} });
    });
    expect(result.current.liveExercises.find((r) => r.slug === "burpees")).toBeTruthy();
  });

  it("removes a row on DELETE payload", () => {
    const { result } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    act(() => {
      mockOnCallback?.({ eventType: "DELETE", old: { slug: "pompes" }, new: {} });
    });
    expect(result.current.liveExercises.find((r) => r.slug === "pompes")).toBeUndefined();
  });

  it("retries with exponential backoff on CHANNEL_ERROR", () => {
    renderHook(() => useExercisesLiveSync("fr", initialRows));
    act(() => {
      mockSubscribeCallback?.("CHANNEL_ERROR");
    });
    expect(mockUnsubscribe).toHaveBeenCalled();
    // First retry delay: min(30000, 2000 * 2^0) = 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Channel should have been recreated (channel called again)
    expect(mockSupabase.channel).toHaveBeenCalledTimes(3); // initial + error recreate + retry
  });

  it("polls when realtime is not ready", async () => {
    mockSelectData = [makeRow("polled")];
    const { result } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    // Initial fetch happens immediately
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockFrom.select).toHaveBeenCalled();
    expect(result.current.liveExercises).toEqual([makeRow("polled")]);
  });

  it("stops polling when realtime becomes ready", async () => {
    mockSelectData = [makeRow("polled")];
    const { result } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    vi.clearAllMocks();
    // Simulate realtime becoming ready
    act(() => {
      mockSubscribeCallback?.("SUBSCRIBED");
    });
    expect(result.current.isRealtimeReady).toBe(true);
    // Advance past poll interval — no new poll should fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25_000);
    });
    expect(mockFrom.select).not.toHaveBeenCalled();
  });

  it("skips polling when document is hidden", async () => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
      configurable: true,
    });
    mockSelectData = [makeRow("hidden-poll")];
    renderHook(() => useExercisesLiveSync("fr", initialRows));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    // select should not have been called because document is hidden
    expect(mockFrom.eq).not.toHaveBeenCalled();
  });

  it("cleans up channel on unmount", () => {
    const { unmount } = renderHook(() =>
      useExercisesLiveSync("fr", initialRows),
    );
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it("uses different channel name for different locale", () => {
    renderHook(() => useExercisesLiveSync("en", initialRows));
    expect(mockSupabase.channel).toHaveBeenCalledWith("live-exercises-en");
  });
});
