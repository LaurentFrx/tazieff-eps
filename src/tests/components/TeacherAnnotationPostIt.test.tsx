// Sprint E.4 (29 avril 2026) — couverture du post-it d'annotation prof
// affiché côté élève. Conformité GOUVERNANCE_EDITORIALE.md v1.1 §3.2 :
// pattern post-it Google Docs avec attribution explicite.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import TeacherAnnotationPostIt from "@/components/exercices/TeacherAnnotationPostIt";

describe("TeacherAnnotationPostIt", () => {
  it("affiche le titre, le contenu et le nom du prof", () => {
    render(
      <TeacherAnnotationPostIt
        id="ann-1"
        content={{ title: "Focus dos plat", notes: "Bassin neutre, ne creuse pas." }}
        authorDisplayName="Mme Dupont"
        scope="class"
        sectionTarget="resume"
      />,
    );

    expect(screen.getByText("Focus dos plat")).toBeTruthy();
    expect(
      screen.getByText("Bassin neutre, ne creuse pas."),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-annotation-author").textContent,
    ).toBe("Mme Dupont");
  });

  it("retourne null si scope='private' (défense en profondeur)", () => {
    const { container } = render(
      <TeacherAnnotationPostIt
        id="ann-priv"
        content={{ notes: "Note privée du prof" }}
        authorDisplayName="Mme Dupont"
        scope="private"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("utilise le fallback 'Ton prof' quand authorDisplayName est null", () => {
    render(
      <TeacherAnnotationPostIt
        id="ann-2"
        content={{ notes: "Hello" }}
        authorDisplayName={null}
        scope="school"
      />,
    );
    expect(
      screen.getByTestId("teacher-annotation-author").textContent,
    ).toBe("Ton prof");
  });

  it("utilise le fallback 'Ton prof' quand authorDisplayName est vide", () => {
    render(
      <TeacherAnnotationPostIt
        id="ann-3"
        content={{ notes: "Hello" }}
        authorDisplayName="   "
        scope="class"
      />,
    );
    expect(
      screen.getByTestId("teacher-annotation-author").textContent,
    ).toBe("Ton prof");
  });

  it("retourne null si content est vide (pas de title ni notes)", () => {
    const { container } = render(
      <TeacherAnnotationPostIt
        id="ann-empty"
        content={{}}
        authorDisplayName="Mme Dupont"
        scope="class"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("expose data-attributes pour les tests E2E (section + scope)", () => {
    render(
      <TeacherAnnotationPostIt
        id="ann-data"
        content={{ notes: "Hi" }}
        authorDisplayName="Mme Dupont"
        scope="school"
        sectionTarget="securite"
      />,
    );
    const node = screen.getByTestId("teacher-annotation-post-it");
    expect(node.getAttribute("data-annotation-id")).toBe("ann-data");
    expect(node.getAttribute("data-annotation-scope")).toBe("school");
    expect(node.getAttribute("data-annotation-section-target")).toBe(
      "securite",
    );
  });

  it("default sectionTarget data-attribute = 'general' quand absent", () => {
    render(
      <TeacherAnnotationPostIt
        id="ann-no-target"
        content={{ notes: "Hi" }}
        authorDisplayName="Mme Dupont"
        scope="class"
      />,
    );
    const node = screen.getByTestId("teacher-annotation-post-it");
    expect(node.getAttribute("data-annotation-section-target")).toBe(
      "general",
    );
  });
});
