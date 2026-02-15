import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTeacherMode, _getSnapshot, _emit } from "./useTeacherMode";

beforeEach(() => {
  delete window.__teacherMode;
});

describe("useTeacherMode", () => {
  it("returns locked state by default", () => {
    const { result } = renderHook(() => useTeacherMode());
    expect(result.current.unlocked).toBe(false);
    expect(result.current.pin).toBe("");
  });

  it("reads existing window.__teacherMode", () => {
    window.__teacherMode = { unlocked: true, pin: "1234" };
    const { result } = renderHook(() => useTeacherMode());
    expect(result.current.unlocked).toBe(true);
    expect(result.current.pin).toBe("1234");
  });

  it("unlock sets window.__teacherMode and updates state", () => {
    const { result } = renderHook(() => useTeacherMode());
    act(() => {
      result.current.unlock("5678");
    });
    expect(result.current.unlocked).toBe(true);
    expect(result.current.pin).toBe("5678");
    expect(window.__teacherMode).toEqual({ unlocked: true, pin: "5678" });
  });

  it("lock resets to locked state", () => {
    window.__teacherMode = { unlocked: true, pin: "1234" };
    const { result } = renderHook(() => useTeacherMode());
    act(() => {
      result.current.lock();
    });
    expect(result.current.unlocked).toBe(false);
    expect(result.current.pin).toBe("");
  });

  it("dispatches custom event on unlock", () => {
    const { result } = renderHook(() => useTeacherMode());
    let eventFired = false;
    window.addEventListener("teacherModeChange", () => {
      eventFired = true;
    }, { once: true });
    act(() => {
      result.current.unlock("0000");
    });
    expect(eventFired).toBe(true);
  });

  it("dispatches custom event on lock", () => {
    window.__teacherMode = { unlocked: true, pin: "1234" };
    const { result } = renderHook(() => useTeacherMode());
    let eventFired = false;
    window.addEventListener("teacherModeChange", () => {
      eventFired = true;
    }, { once: true });
    act(() => {
      result.current.lock();
    });
    expect(eventFired).toBe(true);
  });

  it("_getSnapshot returns default when window.__teacherMode is undefined", () => {
    delete window.__teacherMode;
    const snapshot = _getSnapshot();
    expect(snapshot.unlocked).toBe(false);
    expect(snapshot.pin).toBe("");
  });

  it("_getSnapshot coerces truthy unlocked to boolean", () => {
    // @ts-expect-error — testing coercion
    window.__teacherMode = { unlocked: 1, pin: "abc" };
    const snapshot = _getSnapshot();
    expect(snapshot.unlocked).toBe(true);
  });

  it("reacts to external _emit calls", () => {
    const { result } = renderHook(() => useTeacherMode());
    window.__teacherMode = { unlocked: true, pin: "ext" };
    act(() => {
      _emit();
    });
    expect(result.current.unlocked).toBe(true);
    expect(result.current.pin).toBe("ext");
  });

  it("unlock then lock round-trip works", () => {
    const { result } = renderHook(() => useTeacherMode());
    act(() => {
      result.current.unlock("9999");
    });
    expect(result.current.unlocked).toBe(true);
    act(() => {
      result.current.lock();
    });
    expect(result.current.unlocked).toBe(false);
    expect(result.current.pin).toBe("");
  });
});
