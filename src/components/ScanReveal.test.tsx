import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScanReveal } from "./ScanReveal";

// Mock storage module
vi.mock("@/lib/storage", () => ({
  getAnatomyAnim: vi.fn(() => true),
}));

import { getAnatomyAnim } from "@/lib/storage";
const mockGetAnatomyAnim = getAnatomyAnim as ReturnType<typeof vi.fn>;

// Mock matchMedia
function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("reduced-motion") ? reducedMotion : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

// Mock IntersectionObserver
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ScanReveal", () => {
  it("renders children content", () => {
    mockMatchMedia(false);
    mockGetAnatomyAnim.mockReturnValue(true);
    render(
      <ScanReveal>
        <p>Test content</p>
      </ScanReveal>,
    );
    expect(screen.getByText("Test content")).toBeDefined();
  });

  it("shows scan line when animation toggle is enabled", () => {
    mockMatchMedia(false);
    mockGetAnatomyAnim.mockReturnValue(true);
    const { container } = render(
      <ScanReveal>
        <p>Content</p>
      </ScanReveal>,
    );
    // The scan-reveal-container should exist (animation enabled)
    expect(container.querySelector(".scan-reveal-container")).not.toBeNull();
  });

  it("does not show scan line when animation toggle is disabled", () => {
    mockMatchMedia(false);
    mockGetAnatomyAnim.mockReturnValue(false);
    const { container } = render(
      <ScanReveal>
        <p>Content</p>
      </ScanReveal>,
    );
    // No scan-reveal-container — animation disabled
    expect(container.querySelector(".scan-reveal-container")).toBeNull();
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("does not show scan line when prefers-reduced-motion is active", () => {
    mockMatchMedia(true);
    mockGetAnatomyAnim.mockReturnValue(true);
    const { container } = render(
      <ScanReveal>
        <p>Content</p>
      </ScanReveal>,
    );
    expect(container.querySelector(".scan-reveal-container")).toBeNull();
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("does not wrap the header — only children are inside ScanReveal", () => {
    mockMatchMedia(false);
    mockGetAnatomyAnim.mockReturnValue(true);
    render(
      <div>
        <header data-testid="page-header">
          <h1>Page Title</h1>
        </header>
        <ScanReveal>
          <div data-testid="page-content">MDX content here</div>
        </ScanReveal>
      </div>,
    );

    const header = screen.getByTestId("page-header");
    const content = screen.getByTestId("page-content");

    // Header should NOT be inside the scan-reveal-container
    expect(header.closest(".scan-reveal-container")).toBeNull();
    // Content should be inside
    expect(content.closest(".scan-reveal-container")).not.toBeNull();
  });
});
