// Sprint E.4 (29 avril 2026) — couverture du endpoint élève
// GET /api/exercises/[slug]/annotations.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/live/student-annotations", () => ({
  fetchStudentAnnotations: vi.fn(),
  FALLBACK_DISPLAY_NAME: "Ton prof",
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchStudentAnnotations } from "@/lib/live/student-annotations";
import { GET } from "@/app/api/exercises/[slug]/annotations/route";

const mockCreate = createSupabaseServerClient as unknown as ReturnType<
  typeof vi.fn
>;
const mockFetch = fetchStudentAnnotations as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  mockCreate.mockReset();
  mockFetch.mockReset();
  // Stub minimal supabase client (les tests ne se servent que de
  // fetchStudentAnnotations, qui est mocké).
  mockCreate.mockResolvedValue({});
});

function makeRequest(slug: string, locale = "fr") {
  const url = `https://test.local/api/exercises/${slug}/annotations?locale=${locale}`;
  return new NextRequest(url);
}

function makeCtx(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/exercises/[slug]/annotations", () => {
  it("retourne 200 + array vide si fetchStudentAnnotations renvoie []", async () => {
    mockFetch.mockResolvedValue([]);
    const res = await GET(makeRequest("s1-01"), makeCtx("s1-01"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { annotations: unknown[] };
    expect(body.annotations).toEqual([]);
  });

  it("transmet les annotations au format StudentAnnotationItem", async () => {
    mockFetch.mockResolvedValue([
      {
        id: "ann-1",
        content: { notes: "Hi" },
        scope: "class",
        section_target: "resume",
        author_display_name: "Mme D.",
        author_user_id: "u-1",
        organization_id: "org-1",
        created_at: "2026-04-29T10:00:00.000Z",
      },
    ]);
    const res = await GET(makeRequest("s1-01"), makeCtx("s1-01"));
    const body = (await res.json()) as {
      annotations: Array<{ author_display_name: string; section_target: string }>;
    };
    expect(body.annotations).toHaveLength(1);
    expect(body.annotations[0].author_display_name).toBe("Mme D.");
    expect(body.annotations[0].section_target).toBe("resume");
  });

  it("400 si slug est vide", async () => {
    const res = await GET(makeRequest(""), makeCtx(""));
    expect(res.status).toBe(400);
  });

  it("400 si locale est invalide", async () => {
    const res = await GET(makeRequest("s1-01", "de"), makeCtx("s1-01"));
    expect(res.status).toBe(400);
  });

  it("Cache-Control: no-store (pas de cache HTTP — refresh à chaque reload)", async () => {
    mockFetch.mockResolvedValue([]);
    const res = await GET(makeRequest("s1-01"), makeCtx("s1-01"));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("locale par défaut est 'fr' quand le param est absent", async () => {
    mockFetch.mockResolvedValue([]);
    const url = `https://test.local/api/exercises/s1-01/annotations`;
    const req = new NextRequest(url);
    const res = await GET(req, makeCtx("s1-01"));
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), "s1-01", "fr");
  });
});
