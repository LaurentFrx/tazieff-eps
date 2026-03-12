/** Shared label helpers for enseignant components */

export function getEnseignantLabels(t: (key: string) => string) {
  return {
    niveauLabels: {
      seconde: t("enseignant.seconde"),
      premiere: t("enseignant.premiere"),
      terminale: t("enseignant.terminale"),
    } as Record<string, string>,
    objectifLabels: {
      endurance: t("enseignant.objEndurance"),
      volume: t("enseignant.objVolume"),
      puissance: t("enseignant.objPuissance"),
    } as Record<string, string>,
  };
}
