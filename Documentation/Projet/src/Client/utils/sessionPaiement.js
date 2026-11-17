// Client/utils/sessionPaiement.js
// Garde les montants de la réservation créée pour la page de paiement (survit au rechargement).
const cle = (numReservation) => `paiement_${numReservation}`;

export const sauvegarderInfosPaiement = (numReservation, infos) => {
  try {
    sessionStorage.setItem(cle(numReservation), JSON.stringify(infos));
  } catch {
    /* stockage indisponible : la page de paiement relira la réservation */
  }
};

export const lireInfosPaiement = (numReservation) => {
  try {
    return JSON.parse(sessionStorage.getItem(cle(numReservation)) ?? "null");
  } catch {
    return null;
  }
};
