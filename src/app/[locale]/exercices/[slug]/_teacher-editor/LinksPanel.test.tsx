// Sprint E.3 (28 avril 2026) — couverture du LinksPanel : rendu des pills,
// ajout/retrait via la combobox, propagation au parent via onChange.
//
// Le panneau est testé en isolation : on injecte le catalogue via
// `initialCatalog` pour contourner le fetch HTTP, et on mock useI18n pour
// renvoyer une fonction `t()` qui produit la clé brute.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: "fr",
  }),
}));

import LinksPanel, { type CatalogSlugsPayload } from "./LinksPanel";

const catalog: CatalogSlugsPayload = {
  methodes: [
    { slug: "amrap", title: "AMRAP" },
    { slug: "circuit-training", title: "Circuit training" },
    { slug: "drop-set", title: "Drop set" },
  ],
  exercices: [
    { slug: "s1-01", title: "Planche frontale sur coudes" },
    { slug: "s1-02", title: "Pont fessier" },
    { slug: "s2-01", title: "Squat à vide" },
  ],
};

describe("LinksPanel", () => {
  it("affiche les pills initiales pour méthodes et exercices", () => {
    render(
      <LinksPanel
        methodesValue={["amrap"]}
        exercicesValue={["s1-01", "s2-01"]}
        onChangeMethodes={vi.fn()}
        onChangeExercices={vi.fn()}
        initialCatalog={catalog}
      />,
    );

    // Les libellés (titles) sont rendus, pas les slugs bruts.
    expect(screen.getByText("AMRAP")).toBeTruthy();
    expect(screen.getByText("Planche frontale sur coudes")).toBeTruthy();
    expect(screen.getByText("Squat à vide")).toBeTruthy();
  });

  it("affiche le message 'aucune méthode' quand methodesValue est vide", () => {
    render(
      <LinksPanel
        methodesValue={[]}
        exercicesValue={["s1-01"]}
        onChangeMethodes={vi.fn()}
        onChangeExercices={vi.fn()}
        initialCatalog={catalog}
      />,
    );

    expect(
      screen.getByText("exerciseEditor.noMethodeSelected"),
    ).toBeTruthy();
  });

  it("appelle onChangeMethodes(next) quand on retire une pill méthode", () => {
    const onChangeMethodes = vi.fn();
    render(
      <LinksPanel
        methodesValue={["amrap", "circuit-training"]}
        exercicesValue={[]}
        onChangeMethodes={onChangeMethodes}
        onChangeExercices={vi.fn()}
        initialCatalog={catalog}
      />,
    );

    const removeButton = screen.getByTestId(
      "links-panel-methodes-remove-amrap",
    );
    fireEvent.click(removeButton);

    expect(onChangeMethodes).toHaveBeenCalledTimes(1);
    expect(onChangeMethodes).toHaveBeenCalledWith(["circuit-training"]);
  });

  it("appelle onChangeExercices(next) quand on coche une option dans la combobox", () => {
    const onChangeExercices = vi.fn();
    render(
      <LinksPanel
        methodesValue={[]}
        exercicesValue={["s1-01"]}
        onChangeMethodes={vi.fn()}
        onChangeExercices={onChangeExercices}
        initialCatalog={catalog}
      />,
    );

    // Ouvrir la combobox exercices
    fireEvent.click(screen.getByTestId("links-panel-exercices-toggle"));

    // Cliquer sur l'option s2-01 (qui n'est pas encore dans la value)
    const option = screen.getByTestId("links-panel-exercices-option-s2-01");
    fireEvent.click(option);

    expect(onChangeExercices).toHaveBeenCalledTimes(1);
    expect(onChangeExercices).toHaveBeenCalledWith(["s1-01", "s2-01"]);
  });

  it("filtre les options de la combobox via la recherche", () => {
    render(
      <LinksPanel
        methodesValue={[]}
        exercicesValue={[]}
        onChangeMethodes={vi.fn()}
        onChangeExercices={vi.fn()}
        initialCatalog={catalog}
      />,
    );

    // Ouvrir la combobox exercices
    fireEvent.click(screen.getByTestId("links-panel-exercices-toggle"));

    // Avant filtre : 3 options visibles
    expect(
      screen.getByTestId("links-panel-exercices-option-s1-01"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("links-panel-exercices-option-s2-01"),
    ).toBeTruthy();

    // Saisir "Pont" → seul s1-02 (Pont fessier) doit rester
    const searchInput = screen.getByTestId("links-panel-exercices-search");
    fireEvent.change(searchInput, { target: { value: "Pont" } });

    expect(screen.queryByTestId("links-panel-exercices-option-s1-01")).toBeNull();
    expect(
      screen.getByTestId("links-panel-exercices-option-s1-02"),
    ).toBeTruthy();
    expect(screen.queryByTestId("links-panel-exercices-option-s2-01")).toBeNull();
  });

  it("la recherche matche aussi sur le slug, pas seulement le titre", () => {
    render(
      <LinksPanel
        methodesValue={[]}
        exercicesValue={[]}
        onChangeMethodes={vi.fn()}
        onChangeExercices={vi.fn()}
        initialCatalog={catalog}
      />,
    );

    fireEvent.click(screen.getByTestId("links-panel-exercices-toggle"));
    fireEvent.change(screen.getByTestId("links-panel-exercices-search"), {
      target: { value: "s2" },
    });

    expect(
      screen.getByTestId("links-panel-exercices-option-s2-01"),
    ).toBeTruthy();
    expect(screen.queryByTestId("links-panel-exercices-option-s1-01")).toBeNull();
  });
});
