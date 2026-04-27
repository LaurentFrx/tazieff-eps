// Sprint P0.8 — Délai artificiel constant pour empêcher l'énumération
// automatisée de comptes via timing attack.
//
// Appliqué aux routes de pré-check d'éligibilité magic-link (admin + prof).
// Le surplus de temps si le lookup BD est rapide est absorbé par le délai
// constant ; la latence variable du lookup reste largement inférieure.

export async function constantResponseDelay(targetMs = 1500): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, targetMs));
}
