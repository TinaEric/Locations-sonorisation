
const cle = (numReservation) => `paiement_${numReservation}`;

export const sauvegarderInfosPaiement = (numReservation, infos) => {
  try {
    sessionStorage.setItem(
      cle(numReservation),
      JSON.stringify({ ...infos, numReservation, dateSauvegarde: Date.now() })
    );
  } catch (e) {
    console.warn("[sauvegarderInfosPaiement] échec stockage", e);
  }
};


export const lireInfosPaiement = (numReservation) => {
  try {
    return JSON.parse(sessionStorage.getItem(cle(numReservation)) ?? "null");
  } catch {
    return null;
  }
};
