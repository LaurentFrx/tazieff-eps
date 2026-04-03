import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "fr", setLang: () => {} }),
}));

vi.mock("@/lib/search/search", () => ({
  search: (query: string) => {
    if (query.toLowerCase().includes("squat")) {
      return [{ type: "exercice", items: [{ slug: "s1-01", title: "Squat", href: "/exercices/s1-01", searchText: "squat" }] }];
    }
    return [];
  },
}));

const mockPush = vi.fn();

import { HomeSearchBar } from "./HomeSearchBar";

describe("HomeSearchBar", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders input with placeholder", () => {
    render(<HomeSearchBar />);
    expect(screen.getByPlaceholderText("pages.home.searchPlaceholder")).toBeDefined();
  });

  it("shows no dropdown initially", () => {
    render(<HomeSearchBar />);
    expect(screen.queryByText("search.typeExercice")).toBeNull();
  });

  it("shows results after typing a matching query", async () => {
    render(<HomeSearchBar />);
    const input = screen.getByPlaceholderText("pages.home.searchPlaceholder");
    fireEvent.change(input, { target: { value: "squat" } });
    await waitFor(() => {
      expect(screen.getByText("Squat")).toBeDefined();
      expect(screen.getByText("search.typeExercice")).toBeDefined();
    }, { timeout: 500 });
  });

  it("shows no-results message for non-matching query", async () => {
    render(<HomeSearchBar />);
    const input = screen.getByPlaceholderText("pages.home.searchPlaceholder");
    fireEvent.change(input, { target: { value: "xyznotfound" } });
    await waitFor(() => {
      expect(screen.getByText("search.noResults")).toBeDefined();
    }, { timeout: 500 });
  });

  it("navigates on result click", async () => {
    render(<HomeSearchBar />);
    const input = screen.getByPlaceholderText("pages.home.searchPlaceholder");
    fireEvent.change(input, { target: { value: "squat" } });
    await waitFor(() => expect(screen.getByText("Squat")).toBeDefined(), { timeout: 500 });
    fireEvent.click(screen.getByText("Squat").closest("button")!);
    expect(mockPush).toHaveBeenCalledWith("/exercices/s1-01");
  });

  it("shows clear button when text is entered", () => {
    render(<HomeSearchBar />);
    const input = screen.getByPlaceholderText("pages.home.searchPlaceholder");
    fireEvent.change(input, { target: { value: "test" } });
    expect(screen.getByLabelText("Clear")).toBeDefined();
  });

  it("clears input on clear button click", () => {
    render(<HomeSearchBar />);
    const input = screen.getByPlaceholderText("pages.home.searchPlaceholder") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(screen.getByLabelText("Clear"));
    expect(input.value).toBe("");
  });
});
