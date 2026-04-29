// Sprint E.4 (29 avril 2026) — couverture du helper serveur
// fetchStudentAnnotations qui agrège les annotations prof + display_name
// pour le rendu post-it côté élève.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  fetchStudentAnnotations,
  FALLBACK_DISPLAY_NAME,
} from "@/lib/live/student-annotations";

type Row = {
  id: string;
  content: unknown;
  visibility_scope: "private" | "class" | "school";
  section_target: string | null;
  author_user_id: string;
  organization_id: string;
  created_at: string | null;
};
type MembershipRow = {
  user_id: string;
  organization_id: string;
  display_name: string | null;
};

function makeSupabase({
  user,
  rows,
  memberships,
  rowsError,
  membershipsError,
}: {
  user: { id: string } | null;
  rows: Row[] | null;
  memberships: MembershipRow[] | null;
  rowsError?: { message: string };
  membershipsError?: { message: string };
}) {
  const annotationsChain: Record<string, unknown> = {};
  annotationsChain.select = vi.fn(() => annotationsChain);
  annotationsChain.eq = vi.fn(() => annotationsChain);
  annotationsChain.is = vi.fn(() => annotationsChain);
  annotationsChain.order = vi.fn(() =>
    Promise.resolve({ data: rows, error: rowsError ?? null }),
  );

  const membershipsChain: Record<string, unknown> = {};
  membershipsChain.select = vi.fn(() => membershipsChain);
  membershipsChain.in = vi.fn(() => membershipsChain);
  let membershipsCallCount = 0;
  // The chain has .in().in() — simulate by returning a thenable on second .in.
  membershipsChain.in = vi.fn(() => {
    membershipsCallCount += 1;
    if (membershipsCallCount >= 2) {
      return Promise.resolve({
        data: memberships,
        error: membershipsError ?? null,
      });
    }
    return membershipsChain;
  });

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
    },
    from: vi.fn((table: string) => {
      if (table === "teacher_annotations") return annotationsChain;
      if (table === "memberships") return membershipsChain;
      return {};
    }),
  } as unknown as Parameters<typeof fetchStudentAnnotations>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchStudentAnnotations", () => {
  it("retourne [] si user anonyme (pas de fetch teacher_annotations)", async () => {
    const supabase = makeSupabase({
      user: null,
      rows: [],
      memberships: [],
    });
    const result = await fetchStudentAnnotations(supabase, "s1-01", "fr");
    expect(result).toEqual([]);
  });

  it("retourne [] si erreur Supabase sur teacher_annotations", async () => {
    const supabase = makeSupabase({
      user: { id: "u-1" },
      rows: null,
      memberships: [],
      rowsError: { message: "RLS denied" },
    });
    const result = await fetchStudentAnnotations(supabase, "s1-01", "fr");
    expect(result).toEqual([]);
  });

  it("retourne [] si aucune annotation pour le slug", async () => {
    const supabase = makeSupabase({
      user: { id: "u-1" },
      rows: [],
      memberships: [],
    });
    const result = await fetchStudentAnnotations(supabase, "s1-01", "fr");
    expect(result).toEqual([]);
  });

  it("mappe une annotation avec display_name lorsque memberships le fournit", async () => {
    const rows: Row[] = [
      {
        id: "ann-1",
        content: { notes: "Hello" },
        visibility_scope: "class",
        section_target: "resume",
        author_user_id: "u-prof",
        organization_id: "org-1",
        created_at: "2026-04-29T10:00:00.000Z",
      },
    ];
    const memberships: MembershipRow[] = [
      { user_id: "u-prof", organization_id: "org-1", display_name: "Mme D." },
    ];
    const supabase = makeSupabase({
      user: { id: "u-eleve" },
      rows,
      memberships,
    });
    const result = await fetchStudentAnnotations(supabase, "s1-01", "fr");
    expect(result).toHaveLength(1);
    expect(result[0].author_display_name).toBe("Mme D.");
    expect(result[0].section_target).toBe("resume");
    expect(result[0].scope).toBe("class");
  });

  it("utilise le fallback quand display_name est null ou vide", async () => {
    const rows: Row[] = [
      {
        id: "ann-1",
        content: { notes: "Hi" },
        visibility_scope: "school",
        section_target: null,
        author_user_id: "u-prof",
        organization_id: "org-1",
        created_at: null,
      },
    ];
    const memberships: MembershipRow[] = [
      { user_id: "u-prof", organization_id: "org-1", display_name: null },
    ];
    const supabase = makeSupabase({
      user: { id: "u-eleve" },
      rows,
      memberships,
    });
    const result = await fetchStudentAnnotations(supabase, "s1-01", "fr");
    expect(result[0].author_display_name).toBe(FALLBACK_DISPLAY_NAME);
  });

  it("dégradation gracieuse si memberships fail (fallback display_name)", async () => {
    const rows: Row[] = [
      {
        id: "ann-1",
        content: { notes: "Hi" },
        visibility_scope: "class",
        section_target: "execution",
        author_user_id: "u-prof",
        organization_id: "org-1",
        created_at: null,
      },
    ];
    const supabase = makeSupabase({
      user: { id: "u-eleve" },
      rows,
      memberships: null,
      membershipsError: { message: "boom" },
    });
    const result = await fetchStudentAnnotations(supabase, "s1-01", "fr");
    expect(result).toHaveLength(1);
    expect(result[0].author_display_name).toBe(FALLBACK_DISPLAY_NAME);
  });
});
