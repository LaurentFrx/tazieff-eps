import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getTheme,
  setTheme,
  onThemeChange,
  getAnatomyAnim,
  setAnatomyAnim,
  onAnatomyAnimChange,
} from "./storage";

const THEME_KEY = "eps_field_theme";
const ANAT_KEY = "eps_anatomy_anim";

beforeEach(() => {
  localStorage.clear();
});

describe("getTheme", () => {
  it("returns 1 (default) when no value is stored", () => {
    expect(getTheme()).toBe(1);
  });

  it("returns the stored value when it is 1, 2 or 3", () => {
    localStorage.setItem(THEME_KEY, "2");
    expect(getTheme()).toBe(2);
    localStorage.setItem(THEME_KEY, "3");
    expect(getTheme()).toBe(3);
  });

  it("returns the default when the stored value is out of range", () => {
    localStorage.setItem(THEME_KEY, "99");
    expect(getTheme()).toBe(1);
  });

  it("returns the default when the stored value is not numeric", () => {
    localStorage.setItem(THEME_KEY, "abc");
    expect(getTheme()).toBe(1);
  });
});

describe("setTheme + onThemeChange", () => {
  it("persists the value in localStorage", () => {
    setTheme(2);
    expect(localStorage.getItem(THEME_KEY)).toBe("2");
  });

  it("notifies the listener with the new value", () => {
    const handler = vi.fn();
    const unsubscribe = onThemeChange(handler);
    setTheme(3);
    expect(handler).toHaveBeenCalledWith(3);
    unsubscribe();
  });

  it("stops notifications after unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = onThemeChange(handler);
    unsubscribe();
    setTheme(2);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("getAnatomyAnim", () => {
  it("defaults to true when no value is stored", () => {
    expect(getAnatomyAnim()).toBe(true);
  });

  it("returns false only when the stored value is exactly 'false'", () => {
    localStorage.setItem(ANAT_KEY, "false");
    expect(getAnatomyAnim()).toBe(false);
  });

  it("returns true for any non-'false' string value", () => {
    localStorage.setItem(ANAT_KEY, "true");
    expect(getAnatomyAnim()).toBe(true);
    localStorage.setItem(ANAT_KEY, "anything");
    expect(getAnatomyAnim()).toBe(true);
  });
});

describe("setAnatomyAnim + onAnatomyAnimChange", () => {
  it("persists boolean as a string in localStorage", () => {
    setAnatomyAnim(false);
    expect(localStorage.getItem(ANAT_KEY)).toBe("false");
    setAnatomyAnim(true);
    expect(localStorage.getItem(ANAT_KEY)).toBe("true");
  });

  it("notifies the listener with the new value", () => {
    const handler = vi.fn();
    const unsubscribe = onAnatomyAnimChange(handler);
    setAnatomyAnim(false);
    expect(handler).toHaveBeenCalledWith(false);
    unsubscribe();
  });
});
