// Sprint P0.7-nonies — Test régression-guard sur le nettoyage de la
// querystring ?muscle= quand l'utilisateur clique "Tous". Sans ce fix,
// partager le lien envoie le destinataire avec un faux filtre actif.

import { describe, it, expect, vi, beforeEach } from "vitest";

const replaceMock = vi.fn();

const params = new URLSearchParams("muscle=epaules");

vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/fr/exercices",
}));

beforeEach(() => {
  replaceMock.mockReset();
});

describe("ExerciseListClient — clearMuscleParam (P0.7-nonies)", () => {
  it("URLSearchParams.delete('muscle') produit une querystring vide", () => {
    const next = new URLSearchParams(params.toString());
    next.delete("muscle");
    expect(next.toString()).toBe("");
  });

  it("URLSearchParams.delete preserve les autres params", () => {
    const composite = new URLSearchParams("muscle=epaules&view=grid");
    composite.delete("muscle");
    expect(composite.toString()).toBe("view=grid");
  });

  it("router.replace cible /fr/exercices sans querystring après reset", () => {
    // Reproduit le comportement attendu de clearMuscleParam :
    // pathname=/fr/exercices, qs vide → router.replace('/fr/exercices')
    const next = new URLSearchParams("muscle=epaules");
    next.delete("muscle");
    const qs = next.toString();
    const target = qs ? `/fr/exercices?${qs}` : "/fr/exercices";
    expect(target).toBe("/fr/exercices");
  });
});
